const NFTConfig = require('../models/NFTConfig');
const NFTWallet = require('../models/NFTWallet');
const Transaction = require('../models/Transaction');

/**
 * Get current NFT config
 */
const getConfig = async () => {
  let config = await NFTConfig.findOne();
  if (!config) {
    // Auto-seed if missing (after DB reset)
    config = await NFTConfig.create({
      totalMinted: 0,
      currentPrice: 0.01,
      signupBonusAmount: 100,
      totalSupply: 2100000,
      priceIncrement: 200000, // Price doubles every 2 lakh NFTs
      minWithdrawal: 100,     // Minimum USDT withdrawal
      minSwap: 100,           // Minimum NFTs to swap
      maintenanceMode: false,
      priceRanges: [
        { from: 0, to: 200000, price: 0.01 },
        { from: 200000, to: 400000, price: 0.02 },
        { from: 400000, to: 600000, price: 0.04 },
        { from: 600000, to: 800000, price: 0.08 },
        { from: 800000, to: 1000000, price: 0.16 },
        { from: 1000000, to: 1200000, price: 0.32 },
        { from: 1200000, to: 1400000, price: 0.64 },
        { from: 1400000, to: 1600000, price: 1.28 },
        { from: 1600000, to: 1800000, price: 2.56 },
        { from: 1800000, to: 2000000, price: 5.12 },
        { from: 2000000, to: 2100000, price: 10.24 },
      ],
    });
    console.log('NFTConfig auto-seeded after missing');
  }
  return config;
};

/**
 * Get current NFT price based on totalMinted
 * Price doubles every priceIncrement (default 200,000) NFTs minted
 */
const getCurrentNFTPrice = async () => {
  const config = await getConfig();
  const { totalMinted, priceIncrement } = config;
  const increment = priceIncrement || 200000;
  const tier = Math.floor(totalMinted / increment);
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
    priceIncrement: config.priceIncrement || 200000,
    minWithdrawal: config.minWithdrawal || 100,
    minSwap: config.minSwap || 100,
    maintenanceMode: config.maintenanceMode || false,
  };
};

module.exports = { getCurrentNFTPrice, creditNFTs, debitNFTs, getNFTStats, getConfig };
