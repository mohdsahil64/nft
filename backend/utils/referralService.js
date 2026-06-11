const ReferralTree = require('../models/ReferralTree');
const { creditNFTs } = require('./nftPriceService');

// NFTs per level for referral chain
const REFERRAL_REWARDS = {
  1: 20,
  2: 10,
  3: 5,
  4: 5,
  5: 5,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
  10: 1,
  11: 1,
  12: 1,
  13: 1,
  14: 1,
  15: 1,
};

/**
 * Build the referral tree entry for a newly activated user.
 * Walks up the chain (up to 15 levels) and credits rewards.
 * @param {string} newUserId - the newly activated user
 * @param {string} directParentId - the user who referred them
 */
const processReferralChain = async (newUserId, directParentId) => {
  if (!directParentId) return;

  let currentParentId = directParentId;
  let level = 1;
  const ancestors = [];

  while (currentParentId && level <= 15) {
    ancestors.push(currentParentId);

    // Store referral tree record
    await ReferralTree.create({
      userId: newUserId,
      parentId: currentParentId,
      level,
      ancestors: ancestors.slice(0, -1),
    });

    // Credit NFTs to this ancestor
    const reward = REFERRAL_REWARDS[level] || 0;
    if (reward > 0) {
      await creditNFTs(currentParentId, reward, 'referral', {
        level,
        fromUserId: newUserId,
        description: `Level ${level} referral bonus from new member`,
      });
    }

    // Walk up — find who referred this parent
    const User = require('../models/User');
    const parentUser = await User.findById(currentParentId).select('referredBy').lean();
    if (!parentUser || !parentUser.referredBy) break;

    currentParentId = parentUser.referredBy;
    level++;
  }
};

/**
 * Get direct referrals (level 1) for a user
 */
const getDirectReferrals = async (userId) => {
  return ReferralTree.find({ parentId: userId, level: 1 })
    .populate('userId', 'name email createdAt isVerified')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get level-wise referral counts for a user
 * Uses aggregation pipeline instead of 15 separate queries
 */
const getLevelWiseReferrals = async (userId) => {
  const results = await ReferralTree.aggregate([
    { $match: { parentId: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Build full 15-level array with 0 for missing levels
  const countMap = {};
  results.forEach((r) => { countMap[r._id] = r.count; });

  const counts = [];
  for (let level = 1; level <= 15; level++) {
    counts.push({ level, count: countMap[level] || 0 });
  }
  return counts;
};

/**
 * Get total team size (all levels) for a user
 * Uses a single aggregation with $match on parentId
 */
const getTeamSize = async (userId) => {
  const objectId = require('mongoose').Types.ObjectId.createFromHexString(userId);

  const result = await ReferralTree.aggregate([
    {
      $match: {
        $or: [
          { parentId: objectId },
          { ancestors: objectId },
        ],
      },
    },
    { $group: { _id: '$userId' } },
    { $count: 'total' },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

module.exports = {
  processReferralChain,
  getDirectReferrals,
  getLevelWiseReferrals,
  getTeamSize,
  REFERRAL_REWARDS,
};
