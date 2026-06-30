/**
 * Upstash Redis (REST API based) — graceful fallback
 * If Redis fails or plan expires, system continues without cache.
 * Errors only appear in backend logs, never shown to users.
 */

const UPSTASH_URL = 'https://boss-dassie-108863.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAak_AAIgcDI0ZWVmYzEwMmY2NDA0ZmEwYTE4YThiNDRjYWVjMjAyNQ';

let redisAvailable = true;
let failCount = 0;
const MAX_FAILS = 5; // After 5 consecutive fails, disable Redis for 60s
let disabledUntil = 0;

/**
 * Execute a Redis command via Upstash REST API
 */
const redisRequest = async (command) => {
  // If temporarily disabled due to repeated failures
  if (!redisAvailable && Date.now() < disabledUntil) {
    return null;
  }
  if (!redisAvailable && Date.now() >= disabledUntil) {
    redisAvailable = true;
    failCount = 0;
  }

  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!response.ok) {
      throw new Error(`Redis HTTP ${response.status}`);
    }

    const data = await response.json();
    failCount = 0;
    return data.result;
  } catch (err) {
    failCount++;
    if (failCount >= MAX_FAILS) {
      redisAvailable = false;
      disabledUntil = Date.now() + 60000; // disable for 60s
      console.error(`[Redis] Disabled for 60s after ${MAX_FAILS} consecutive failures: ${err.message}`);
    }
    return null;
  }
};

/**
 * SET key value with optional TTL (seconds)
 */
const redisSet = async (key, value, ttlSeconds = 300) => {
  const val = typeof value === 'string' ? value : JSON.stringify(value);
  return redisRequest(['SET', key, val, 'EX', String(ttlSeconds)]);
};

/**
 * GET key — returns parsed JSON or raw string
 */
const redisGet = async (key) => {
  const result = await redisRequest(['GET', key]);
  if (result === null || result === undefined) return null;
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
};

/**
 * DEL key(s)
 */
const redisDel = async (...keys) => {
  return redisRequest(['DEL', ...keys]);
};

/**
 * SETEX — set with expiry (alias for set with TTL)
 */
const redisSetEx = async (key, seconds, value) => {
  return redisSet(key, value, seconds);
};

/**
 * Check if Redis is currently available
 */
const isRedisAvailable = () => redisAvailable;

/**
 * Initialize — just verify connection works (non-blocking)
 */
const connectRedis = () => {
  // Test connection in background
  redisRequest(['PING'])
    .then((result) => {
      if (result === 'PONG') {
        console.log('✅ Redis (Upstash) Connected Successfully');
      } else {
        console.warn('⚠️ Redis connected but PING failed — running without cache');
        redisAvailable = false;
      }
    })
    .catch(() => {
      console.warn('⚠️ Redis unavailable — running without cache (no errors for users)');
      redisAvailable = false;
    });
};

module.exports = {
  connectRedis,
  redisSet,
  redisGet,
  redisDel,
  redisSetEx,
  isRedisAvailable,
};
