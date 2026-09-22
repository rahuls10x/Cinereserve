import express from 'express';
import { Show } from '../models/Show.js';
import { Movie } from '../models/Movie.js';
import { Theater } from '../models/Theater.js';
import { Booking } from '../models/Booking.js';
import { RedisLockService } from '../services/redisLock.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Require admin authentication for all admin routes
router.use(protect, requireAdmin);

/**
 * GET /api/admin/metadata
 * Returns list of movies and theaters/screens for creating new shows
 */
router.get('/metadata', async (req, res, next) => {
  try {
    const movies = await Movie.find({ isActive: true }).select('title slug durationMins language censorRating posterUrl bannerUrl');
    const theaters = await Theater.find().select('name city address screens');

    res.json({
      success: true,
      data: {
        movies,
        theaters
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/shows
 * Retrieves list of all shows with real-time stats
 */
router.get('/shows', async (req, res, next) => {
  try {
    const shows = await Show.find()
      .populate('movie')
      .populate('theater')
      .sort({ startTime: 1 });

    const results = await Promise.all(
      shows.map(async show => {
        const theater = show.theater;
        const screen = theater?.screens?.find(s => s.screenNumber === show.screenNumber) || theater?.screens?.[0] || {};
        const totalCapacity = screen.totalCapacity || 72;
        const bookedCount = (show.bookedSeats || []).length;
        
        let lockedCount = 0;
        try {
          const locks = await RedisLockService.getLockedSeatsForShow(show._id.toString());
          lockedCount = locks.length;
        } catch (e) {
          lockedCount = 0;
        }

        const availableCount = Math.max(0, totalCapacity - bookedCount - lockedCount);
        const occupancyPercent = Number(((bookedCount / totalCapacity) * 100).toFixed(1));

        return {
          _id: show._id,
          movie: {
            _id: show.movie?._id,
            title: show.movie?.title,
            durationMins: show.movie?.durationMins,
            posterUrl: show.movie?.posterUrl
          },
          theater: {
            _id: theater?._id,
            name: theater?.name,
            city: theater?.city
          },
          screenNumber: show.screenNumber,
          screenName: screen.name || `Screen ${show.screenNumber}`,
          startTime: show.startTime,
          endTime: show.endTime,
          customTierPricing: show.customTierPricing,
          status: show.status,
          stats: {
            totalCapacity,
            bookedCount,
            lockedCount,
            availableCount,
            occupancyPercent
          }
        };
      })
    );

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/shows
 * Creates a new show with time, screen, and pricing
 */
router.post('/shows', async (req, res, next) => {
  try {
    const {
      movieId,
      theaterId,
      screenNumber,
      startTime,
      customTierPricing
    } = req.body;

    if (!movieId || !theaterId || !screenNumber || !startTime) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FIELDS',
        message: 'Movie, theater, screen number, and start time are required.'
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Selected movie not found.' });
    }

    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ success: false, message: 'Selected theater not found.' });
    }

    const screen = theater.screens.find(s => s.screenNumber === parseInt(screenNumber, 10));
    if (!screen) {
      return res.status(400).json({
        success: false,
        message: `Screen ${screenNumber} not found in theater ${theater.name}.`
      });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start time format.' });
    }

    const durationMins = movie.durationMins || 150;
    const end = new Date(start.getTime() + durationMins * 60000);

    // Default or custom pricing
    const pricing = {
      RECLINER: customTierPricing?.RECLINER ? Number(customTierPricing.RECLINER) : 450,
      PRIME: customTierPricing?.PRIME ? Number(customTierPricing.PRIME) : 280,
      CLASSIC: customTierPricing?.CLASSIC ? Number(customTierPricing.CLASSIC) : 180
    };

    const newShow = await Show.create({
      movie: movie._id,
      theater: theater._id,
      screenNumber: parseInt(screenNumber, 10),
      startTime: start,
      endTime: end,
      customTierPricing: pricing,
      bookedSeats: [],
      status: 'SCHEDULED'
    });

    const populatedShow = await Show.findById(newShow._id)
      .populate('movie')
      .populate('theater');

    res.status(201).json({
      success: true,
      message: 'New show created successfully!',
      data: populatedShow
    });
  } catch (err) {
    next(err);
  }
});

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

    const screenTotalCapacity = screen.totalCapacity || 72;
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
      tierStats,
      lockedSeats
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
