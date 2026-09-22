import { getRedisClient, getRedisSubClient } from '../config/redis.js';
import { broadcastSeatsReleased } from '../socket/gateway.js';
import { Booking } from '../models/Booking.js';

export function startSweeper() {
  const subClient = getRedisSubClient();

  // Listen to keyspace expiration events
  try {
    if (typeof subClient.subscribe === 'function') {
      subClient.subscribe('__keyevent@0__:expired', (channel, message) => {
        handleExpiredKey(message);
      });
      // For ioredis standard events
      if (typeof subClient.on === 'function') {
        subClient.on('message', (channel, message) => {
          if (channel === '__keyevent@0__:expired') {
            handleExpiredKey(message);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[Sweeper] Could not bind to keyspace notification channel:', err.message);
  }

  // Periodic fallback sweeper running every 5 seconds
  const intervalId = setInterval(async () => {
    try {
      await sweepExpiredBookings();
    } catch (e) {
      console.error('[Sweeper] Sweeper interval error:', e.message);
    }
  }, 5000);

  console.log('[Sweeper] Active Lock & Expiration Sweeper started (5s interval)');
  return () => clearInterval(intervalId);
}

function handleExpiredKey(key) {
  if (!key || typeof key !== 'string') return;

  // lock:show:{showId}:{seatId}
  if (key.startsWith('lock:show:')) {
    const parts = key.split(':');
    if (parts.length >= 4) {
      const showId = parts[2];
      const seatId = parts.slice(3).join(':');
      console.log(`[Sweeper] Key expired: ${key} -> broadcasting release`);
      broadcastSeatsReleased(showId, [seatId]);
    }
  }
}

async function sweepExpiredBookings() {
  const now = new Date();
  // Find ON_HOLD bookings where holdExpiresAt has passed
  const expiredBookings = await Booking.find({
    bookingStatus: 'ON_HOLD',
    holdExpiresAt: { $lt: now }
  }).limit(20);

  for (const booking of expiredBookings) {
    booking.bookingStatus = 'EXPIRED';
    await booking.save();
    console.log(`[Sweeper] Marked booking ${booking.bookingReference} as EXPIRED`);
    if (booking.show && booking.seats) {
      const seatIds = booking.seats.map(s => s.seatId);
      broadcastSeatsReleased(booking.show.toString(), seatIds);
    }
  }
}
