import { getRedisClient } from '../config/redis.js';

const ACQUIRE_LOCK_LUA = `
-- KEYS: Array of lock keys [lock:show:101:R1, lock:show:101:R2]
-- ARGV: [1] = holdToken, [2] = TTL in seconds (300)

for i = 1, #KEYS do
    if redis.call('EXISTS', KEYS[i]) == 1 then
        return 0
    end
end

for i = 1, #KEYS do
    redis.call('SET', KEYS[i], ARGV[1], 'EX', tonumber(ARGV[2]))
end

return 1
`;

const RELEASE_LOCK_LUA = `
-- KEYS: Array of lock keys [lock:show:101:R1, lock:show:101:R2]
-- ARGV: [1] = holdToken

for i = 1, #KEYS do
    if redis.call('GET', KEYS[i]) == ARGV[1] then
        redis.call('DEL', KEYS[i])
    end
end

return 1
`;

export const RedisLockService = {
  getLockKey(showId, seatId) {
    return `lock:show:${showId}:${seatId}`;
  },

  getHoldKey(holdToken) {
    return `hold:${holdToken}`;
  },

  /**
   * Attempts atomic reservation for an array of seats.
   * Returns { success: true } or { success: false, conflictedSeats: [...] }
   */
  async acquireSeatsLock(showId, seatIds, holdToken, ttlSeconds = 300, metadata = {}) {
    const redis = getRedisClient();
    const keys = seatIds.map(seatId => this.getLockKey(showId, seatId));

    if (keys.length === 0) {
      return { success: true };
    }

    // Run atomic Lua script
    const result = await redis.eval(
      ACQUIRE_LOCK_LUA,
      keys.length,
      ...keys,
      holdToken,
      ttlSeconds.toString()
    );

    if (result === 1) {
      // Store hold metadata for quick retrieval and session tracking
      const holdKey = this.getHoldKey(holdToken);
      const holdData = JSON.stringify({
        showId,
        seats: seatIds,
        userId: metadata.userId || null,
        expiresAt: Date.now() + ttlSeconds * 1000,
        ...metadata
      });
      await redis.set(holdKey, holdData, 'EX', ttlSeconds);

      return { success: true };
    } else {
      // Find which specific seats are already locked
      const conflictedSeats = [];
      for (const seatId of seatIds) {
        const key = this.getLockKey(showId, seatId);
        const exists = await redis.exists(key);
        if (exists) {
          conflictedSeats.push(seatId);
        }
      }
      return {
        success: false,
        conflictedSeats: conflictedSeats.length > 0 ? conflictedSeats : seatIds
      };
    }
  },

  /**
   * Safely releases locks only if owned by holdToken.
   */
  async releaseSeatsLock(showId, seatIds, holdToken) {
    const redis = getRedisClient();
    const keys = seatIds.map(seatId => this.getLockKey(showId, seatId));

    if (keys.length > 0) {
      await redis.eval(
        RELEASE_LOCK_LUA,
        keys.length,
        ...keys,
        holdToken
      );
    }

    // Delete hold session metadata
    const holdKey = this.getHoldKey(holdToken);
    await redis.del(holdKey);
    return true;
  },

  /**
   * Retrieves hold session info
   */
  async getHoldSession(holdToken) {
    const redis = getRedisClient();
    const holdKey = this.getHoldKey(holdToken);
    const data = await redis.get(holdKey);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Scans and returns all currently locked seatIds for a given show
   */
  async getLockedSeatsForShow(showId) {
    const redis = getRedisClient();
    const pattern = `lock:show:${showId}:*`;
    const keys = await redis.keys(pattern);

    const lockedSeats = [];
    const prefix = `lock:show:${showId}:`;

    for (const key of keys) {
      const seatId = key.replace(prefix, '');
      const token = await redis.get(key);
      if (token) {
        lockedSeats.push({ seatId, holdToken: token });
      }
    }
    return lockedSeats;
  },

  /**
   * Cleans up all locks for a show (useful for test resets or admin actions)
   */
  async clearAllShowLocks(showId) {
    const redis = getRedisClient();
    const pattern = `lock:show:${showId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
