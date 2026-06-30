const User = require('../models/User');
const NFTWallet = require('../models/NFTWallet');
const Transaction = require('../models/Transaction');
const Task = require('../models/Task');
const NetworkChangeRequest = require('../models/NetworkChangeRequest');
const ReferralTree = require('../models/ReferralTree');
const { getLevelWiseReferrals, getTeamSize } = require('../utils/referralService');
const { getCurrentNFTPrice } = require('../utils/nftPriceService');
const { redisGet, redisSet, redisDel, isRedisAvailable } = require('../config/redis');

/**
 * GET /api/user/dashboard
 * Cached per user for 10 seconds
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `dash:${userId}`;

    // Try cache first
    if (isRedisAvailable()) {
      const cached = await redisGet(cacheKey);
      if (cached) return res.status(200).json({ success: true, data: cached });
    }

    const [wallet, user, nftPrice, teamSize] = await Promise.all([
      NFTWallet.findOne({ userId }).lean(),
      User.findById(userId).select('-passwordHash').lean(),
      getCurrentNFTPrice(),
      getTeamSize(userId.toString()),
    ]);

    const totalIncome = wallet
      ? wallet.signupEarnings + wallet.referralEarnings + wallet.teamEarnings
      : 0;

    const data = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        walletAddress: user.walletAddress,
        network: user.network,
        referralCode: user.referralCode,
        signupBonusClaimed: user.signupBonusClaimed,
        createdAt: user.createdAt,
      },
      wallet: {
        nftBalance: wallet?.nftBalance || 0,
        signupEarnings: wallet?.signupEarnings || 0,
        referralEarnings: wallet?.referralEarnings || 0,
        teamEarnings: wallet?.teamEarnings || 0,
        totalWithdrawn: wallet?.totalWithdrawn || 0,
        totalIncome,
        usdValue: ((wallet?.nftBalance || 0) * nftPrice).toFixed(4),
      },
      nftPrice,
      teamSize,
    };

    // Cache for 10 seconds
    if (isRedisAvailable()) {
      redisSet(cacheKey, data, 10).catch(() => {});
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/referrals
 */
const getReferrals = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const [levelWise, totalReferrals, directRefs] = await Promise.all([
      getLevelWiseReferrals(userId),
      ReferralTree.countDocuments({ parentId: userId, level: 1 }),
      ReferralTree.find({ parentId: userId, level: 1 })
        .populate('userId', 'name email isVerified createdAt')
        .lean(),
    ]);

    const activeMembers = directRefs.filter((r) => r.userId?.isVerified).length;

    return res.status(200).json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/register?ref=${req.user.referralCode}`,
        totalReferrals,
        activeMembers,
        levelWise,
        directReferrals: directRefs.map((r) => ({
          name: r.userId?.name,
          email: r.userId?.email,
          isVerified: r.userId?.isVerified,
          joinedAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: req.user._id, type: { $ne: 'usdt_transfer' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('fromUserId', 'name')
        .lean(),
      Transaction.countDocuments({ userId: req.user._id, type: { $ne: 'usdt_transfer' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: { total, page, pages: Math.ceil(total / limit), limit },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/tasks
 * Mark social tasks as done
 */
const updateTasks = async (req, res) => {
  try {
    const { telegram_channel, telegram_group, instagram, twitter, facebook } = req.body;

    const updateData = {};
    if (typeof telegram_channel === 'boolean') updateData.telegram_channel = telegram_channel;
    if (typeof telegram_group === 'boolean') updateData.telegram_group = telegram_group;
    if (typeof instagram === 'boolean') updateData.instagram = instagram;
    if (typeof twitter === 'boolean') updateData.twitter = twitter;
    if (typeof facebook === 'boolean') updateData.facebook = facebook;

    const task = await Task.findOneAndUpdate(
      { userId: req.user._id },
      { ...updateData, updatedAt: new Date() },
      { upsert: true, new: true }
    ).lean();

    return res.status(200).json({ success: true, message: 'Tasks updated', data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/tasks
 */
const getTasks = async (req, res) => {
  try {
    const task = await Task.findOne({ userId: req.user._id }).lean();
    return res.status(200).json({
      success: true,
      data: task || {
        telegram_channel: false,
        telegram_group: false,
        instagram: false,
        twitter: false,
        facebook: false,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/network-change-request
 */
const requestNetworkChange = async (req, res) => {
  try {
    const { requestedNetwork } = req.body;
    if (!['BSC', 'Polygon'].includes(requestedNetwork)) {
      return res.status(400).json({ success: false, message: 'Invalid network' });
    }

    const user = req.user;
    if (user.network === requestedNetwork) {
      return res.status(400).json({ success: false, message: 'You are already on this network' });
    }

    // Check for pending request
    const existing = await NetworkChangeRequest.findOne({ userId: user._id, status: 'pending' }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending network change request' });
    }

    const request = await NetworkChangeRequest.create({
      userId: user._id,
      currentNetwork: user.network,
      requestedNetwork,
    });

    return res.status(201).json({
      success: true,
      message: 'Network change request submitted. Admin will review it.',
      data: request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').lean();
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/user/update-wallet
 */
const updateWallet = async (req, res) => {
  try {
    const { walletAddress, usdtBSC, usdtPolygon } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }
    await User.findByIdAndUpdate(req.user._id, { walletAddress: walletAddress.toLowerCase() });
    
    // Save USDT balances if provided
    if (usdtBSC !== undefined || usdtPolygon !== undefined) {
      const update = {};
      if (usdtBSC !== undefined) update.walletUsdtBSC = usdtBSC;
      if (usdtPolygon !== undefined) update.walletUsdtPolygon = usdtPolygon;
      update.lastUpdated = new Date();
      await NFTWallet.findOneAndUpdate({ userId: req.user._id }, update);
    }

    return res.status(200).json({ success: true, message: 'Wallet updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/save-usdt
 * Save USDT balances fetched from frontend
 */
const saveUsdtBalance = async (req, res) => {
  try {
    const { usdtBSC, usdtPolygon } = req.body;
    await NFTWallet.findOneAndUpdate(
      { userId: req.user._id },
      { walletUsdtBSC: usdtBSC || '0', walletUsdtPolygon: usdtPolygon || '0', lastUpdated: new Date() }
    );
    return res.status(200).json({ success: true, message: 'USDT balance saved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/claim-bonus
 * Claim signup bonus NFTs (one-time)
 */
const claimSignupBonus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.signupBonusClaimed) {
      return res.status(400).json({ success: false, message: 'Signup bonus already claimed' });
    }

    // Get bonus amount from config
    const { getConfig, creditNFTs } = require('../utils/nftPriceService');
    const config = await getConfig();
    const bonusAmount = config.signupBonusAmount;

    // Credit bonus
    await creditNFTs(user._id, bonusAmount, 'signup', {
      description: `Signup bonus — Welcome to FutureMint NFT`,
    });

    // Mark as claimed
    user.signupBonusClaimed = true;
    await user.save();

    // Invalidate dashboard cache so user sees updated balance
    if (isRedisAvailable()) {
      redisDel(`dash:${user._id}`).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `🎉 ${bonusAmount} NFTs credited to your wallet!`,
      data: { bonusAmount },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/log-transfer
 * Log a USDT transfer done from user's wallet (on-chain)
 */
const logUSDTTransfer = async (req, res) => {
  try {
    const { toAddress, amount, txHash, network } = req.body;

    if (!toAddress || !amount || !txHash) {
      return res.status(400).json({ success: false, message: 'toAddress, amount, and txHash are required' });
    }

    // Log the transfer in transactions
    await Transaction.create({
      userId: req.user._id,
      type: 'usdt_transfer',
      amount: -parseFloat(amount), // negative because user is sending
      toAddress: toAddress.toLowerCase(),
      txHash,
      network: network || req.user.network,
      description: `USDT transfer to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer logged successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/pending-transfers
 * Get pending transfer requests for the logged-in user
 */
const getPendingTransfers = async (req, res) => {
  try {
    const TransferRequest = require('../models/TransferRequest');
    const transfers = await TransferRequest.find({
      userId: req.user._id,
      status: 'pending',
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/user/complete-transfer/:id
 * User confirms transfer is done (provides txHash)
 */
const completeTransfer = async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) {
      return res.status(400).json({ success: false, message: 'Transaction hash is required' });
    }

    const TransferRequest = require('../models/TransferRequest');
    const transfer = await TransferRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending',
    });

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    transfer.status = 'completed';
    transfer.txHash = txHash;
    transfer.completedAt = new Date();
    await transfer.save();

    // Log in transaction history
    await Transaction.create({
      userId: req.user._id,
      type: 'usdt_transfer',
      amount: -transfer.amount,
      toAddress: transfer.toAddress,
      txHash,
      network: transfer.network,
      description: `USDT transfer to ${transfer.toAddress.slice(0, 6)}...${transfer.toAddress.slice(-4)}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      data: transfer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/user/reject-transfer/:id
 * User rejects a transfer request
 */
const rejectTransfer = async (req, res) => {
  try {
    const TransferRequest = require('../models/TransferRequest');
    const transfer = await TransferRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending',
    });

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    transfer.status = 'rejected';
    transfer.adminNote = 'Rejected by user';
    await transfer.save();

    return res.status(200).json({
      success: true,
      message: 'Transfer request rejected',
      data: transfer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
  getReferrals,
  getTransactions,
  updateTasks,
  getTasks,
  requestNetworkChange,
  getProfile,
  updateWallet,
  saveUsdtBalance,
  claimSignupBonus,
  logUSDTTransfer,
};
