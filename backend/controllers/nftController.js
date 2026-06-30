const { getCurrentNFTPrice, getNFTStats } = require('../utils/nftPriceService');
const { redisGet, redisSet, isRedisAvailable } = require('../config/redis');

/**
 * GET /api/nft/price
 * Cached for 30 seconds
 */
const getPrice = async (req, res) => {
  try {
    // Try cache first
    if (isRedisAvailable()) {
      const cached = await redisGet('nft:price');
      if (cached) return res.status(200).json({ success: true, data: { price: cached } });
    }

    const price = await getCurrentNFTPrice();

    // Cache for 30 seconds
    if (isRedisAvailable()) {
      redisSet('nft:price', price, 30).catch(() => {});
    }

    return res.status(200).json({ success: true, data: { price } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/nft/stats
 * Cached for 30 seconds
 */
const getStats = async (req, res) => {
  try {
    // Try cache first
    if (isRedisAvailable()) {
      const cached = await redisGet('nft:stats');
      if (cached) return res.status(200).json({ success: true, data: cached });
    }

    const stats = await getNFTStats();

    // Cache for 30 seconds
    if (isRedisAvailable()) {
      redisSet('nft:stats', stats, 30).catch(() => {});
    }

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPrice, getStats };
