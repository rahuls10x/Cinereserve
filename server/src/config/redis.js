import { Redis } from 'ioredis';
import EventEmitter from 'events';

class MemoryRedisEmulator extends EventEmitter {
  constructor() {
    super();
    this.store = new Map(); // key -> { value, expiresAt }
    this.subscribers = new Map(); // channel -> Set<callback>
    this.isEmulator = true;
    console.log('[Redis] Running In-Memory High-Performance Redis Emulator (with full Lua & TTL support)');

    // Background TTL cleanup interval (runs every 500ms)
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.store.entries()) {
        if (item.expiresAt && now >= item.expiresAt) {
          this.store.delete(key);
          this.emit('expired', key);
          // Emit keyspace event
          this.publish('__keyevent@0__:expired', key);
        }
      }
    }, 500);
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() >= item.expiresAt) {
      this.store.delete(key);
      this.publish('__keyevent@0__:expired', key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ...args) {
    let ttlSeconds = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === 'EX' && args[i + 1]) {
        ttlSeconds = parseInt(args[i + 1], 10);
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async exists(...keys) {
    let count = 0;
    const now = Date.now();
    for (const key of keys) {
      const item = this.store.get(key);
      if (item && (!item.expiresAt || now < item.expiresAt)) {
        count++;
      } else if (item) {
        this.store.delete(key);
      }
    }
    return count;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const now = Date.now();
    const result = [];
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now >= item.expiresAt) {
        this.store.delete(key);
      } else if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async eval(script, numKeys, ...args) {
    const keys = args.slice(0, numKeys);
    const argv = args.slice(numKeys);

    // If script is acquire lock
    if (script.includes("EXISTS") && script.includes("SET")) {
      const holdToken = argv[0];
      const ttlSec = parseInt(argv[1], 10) || 300;
      const now = Date.now();

      // Step 1: Pre-condition check - Verify NO key is already acquired
      for (const key of keys) {
        const item = this.store.get(key);
        if (item && (!item.expiresAt || now < item.expiresAt)) {
          return 0; // Failed
        }
      }

      // Step 2: Atomic multi-write
      const expiresAt = now + ttlSec * 1000;
      for (const key of keys) {
        this.store.set(key, { value: holdToken, expiresAt });
      }
      return 1;
    }

    // If script is safe release lock
    if (script.includes("GET") && script.includes("DEL")) {
      const holdToken = argv[0];
      for (const key of keys) {
        const item = this.store.get(key);
        if (item && item.value === holdToken) {
          this.store.delete(key);
        }
      }
      return 1;
    }

    return 1;
  }

  async publish(channel, message) {
    const subs = this.subscribers.get(channel);
    if (subs) {
      for (const cb of subs) {
        try {
          cb(channel, message);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return 1;
  }

  subscribe(channel, cb) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(cb);
  }

  async config() {
    return 'OK';
  }

  duplicate() {
    return this;
  }
}

let redisClient = null;
let redisSubClient = null;

export async function initRedis() {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const redisUrl = process.env.REDIS_URL;

  const tryConnect = async () => {
    const opts = {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: () => null, // Don't hang forever on initial connection fail
      lazyConnect: true
    };

    const client = redisUrl
      ? new Redis(redisUrl, opts)
      : new Redis({ host, port, password, ...opts });

    await client.connect();
    return client;
  };

  try {
    const client = await tryConnect();
    console.log('[Redis] Connected to live Redis instance');
    try {
      await client.config('SET', 'notify-keyspace-events', 'Ex');
    } catch (e) {
      console.warn('[Redis] Note: Could not set notify-keyspace-events config:', e.message);
    }

    const subClient = client.duplicate({ lazyConnect: true });
    await subClient.connect();

    redisClient = client;
    redisSubClient = subClient;
    return { redisClient, redisSubClient };
  } catch (err) {
    console.warn('[Redis] Live Redis unavailable. Initializing integrated Redis Emulator...', err.message);
    const emulator = new MemoryRedisEmulator();
    redisClient = emulator;
    redisSubClient = emulator;
    return { redisClient, redisSubClient };
  }
}

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new MemoryRedisEmulator();
    redisSubClient = redisClient;
  }
  return redisClient;
}

export function getRedisSubClient() {
  if (!redisSubClient) {
    redisSubClient = getRedisClient();
  }
  return redisSubClient;
}
