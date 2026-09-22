import express from 'express';
import { Show } from '../models/Show.js';
import { Movie } from '../models/Movie.js';
import { Theater } from '../models/Theater.js';
import { RedisLockService } from '../services/redisLock.js';

const router = express.Router();

/**
 * GET /api/shows
 * Retrieves list of active shows
 */
router.get('/', async (req, res, next) => {
  try {
    const shows = await Show.find({ status: 'SCHEDULED' })
      .populate('movie')
      .populate('theater')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: shows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shows/:showId
 * Retrieves single show details
 */
router.get('/:showId', async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.showId)
      .populate('movie')
      .populate('theater');

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    res.json({ success: true, data: show });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shows/:showId/layout
 * Retrieves physical theater geometry merged with live seat availability statuses.
 * Per TRD Section 4.1
 */
router.get('/:showId/layout', async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await Show.findById(showId)
      .populate('movie')
      .populate('theater');

    if (!show) {
      return res.status(404).json({
        success: false,
        errorCode: 'SHOW_NOT_FOUND',
        message: 'Show not found'
      });
    }

    const theater = show.theater;
    const screen = theater.screens.find(s => s.screenNumber === show.screenNumber) || theater.screens[0];

    if (!screen) {
      return res.status(404).json({
        success: false,
        errorCode: 'SCREEN_NOT_FOUND',
        message: 'Screen layout not found'
      });
    }

    // 1. Get confirmed booked seats from MongoDB
    const bookedSeatMap = new Map();
    if (show.bookedSeats && show.bookedSeats.length > 0) {
      for (const b of show.bookedSeats) {
        bookedSeatMap.set(b.seatId, b);
      }
    }

    // 2. Get active transient locks from Redis
    const lockedSeats = await RedisLockService.getLockedSeatsForShow(showId);
    const lockedSeatMap = new Map();
    for (const item of lockedSeats) {
      lockedSeatMap.set(item.seatId, item.holdToken);
    }

    // 3. Build merged tiers and row geometry
    const mergedTiers = screen.tiers.map(tier => {
      // Determine effective price (custom tier price or default tier price)
      const price = (show.customTierPricing && show.customTierPricing[tier.tierType])
        ? show.customTierPricing[tier.tierType]
        : tier.defaultPrice;

      const rows = tier.rows.map(row => {
        const seats = row.seatNumbers.map(num => {
          const seatId = `${row.rowId}${num}`;
          let status = 'AVAILABLE';
          let holdToken = null;

          if (bookedSeatMap.has(seatId)) {
            status = 'BOOKED';
          } else if (lockedSeatMap.has(seatId)) {
            status = 'LOCKED';
            holdToken = lockedSeatMap.get(seatId);
          }

          return {
            seatId,
            seatNumber: num,
            status,
            holdToken
          };
        });

        return {
          rowId: row.rowId,
          seatsPerRow: row.seatsPerRow,
          seats
        };
      });

      return {
        name: tier.tierType,
        price,
        rows
      };
    });

    res.json({
      showId: show._id,
      movie: {
        _id: show.movie._id,
        title: show.movie.title,
        durationMins: show.movie.durationMins,
        censorRating: show.movie.censorRating,
        language: show.movie.language,
        posterUrl: show.movie.posterUrl,
        bannerUrl: show.movie.bannerUrl
      },
      theater: {
        _id: theater._id,
        name: theater.name,
        city: theater.city
      },
      screen: {
        name: screen.name,
        screenNumber: screen.screenNumber,
        format: screen.format,
        totalCapacity: screen.totalCapacity
      },
      startTime: show.startTime,
      tiers: mergedTiers
    });
  } catch (err) {
    next(err);
  }
});

export default router;
