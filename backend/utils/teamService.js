const { getTeamSize } = require('./referralService');
const { creditNFTs } = require('./nftPriceService');
const Milestone = require('../models/Milestone');

// Team milestone rewards: { memberCount: nftReward }
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

/**
 * Check if user has hit any new team milestones and credit accordingly.
 * Uses MongoDB to track which milestones have already been awarded.
 * @param {string} userId
 */
const checkTeamMilestones = async (userId) => {
  try {
    const teamSize = await getTeamSize(userId);

    for (const milestone of TEAM_MILESTONES) {
      if (teamSize >= milestone.members) {
        // Check if already awarded
        const alreadyAwarded = await Milestone.findOne({ userId, memberCount: milestone.members });

        if (!alreadyAwarded) {
          await creditNFTs(userId, milestone.reward, 'team', {
            description: `Team milestone reward — ${milestone.members} members reached`,
          });

          // Record this milestone as awarded
          await Milestone.create({ userId, memberCount: milestone.members });
          console.log(`Milestone awarded: user ${userId} reached ${milestone.members} members — +${milestone.reward} NFTs`);
        }
      }
    }
  } catch (err) {
    console.error('checkTeamMilestones error:', err.message);
  }
};

module.exports = { checkTeamMilestones, TEAM_MILESTONES };
