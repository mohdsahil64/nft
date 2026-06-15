const ReferralTree = require('../models/ReferralTree');
const { creditNFTs } = require('./nftPriceService');
const Milestone = require('../models/Milestone');
const mongoose = require('mongoose');

// Team milestone rewards with 70-30 leg balancing
const TEAM_MILESTONES = [
  { members: 10,      reward: 3 },
  { members: 50,      reward: 10 },
  { members: 100,     reward: 25 },
  { members: 250,     reward: 60 },
  { members: 1000,    reward: 250 },
  { members: 3000,    reward: 700 },
  { members: 7000,    reward: 1500 },
  { members: 25000,   reward: 5000 },
  { members: 100000,  reward: 25000 },
  { members: 500000,  reward: 75000 },
  { members: 1000000, reward: 250000 },
];

// Max percentage any single leg can contribute (70%)
const MAX_POWER_LEG_RATIO = 0.70;

/**
 * Get leg-wise breakdown for a user.
 * Each direct referral forms a "leg" — count all members under each leg.
 * Returns: { totalTeam, powerLeg, otherLegs, legs: [{userId, count}] }
 */
const getLegBreakdown = async (userId) => {
  const objectId = mongoose.Types.ObjectId.createFromHexString(userId);

  // Get direct referrals (each forms a leg)
  const directRefs = await ReferralTree.find({ parentId: objectId, level: 1 }).select('userId').lean();

  if (directRefs.length === 0) {
    return { totalTeam: 0, powerLeg: 0, otherLegs: 0, qualifiedCount: 0, legs: [] };
  }

  // For each direct referral, count their entire downline
  const legs = await Promise.all(directRefs.map(async (ref) => {
    const refId = ref.userId;
    // Count all members where this direct ref is in their ancestor chain
    const count = await ReferralTree.countDocuments({
      $or: [
        { parentId: refId, level: 1 },
        { ancestors: refId },
      ],
    });
    // +1 for the direct referral themselves
    return { userId: refId.toString(), count: count + 1 };
  }));

  // Sort legs by size (largest first)
  legs.sort((a, b) => b.count - a.count);

  const totalTeam = legs.reduce((sum, leg) => sum + leg.count, 0);
  const powerLeg = legs[0]?.count || 0;
  const otherLegs = totalTeam - powerLeg;

  // Calculate qualified count with 70-30 rule
  // Power leg can contribute max 70% of qualified count
  // Other legs must contribute at least 30%
  const maxFromPowerLeg = Math.floor(totalTeam * MAX_POWER_LEG_RATIO);
  const cappedPowerLeg = Math.min(powerLeg, maxFromPowerLeg);
  const qualifiedCount = cappedPowerLeg + otherLegs;

  return { totalTeam, powerLeg, otherLegs, qualifiedCount, legs };
};

/**
 * Check if user has hit any new team milestones.
 * Uses 70-30 rule: power leg max 70%, other legs min 30%.
 * @param {string} userId
 */
const checkTeamMilestones = async (userId) => {
  try {
    const { qualifiedCount, totalTeam, powerLeg, otherLegs } = await getLegBreakdown(userId);

    for (const milestone of TEAM_MILESTONES) {
      if (qualifiedCount >= milestone.members) {
        // Check if already awarded
        const alreadyAwarded = await Milestone.findOne({ userId, memberCount: milestone.members });

        if (!alreadyAwarded) {
          await creditNFTs(userId, milestone.reward, 'team', {
            description: `Team milestone — ${milestone.members} members (70-30 balanced)`,
          });

          // Record this milestone as awarded
          await Milestone.create({ userId, memberCount: milestone.members });
          console.log(`Milestone awarded: user ${userId} — ${milestone.members} members (total: ${totalTeam}, power: ${powerLeg}, other: ${otherLegs}, qualified: ${qualifiedCount}) — +${milestone.reward} NFTs`);
        }
      }
    }
  } catch (err) {
    console.error('checkTeamMilestones error:', err.message);
  }
};

module.exports = { checkTeamMilestones, getLegBreakdown, TEAM_MILESTONES };
