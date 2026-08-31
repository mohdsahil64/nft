const mongoose = require('mongoose');

const priceRangeSchema = new mongoose.Schema(
  {
    from: { type: Number, required: true },
    to:   { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const nftConfigSchema = new mongoose.Schema(
  {
    totalMinted: {
      type: Number,
      default: 0,
    },
    currentPrice: {
      type: Number,
      default: 0.01,
    },
    priceRanges: [priceRangeSchema],
    signupBonusAmount: {
      type: Number,
      default: 100,
    },
    totalSupply: {
      type: Number,
      default: 2100000,
    },
    priceIncrement: {
      type: Number,
      default: 200000, // Price doubles every 2 lakh NFTs
    },
    minWithdrawal: {
      type: Number,
      default: 100, // Minimum USDT for withdrawal
    },
    minSwap: {
      type: Number,
      default: 100, // Minimum NFTs to swap
    },
    monthlyWithdrawalPercent: {
      type: Number,
      default: 10, // Max % of USDT balance a user can withdraw per 30-day period
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NFTConfig', nftConfigSchema);
