const mongoose = require('mongoose');

const dailyWatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    watchDate: {
      type: String, // YYYY-MM-DD format for easy daily check
      required: true,
    },
    nftEarned: {
      type: Number,
      default: 5,
    },
    fmEarned: {
      type: Number,
      default: 1,
    },
    adUrl: {
      type: String,
      default: null,
    },
    streakCount: {
      type: Number,
      default: 1,
    },
    streakBonusNFT: {
      type: Number,
      default: 0,
    },
    streakBonusFM: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One watch per user per day
dailyWatchSchema.index({ userId: 1, watchDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyWatch', dailyWatchSchema);
