const DailyFakeUsdtStat = require('../models/DailyFakeUsdtStat');

// Local server date as 'YYYY-MM-DD', using local time (not UTC) so the
// value changes at local midnight, matching "aaj" / calendar day semantics.
const todayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const FAKE_TOTAL_MIN = 800;
const FAKE_TOTAL_MAX = 900;

/**
 * Returns today's fake "Total USDT" display number (800-900), generating
 * and persisting one the first time it's requested for the current day.
 * The same number is returned for every call made on the same calendar day.
 */
const getTodaysFakeUsdtTotal = async () => {
  const date = todayKey();

  const existing = await DailyFakeUsdtStat.findOne({ date }).lean();
  if (existing) return existing.fakeTotal;

  const fakeTotal = randomInRange(FAKE_TOTAL_MIN, FAKE_TOTAL_MAX);

  try {
    const created = await DailyFakeUsdtStat.findOneAndUpdate(
      { date },
      { $setOnInsert: { date, fakeTotal } },
      { upsert: true, new: true }
    );
    return created.fakeTotal;
  } catch (err) {
    // Race condition fallback: another request created it first — read it back.
    const fallback = await DailyFakeUsdtStat.findOne({ date }).lean();
    return fallback ? fallback.fakeTotal : fakeTotal;
  }
};

module.exports = { getTodaysFakeUsdtTotal };
