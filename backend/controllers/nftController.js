const { getCurrentNFTPrice, getNFTStats } = require('../utils/nftPriceService');

/**
 * GET /api/nft/price
 */
const getPrice = async (req, res) => {
  try {
    const price = await getCurrentNFTPrice();
    return res.status(200).json({ success: true, data: { price } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/nft/stats
 */
const getStats = async (req, res) => {
  try {
    const stats = await getNFTStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPrice, getStats };
