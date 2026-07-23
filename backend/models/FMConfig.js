const mongoose = require('mongoose');

const fmConfigSchema = new mongoose.Schema(
  {
    totalSupply: {
      type: Number,
      default: 21000000, // 21 Million FM Tokens
    },
    totalMinted: {
      type: Number,
      default: 0,
    },
    lockPeriodDays: {
      type: Number,
      default: 180, // FM Tokens locked for 180 days after earning
    },
    dailyWatchRewardFM: {
      type: Number,
      default: 1, // 1 FM per daily video watch
    },
    dailyWatchRewardNFT: {
      type: Number,
      default: 5, // 5 NFT per daily video watch
    },
    signupBonusFM: {
      type: Number,
      default: 50, // 50 FM on signup
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FMConfig', fmConfigSchema);
