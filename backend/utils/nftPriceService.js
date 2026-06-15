const NFTConfig = require('../models/NFTConfig');
const NFTWallet = require('../models/NFTWallet');
const Transaction = require('../models/Transaction');

/**
 * Get current NFT config
 */
const getConfig = async () => {
  const config = await NFTConfig.findOne();
  if (!config) throw new Error('NFT Config not initialized');
  return config;
};

/**
 * Get current NFT price based on totalMinted
 * Price doubles every 50,000 NFTs minted
 */
const getCurrentNFTPrice = async () => {
  const config = await getConfig();
  const { totalMinted } = config;
  // Dynamic calculation: starts at $0.01, doubles every 50k
  const tier = Math.floor(totalMinted / 50000);
  return 0.01 * Math.pow(2, tier);
};

/**
 * Credit NFTs to a user wallet and log a transaction
 * @param {string} userId - recipient
 * @param {number} amount - NFT count
 * @param {string} type   - 'signup'|'referral'|'team'|'admin_credit'
 * @param {object} extra  - { level, fromUserId, description }
 */
const creditNFTs = async (userId, amount, type, extra = {}) => {
  const { level = null, fromUserId = null, description = '' } = extra;

  // Update NFT wallet
  const wallet = await NFTWallet.findOneAndUpdate(
    { userId },
    {
      $inc: {
        nftBalance: amount,
        [`${type === 'signup' ? 'signupEarnings' : type === 'referral' ? 'referralEarnings' : type === 'team' ? 'teamEarnings' : 'nftBalance'}`]: amount,
      },
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );

  // If type is admin_credit, just add to balance without a separate earnings bucket
  if (type === 'admin_credit') {
    await NFTWallet.findOneAndUpdate(
      { userId },
      { $inc: { nftBalance: 0 }, lastUpdated: new Date() }, // balance already incremented
      { new: true }
    );
  }

  // Log transaction
  await Transaction.create({
    userId,
    type,
    amount,
    level,
    fromUserId,
    description,
  });

  // Update total minted in config (for non-withdrawal types)
  if (type !== 'withdrawal') {
    await NFTConfig.findOneAndUpdate(
      {},
      { $inc: { totalMinted: amount }, lastUpdated: new Date() }
    );
    // Refresh current price
    const config = await getConfig();
    const newPrice = await getCurrentNFTPrice();
    if (config.currentPrice !== newPrice) {
      await NFTConfig.findOneAndUpdate({}, { currentPrice: newPrice });
    }
  }

  return wallet;
};

/**
 * Debit NFTs from a user wallet (for withdrawals)
 */
const debitNFTs = async (userId, amount, description = 'Withdrawal') => {
  const wallet = await NFTWallet.findOne({ userId });
  if (!wallet) throw new Error('NFT wallet not found');
  if (wallet.nftBalance < amount) throw new Error('Insufficient NFT balance');

  await NFTWallet.findOneAndUpdate(
    { userId },
    {
      $inc: { nftBalance: -amount, totalWithdrawn: amount },
      lastUpdated: new Date(),
    }
  );

  await Transaction.create({
    userId,
    type: 'withdrawal',
    amount: -amount,
    description,
  });
};

/**
 * Get NFT stats
 */
const getNFTStats = async () => {
  const config = await getConfig();
  const price = await getCurrentNFTPrice();
  return {
    totalMinted: config.totalMinted,
    totalSupply: config.totalSupply,
    remaining: config.totalSupply - config.totalMinted,
    currentPrice: price,
    signupBonusAmount: config.signupBonusAmount,
    priceRanges: config.priceRanges,
  };
};

module.exports = { getCurrentNFTPrice, creditNFTs, debitNFTs, getNFTStats, getConfig };
