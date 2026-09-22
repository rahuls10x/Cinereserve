import express from 'express';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { RedisLockService } from '../services/redisLock.js';

const router = express.Router();

/**
 * GET /api/admin/shows/:showId/occupancy
 * Real-time operational occupancy and revenue metrics (TRD 4.3)
 */
router.get('/shows/:showId/occupancy', async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await Show.findById(showId)
      .populate('movie')
      .populate('theater');

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    const theater = show.theater;
    const screen = theater.screens.find(s => s.screenNumber === show.screenNumber) || theater.screens[0];

    const screenTotalCapacity = screen.totalCapacity || 120;
    const confirmedBookingsCount = (show.bookedSeats || []).length;

    // Get active locks from Redis
    const lockedSeats = await RedisLockService.getLockedSeatsForShow(showId);
    const activeHoldsCount = lockedSeats.length;

    const availableSeatsCount = Math.max(0, screenTotalCapacity - confirmedBookingsCount - activeHoldsCount);
    const occupancyPercentage = Number(((confirmedBookingsCount / screenTotalCapacity) * 100).toFixed(2));

    // Calculate gross revenue from confirmed bookings
    let grossRevenue = 0;
    if (show.bookedSeats) {
      grossRevenue = show.bookedSeats.reduce((sum, s) => sum + (s.pricePaid || 0), 0);
    }

    // Breakdown by tiers
    const tierStats = {};
    const bookedSeatIds = new Set((show.bookedSeats || []).map(b => b.seatId));
    const lockedSeatIds = new Set(lockedSeats.map(l => l.seatId));

    for (const tier of screen.tiers) {
      let tierTotal = 0;
      let tierBooked = 0;
      let tierHeld = 0;

      for (const row of tier.rows) {
        for (const num of row.seatNumbers) {
          const seatId = `${row.rowId}${num}`;
          tierTotal++;
          if (bookedSeatIds.has(seatId)) {
            tierBooked++;
          } else if (lockedSeatIds.has(seatId)) {
            tierHeld++;
          }
        }
      }

      tierStats[tier.tierType] = {
        total: tierTotal,
        booked: tierBooked,
        held: tierHeld,
        available: Math.max(0, tierTotal - tierBooked - tierHeld)
      };
    }

    res.json({
      showId: show._id,
      movieTitle: show.movie.title,
      screenName: screen.name,
      screenTotalCapacity,
      confirmedBookingsCount,
      activeHoldsCount,
      availableSeatsCount,
      occupancyPercentage,
      grossRevenue,
      tierStats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/shows/:showId/reset
 * Helper endpoint to reset seat reservations for a show (demo tool)
 */
router.post('/shows/:showId/reset', async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    // Clear bookedSeats in Mongo
    show.bookedSeats = [];
    await show.save();

    // Clear locks in Redis
    await RedisLockService.clearAllShowLocks(showId);

    // Cancel all ON_HOLD bookings for this show
    await Booking.updateMany(
      { show: show._id, bookingStatus: 'ON_HOLD' },
      { bookingStatus: 'CANCELLED' }
    );

    res.json({
      success: true,
      message: 'Show seat inventory and locks successfully reset.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
