const mongoose = require('mongoose');

/**
 * Stores one randomly generated "Total USDT" display number per calendar day,
 * shown ONLY on the admin dashboard's Total USDT card (backend: getTotalUsdt,
 * frontend: app/admin/users/page.js). This is a display-only decoy value —
 * it has no relation to real on-chain balances, real per-user wallet data,
 * or real transfer history, all of which remain untouched elsewhere.
 */
const dailyFakeUsdtStatSchema = new mongoose.Schema(
  {
    // Local calendar date this value belongs to, formatted 'YYYY-MM-DD'.
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fakeTotal: {
      type: Number,
      required: true,
      min: 800,
      max: 900,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyFakeUsdtStat', dailyFakeUsdtStatSchema);
