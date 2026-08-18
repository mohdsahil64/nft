const ReferralTree = require('../models/ReferralTree');
const NFTWallet = require('../models/NFTWallet');
const Transaction = require('../models/Transaction');

// Commission percentages per level (on watch earnings) — halved from original
const WATCH_COMMISSION = {
  1: 10,
  2: 5,
  3: 2.5,
  4: 2.5,
  5: 2.5,
  6: 0.5,
  7: 0.5,
  8: 0.5,
  9: 0.5,
  10: 0.5,
  11: 0.5,
  12: 0.5,
  13: 0.5,
  14: 0.5,
  15: 0.5,
};

/**
 * Distribute watch commission to 15-level ancestors
 * @param {string} watcherUserId - user who watched the ad
 * @param {number} nftEarned - NFT earned by watcher (e.g. 5)
 * @param {number} fmEarned - FM earned by watcher (e.g. 1)
 */
const processWatchCommission = async (watcherUserId, nftEarned, fmEarned) => {
  try {
    const User = require('../models/User');
    const watcher = await User.findById(watcherUserId).select('referredBy').lean();
    if (!watcher || !watcher.referredBy) return; // No referrer, no commission

    let currentParentId = watcher.referredBy;
    let level = 1;

    while (currentParentId && level <= 15) {
      const percent = WATCH_COMMISSION[level] || 0;
      if (percent > 0) {
        const commissionNFT = parseFloat(((nftEarned * percent) / 100).toFixed(4));
        const commissionFM = parseFloat(((fmEarned * percent) / 100).toFixed(4));

        // Credit NFT commission
        if (commissionNFT > 0) {
          await NFTWallet.findOneAndUpdate(
            { userId: currentParentId },
            {
              $inc: { nftBalance: commissionNFT, referralEarnings: commissionNFT },
              lastUpdated: new Date(),
            }
          );

          // Log NFT commission transaction
          await Transaction.create({
            userId: currentParentId,
            type: 'referral',
            amount: commissionNFT,
            level,
            fromUserId: watcherUserId,
            description: `L${level} watch commission (${percent}%) from ad watch`,
          });
        }

        // Credit FM commission
        if (commissionFM > 0) {
          await NFTWallet.findOneAndUpdate(
            { userId: currentParentId },
            {
              $inc: { fmBalance: commissionFM, fmReferralEarnings: commissionFM },
              lastUpdated: new Date(),
            }
          );

          // Mint FM
          const FMConfig = require('../models/FMConfig');
          await FMConfig.findOneAndUpdate({}, { $inc: { totalMinted: commissionFM } });
        }
      }

      // Walk up the chain
      const parentUser = await User.findById(currentParentId).select('referredBy').lean();
      if (!parentUser || !parentUser.referredBy) break;

      currentParentId = parentUser.referredBy;
      level++;
    }
  } catch (err) {
    console.error('processWatchCommission error:', err.message);
  }
};

module.exports = { processWatchCommission, WATCH_COMMISSION };
