import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { RedisLockService } from '../services/redisLock.js';
import {
  broadcastSeatsLocked,
  broadcastSeatsReleased,
  broadcastSeatsBooked
} from '../socket/gateway.js';

const router = express.Router();

const TTL_SECONDS = parseInt(process.env.SEAT_LOCK_TTL_SECONDS || '300', 10);
const CONVENIENCE_FEE = parseInt(process.env.CONVENIENCE_FEE_FLAT || '30', 10);

/**
 * Helper to compute price and tier for requested seats from Show & Theater layout
 */
async function computeSeatBreakdown(show, requestedSeatIds) {
  const theater = show.theater;
  const screen = theater.screens.find(s => s.screenNumber === show.screenNumber) || theater.screens[0];

  const breakdown = [];
  let baseAmount = 0;

  for (const seatId of requestedSeatIds) {
    let found = false;
    for (const tier of screen.tiers) {
      const tierPrice = (show.customTierPricing && show.customTierPricing[tier.tierType])
        ? show.customTierPricing[tier.tierType]
        : tier.defaultPrice;

      for (const row of tier.rows) {
        for (const num of row.seatNumbers) {
          if (`${row.rowId}${num}` === seatId) {
            breakdown.push({
              seatId,
              tier: tier.tierType,
              price: tierPrice
            });
            baseAmount += tierPrice;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      // Default fallback
      breakdown.push({
        seatId,
        tier: 'PRIME',
        price: 280
      });
      baseAmount += 280;
    }
  }

  const taxAmount = Math.round(baseAmount * 0.18);
  const grandTotal = baseAmount + CONVENIENCE_FEE + taxAmount;

  return { breakdown, baseAmount, convenienceFee: CONVENIENCE_FEE, taxAmount, grandTotal };
}

/**
 * POST /api/bookings/hold
 * Distributed seat locking endpoint (TRD 4.2)
 */
router.post('/hold', async (req, res, next) => {
  try {
    const { showId, seats, userId } = req.body;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_REQUEST',
        message: 'showId and seats array are required.'
      });
    }

    if (seats.length > 6) {
      return res.status(400).json({
        success: false,
        errorCode: 'MAX_SEATS_EXCEEDED',
        message: 'Maximum 6 seats per transaction permitted.'
      });
    }

    const show = await Show.findById(showId).populate('theater');
    if (!show) {
      return res.status(404).json({
        success: false,
        errorCode: 'SHOW_NOT_FOUND',
        message: 'Show not found.'
      });
    }

    // 1. Check if any seat is already permanently booked in MongoDB
    const bookedSeatIds = (show.bookedSeats || []).map(b => b.seatId);
    const permanentlyBookedConflicts = seats.filter(s => bookedSeatIds.includes(s));
    if (permanentlyBookedConflicts.length > 0) {
      return res.status(409).json({
        success: false,
        errorCode: 'SEAT_ALREADY_BOOKED',
        message: 'One or more selected seats have already been sold.',
        conflictedSeats: permanentlyBookedConflicts
      });
    }

    // 2. Generate unique holdToken
    const holdToken = uuidv4();
    const expiresAt = Date.now() + TTL_SECONDS * 1000;

    // 3. Attempt atomic lock acquisition in Redis using Lua script
    const lockResult = await RedisLockService.acquireSeatsLock(
      showId,
      seats,
      holdToken,
      TTL_SECONDS,
      { userId: userId || 'anonymous' }
    );

    if (!lockResult.success) {
      return res.status(409).json({
        success: false,
        errorCode: 'SEAT_ALREADY_LOCKED',
        message: 'One or more selected seats are no longer available.',
        conflictedSeats: lockResult.conflictedSeats
      });
    }

    // 4. Calculate prices
    const pricing = await computeSeatBreakdown(show, seats);

    // 5. Broadcast real-time lock to WebSocket room
    broadcastSeatsLocked(showId, seats, holdToken);

    // 6. Create transient ON_HOLD booking record in MongoDB
    const bookingReference = `CR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const booking = new Booking({
      bookingReference,
      show: show._id,
      customer: {
        name: req.body.customerName || 'Guest User',
        email: req.body.customerEmail || 'guest@cinereserve.com',
        phone: req.body.customerPhone || '+919999999999'
      },
      seats: pricing.breakdown,
      pricingBreakdown: {
        baseAmount: pricing.baseAmount,
        convenienceFee: pricing.convenienceFee,
        taxAmount: pricing.taxAmount,
        grandTotal: pricing.grandTotal
      },
      bookingStatus: 'ON_HOLD',
      holdToken,
      holdExpiresAt: new Date(expiresAt)
    });

    await booking.save();

    return res.status(201).json({
      success: true,
      holdToken,
      bookingReference,
      expiresAt,
      ttlSeconds: TTL_SECONDS,
      totalPrice: pricing.grandTotal,
      pricingBreakdown: {
        baseAmount: pricing.baseAmount,
        convenienceFee: pricing.convenienceFee,
        taxAmount: pricing.taxAmount,
        grandTotal: pricing.grandTotal
      },
      seats: pricing.breakdown
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings/confirm
 * Finalize reservation via mock payment (TRD 4.2 & 5)
 */
router.post('/confirm', async (req, res, next) => {
  try {
    const { holdToken, mockPaymentStatus, customerDetails } = req.body;

    if (!holdToken) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_REQUEST',
        message: 'holdToken is required.'
      });
    }

    // Introduce artificial 1200ms delay to simulate payment gateway latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 1. Inspect Redis hold session
    const holdSession = await RedisLockService.getHoldSession(holdToken);

    // 2. Find booking document in MongoDB
    const booking = await Booking.findOne({ holdToken }).populate('show');

    if (!holdSession || !booking || booking.bookingStatus === 'EXPIRED') {
      return res.status(410).json({
        success: false,
        errorCode: 'HOLD_EXPIRED',
        message: 'Your 5-minute reservation window expired. Please reselect your seats.'
      });
    }

    const showId = booking.show._id.toString();
    const seatIds = booking.seats.map(s => s.seatId);

    // If customer details were supplied at checkout, update them
    if (customerDetails) {
      if (customerDetails.name) booking.customer.name = customerDetails.name;
      if (customerDetails.email) booking.customer.email = customerDetails.email;
      if (customerDetails.phone) booking.customer.phone = customerDetails.phone;
    }

    // 3. Handle Payment FAILURE simulation
    if (mockPaymentStatus === 'FAILURE') {
      booking.bookingStatus = 'CANCELLED';
      booking.paymentDetails.status = 'FAILED';
      await booking.save();

      // Release Redis locks
      await RedisLockService.releaseSeatsLock(showId, seatIds, holdToken);

      // Broadcast release to all room occupants
      broadcastSeatsReleased(showId, seatIds);

      return res.status(200).json({
        success: false,
        errorCode: 'PAYMENT_FAILED',
        message: 'Mock payment was simulated as failed. Seats released.'
      });
    }

    // 4. Handle Payment SUCCESS simulation
    const show = await Show.findById(showId);

    // Add to Show's permanently booked seats
    for (const seatItem of booking.seats) {
      show.bookedSeats.push({
        seatId: seatItem.seatId,
        tier: seatItem.tier,
        pricePaid: seatItem.price,
        bookingId: booking._id,
        bookedAt: new Date()
      });
    }
    await show.save();

    // Update Booking status to CONFIRMED
    booking.bookingStatus = 'CONFIRMED';
    booking.paymentDetails.status = 'SUCCESS';
    booking.paymentDetails.paidAt = new Date();
    booking.paymentDetails.transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await booking.save();

    // Release/clear transient Redis locks
    await RedisLockService.releaseSeatsLock(showId, seatIds, holdToken);

    // Broadcast permanent booked state to showroom
    broadcastSeatsBooked(showId, seatIds, booking.bookingReference);

    return res.status(200).json({
      success: true,
      bookingId: booking.bookingReference,
      status: 'CONFIRMED',
      seats: seatIds,
      amountPaid: booking.pricingBreakdown.grandTotal,
      ticketQr: booking.qrCodeToken,
      booking
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/bookings/release
 * Voluntary lock release by client
 */
router.post('/release', async (req, res, next) => {
  try {
    const { holdToken } = req.body;

    if (!holdToken) {
      return res.status(400).json({ success: false, message: 'holdToken is required' });
    }

    const booking = await Booking.findOne({ holdToken });
    if (booking && booking.bookingStatus === 'ON_HOLD') {
      const showId = booking.show.toString();
      const seatIds = booking.seats.map(s => s.seatId);

      booking.bookingStatus = 'CANCELLED';
      await booking.save();

      await RedisLockService.releaseSeatsLock(showId, seatIds, holdToken);
      broadcastSeatsReleased(showId, seatIds);
    }

    res.json({
      success: true,
      message: 'Locks released successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
