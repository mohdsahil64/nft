const User = require('../models/User');
const NFTWallet = require('../models/NFTWallet');
const Transaction = require('../models/Transaction');
const Task = require('../models/Task');
const NetworkChangeRequest = require('../models/NetworkChangeRequest');
const ReferralTree = require('../models/ReferralTree');
const DailyWatch = require('../models/DailyWatch');
const { getLevelWiseReferrals, getTeamSize } = require('../utils/referralService');
const { getCurrentNFTPrice } = require('../utils/nftPriceService');

/**
 * GET /api/user/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [wallet, user, nftPrice, teamSize] = await Promise.all([
      NFTWallet.findOne({ userId }).lean(),
      User.findById(userId).select('-passwordHash').lean(),
      getCurrentNFTPrice(),
      getTeamSize(userId.toString()),
    ]);

    // Get FM config
    const FMConfig = require('../models/FMConfig');
    const fmConfig = await FMConfig.findOne().lean();

    // Get active announcement
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findOne({ active: true }).sort({ createdAt: -1 }).lean();

    // Calculate today's earnings (from midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTransactions = await Transaction.find({
      userId,
      createdAt: { $gte: todayStart },
      type: { $nin: ['withdrawal', 'signup', 'usdt_transfer'] },
      source: { $ne: 'admin' },
    }).lean();

    let todayNFT = 0;
    let todayFM = 0;
    todayTransactions.forEach((t) => {
      if (t.amount > 0) todayNFT += t.amount;
      if (t.fmAmount > 0) todayFM += t.fmAmount;
    });

    // Today FM from DailyWatch
    const DailyWatch = require('../models/DailyWatch');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayWatch = await DailyWatch.findOne({ userId, watchDate: todayStr }).lean();
    if (todayWatch) {
      todayFM += (todayWatch.fmEarned || 0) + (todayWatch.streakBonusFM || 0);
    }

    const totalIncome = wallet
      ? wallet.signupEarnings + wallet.referralEarnings + wallet.teamEarnings
      : 0;

    return res.status(200).json({
      success: true,
      data: {
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
          usdValue: ((wallet?.nftBalance || 0) * nftPrice).toFixed(2),
          // FM Token
          fmBalance: wallet?.fmBalance || 0,
          fmSignupEarnings: wallet?.fmSignupEarnings || 0,
          fmReferralEarnings: wallet?.fmReferralEarnings || 0,
          fmTeamEarnings: wallet?.fmTeamEarnings || 0,
          // Internal USDT
          usdtInternalBalance: wallet?.usdtInternalBalance || 0,
        },
        nftPrice,
        teamSize,
        todayNFT,
        todayFM,
        fmMinted: fmConfig ? fmConfig.totalMinted : 0,
        fmSupply: fmConfig ? fmConfig.totalSupply : 21000000,
        announcement: announcement ? { message: announcement.message, type: announcement.type } : null,
      },
    });
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

    // Active Today = team members who watched ad today
    const today = new Date().toISOString().split('T')[0];
    const allTeamUserIds = directRefs.map((r) => r.userId?._id).filter(Boolean);
    let activeToday = 0;
    if (allTeamUserIds.length > 0) {
      activeToday = await DailyWatch.countDocuments({
        userId: { $in: allTeamUserIds },
        watchDate: today,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/register?ref=${req.user.referralCode}`,
        totalReferrals,
        activeMembers: activeToday,
        totalTeamCount: allTeamUserIds.length,
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
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'lifetime';

    // Build date filter
    let dateFilter = {};
    const now = new Date();
    if (filter === 'today') {
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: todayStart } };
    } else if (filter === 'yesterday') {
      const yStart = new Date(now); yStart.setDate(yStart.getDate() - 1); yStart.setHours(0, 0, 0, 0);
      const yEnd = new Date(now); yEnd.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: yStart, $lt: yEnd } };
    } else if (filter === 'week') {
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: weekStart } };
    } else if (filter === 'month') {
      const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30); monthStart.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: monthStart } };
    }

    const query = { 
      userId: req.user._id, 
      type: { $nin: ['withdrawal', 'usdt_transfer'] },
      source: { $ne: 'admin' },
      ...dateFilter 
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('fromUserId', 'name')
        .lean(),
      Transaction.countDocuments(query),
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
 * Uses atomic update to prevent double-claim race condition
 */
const claimSignupBonus = async (req, res) => {
  try {
    // Atomic check-and-set: only proceeds if signupBonusClaimed is still false
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, signupBonusClaimed: false },
      { $set: { signupBonusClaimed: true } },
      { new: true }
    );

    if (!user) {
      // Either user not found or bonus already claimed
      const exists = await User.findById(req.user._id);
      if (!exists) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(400).json({ success: false, message: 'Signup bonus already claimed' });
    }

    // Get bonus amount from config
    const { getConfig, creditNFTs } = require('../utils/nftPriceService');
    const config = await getConfig();
    const bonusAmount = config.signupBonusAmount;

    // Credit NFT bonus
    await creditNFTs(user._id, bonusAmount, 'signup', {
      description: `Signup bonus — Welcome to FutureMint NFT`,
    });

    // Credit FM Token bonus (100 FM)
    const fmBonus = 100;
    await NFTWallet.findOneAndUpdate(
      { userId: user._id },
      { $inc: { fmBalance: fmBonus, fmSignupEarnings: fmBonus }, lastUpdated: new Date() }
    );

    // Log FM bonus transaction separately
    await Transaction.create({
      userId: user._id,
      type: 'signup',
      amount: fmBonus,
      fmAmount: fmBonus,
      description: 'Signup Bonus — 100 FM (Locked 180 days)',
    });

    // Update FM minted count
    const FMConfig = require('../models/FMConfig');
    await FMConfig.findOneAndUpdate({}, { $inc: { totalMinted: fmBonus } });

    return res.status(200).json({
      success: true,
      message: `🎉 ${bonusAmount} NFTs + ${fmBonus} FM credited!`,
      data: { bonusAmount, fmBonus },
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

/**
 * GET /api/user/watch-status
 * Returns: watchedToday, streakDays, last7DaysHistory
 */
const getWatchStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if watched today
    const todayWatch = await DailyWatch.findOne({ userId, watchDate: today }).lean();

    // Get last 7 watches to calculate streak
    const recentWatches = await DailyWatch.find({ userId })
      .sort({ watchDate: -1 })
      .limit(90)
      .select('watchDate streakCount')
      .lean();

    // Calculate current streak
    let streakDays = 0;
    if (recentWatches.length > 0) {
      const checkDate = new Date();
      // If not watched today, start checking from yesterday
      if (!todayWatch) checkDate.setDate(checkDate.getDate() - 1);

      for (let i = 0; i < 90; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const found = recentWatches.find((w) => w.watchDate === dateStr);
        if (found) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      // If watched today, include today
      if (todayWatch) streakDays = Math.max(streakDays, 1);
    }

    // Last 7 days history (for streak circles)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const watched = recentWatches.some((w) => w.watchDate === dateStr);
      last7.push({ date: dateStr, watched });
    }

    return res.status(200).json({
      success: true,
      data: {
        watchedToday: !!todayWatch,
        streakDays,
        videosLeft: todayWatch ? 0 : 1,
        last7Days: last7,
        nextStreakMilestone: streakDays < 7 ? 7 : streakDays < 30 ? 30 : streakDays < 90 ? 90 : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/watch-complete
 * Credits 5 NFT + 1 FM, distributes 15-level commission, tracks streak
 */
const completeWatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already watched today
    const existing = await DailyWatch.findOne({ userId, watchDate: today });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already watched today. Come back tomorrow!' });
    }

    const NFT_REWARD = 5;
    const FM_REWARD = 1;

    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayWatch = await DailyWatch.findOne({ userId, watchDate: yesterdayStr }).lean();
    const streakCount = yesterdayWatch ? (yesterdayWatch.streakCount || 0) + 1 : 1;

    // Check streak bonuses
    let streakBonusNFT = 0;
    let streakBonusFM = 0;
    if (streakCount === 7) { streakBonusNFT = 10; streakBonusFM = 5; }
    else if (streakCount === 30) { streakBonusNFT = 50; streakBonusFM = 25; }
    else if (streakCount === 90) { streakBonusNFT = 150; streakBonusFM = 100; }

    const totalNFT = NFT_REWARD + streakBonusNFT;
    const totalFM = FM_REWARD + streakBonusFM;

    // Credit to user wallet
    await NFTWallet.findOneAndUpdate(
      { userId },
      {
        $inc: { nftBalance: totalNFT, fmBalance: totalFM },
        lastUpdated: new Date(),
      }
    );

    // Log transactions (separate for NFT and FM)
    await Transaction.create({
      userId,
      type: 'watch',
      amount: totalNFT,
      description: `Watch & Earn — Daily video reward${streakBonusNFT ? ` + ${streakCount}d streak bonus` : ''}`,
    });

    await Transaction.create({
      userId,
      type: 'watch',
      amount: totalFM,
      fmAmount: totalFM,
      description: `Watch & Earn — FM Token reward${streakBonusFM ? ` + ${streakCount}d streak bonus` : ''}`,
    });

    // Save watch record
    await DailyWatch.create({
      userId,
      watchDate: today,
      nftEarned: NFT_REWARD,
      fmEarned: FM_REWARD,
      streakCount,
      streakBonusNFT,
      streakBonusFM,
    });

    // Distribute commission to 15-level ancestors
    const { processWatchCommission } = require('../utils/watchCommissionService');
    await processWatchCommission(userId, NFT_REWARD, FM_REWARD);

    // Update NFTConfig totalMinted
    const NFTConfig = require('../models/NFTConfig');
    await NFTConfig.findOneAndUpdate({}, { $inc: { totalMinted: totalNFT } });

    // Update FMConfig totalMinted
    const FMConfig = require('../models/FMConfig');
    await FMConfig.findOneAndUpdate({}, { $inc: { totalMinted: totalFM } });

    return res.status(200).json({
      success: true,
      message: streakBonusNFT
        ? `🎉 Earned ${NFT_REWARD} NFT + ${FM_REWARD} FM + Streak Bonus: ${streakBonusNFT} NFT + ${streakBonusFM} FM!`
        : `✅ Earned ${NFT_REWARD} NFT + ${FM_REWARD} FM! Streak: ${streakCount} days`,
      data: { nftEarned: totalNFT, fmEarned: totalFM, streakCount, streakBonusNFT, streakBonusFM },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already watched today!' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/swap-nft
 * Swap NFT to internal USDT wallet (NFT × currentPrice = USDT)
 */
const swapNFT = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount' });
    }

    // Get dynamic min swap from config
    const NFTConfig = require('../models/NFTConfig');
    const config = await NFTConfig.findOne().lean();
    const minSwap = config?.minSwap || 100;

    if (amount < minSwap) {
      return res.status(400).json({ success: false, message: `Minimum ${minSwap} NFT required to swap` });
    }

    const wallet = await NFTWallet.findOne({ userId }).lean();
    if (!wallet || wallet.nftBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient NFT balance' });
    }

    // Get current NFT price
    const { getCurrentNFTPrice } = require('../utils/nftPriceService');
    const nftPrice = await getCurrentNFTPrice();
    const grossUsdt = amount * nftPrice;
    const processingFee = parseFloat((grossUsdt * 0.05).toFixed(6)); // 5% fee
    const usdtAmount = parseFloat((grossUsdt - processingFee).toFixed(6));

    // Deduct NFT, add USDT to internal wallet
    await NFTWallet.findOneAndUpdate(
      { userId },
      {
        $inc: { nftBalance: -amount, usdtInternalBalance: usdtAmount },
        lastUpdated: new Date(),
      }
    );

    // Log transaction
    await Transaction.create({
      userId,
      type: 'usdt_transfer',
      amount: -amount,
      description: `Swapped ${amount} NFT → $${usdtAmount} USDT (Fee: $${processingFee}) @ $${nftPrice}/NFT`,
    });

    return res.status(200).json({
      success: true,
      message: `Swapped ${amount} NFT → $${usdtAmount} USDT (5% fee: $${processingFee})`,
      data: { nftSwapped: amount, usdtReceived: usdtAmount, fee: processingFee, priceUsed: nftPrice },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/swap-history
 * Get recent swap transactions
 */
const getSwapHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [swaps, total] = await Promise.all([
      Transaction.find({ userId: req.user._id, type: 'usdt_transfer' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ userId: req.user._id, type: 'usdt_transfer' }),
    ]);

    return res.status(200).json({
      success: true,
      data: { swaps, pagination: { total, page, pages: Math.ceil(total / limit) } },
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
  getWatchStatus,
  completeWatch,
  swapNFT,
  getSwapHistory,
};
