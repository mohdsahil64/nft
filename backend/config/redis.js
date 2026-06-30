/**
 * Redis disabled — using MongoDB directly for all operations.
 * These are no-op stubs so existing code doesn't break.
 */

const connectRedis = () => {
  console.log('Redis disabled — using MongoDB directly');
};

const redisSet = async () => null;
const redisGet = async () => null;
const redisDel = async () => null;
const redisSetEx = async () => null;
const isRedisAvailable = () => false;

module.exports = {
  connectRedis,
  redisSet,
  redisGet,
  redisDel,
  redisSetEx,
  isRedisAvailable,
};
