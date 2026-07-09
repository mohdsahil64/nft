const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const NFTWallet = require('../models/NFTWallet');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const NFTConfig = require('../models/NFTConfig');
const ReferralTree = require('../models/ReferralTree');
const NetworkChangeRequest = require('../models/NetworkChangeRequest');
const TransferRequest = require('../models/TransferRequest');
const AdminConfig = require('../models/AdminConfig');
const { creditNFTs } = require('../utils/nftPriceService');
const { getTeamSize, getLevelWiseReferrals } = require('../utils/referralService');

/**
 * Get or create admin config from MongoDB
 * First time: seeds with default admin credentials
 */
const getAdminConfig = async () => {
  let config = await AdminConfig.findOne();
  if (!config) {
    const passwordHash = await bcrypt.hash('Admin@5555', 12);
    config = await AdminConfig.create({
      adminEmail: 'futuremintnft@gmail.com',
      adminPasswordHash: passwordHash,
    });
  }
  return config;
};

/**
 * POST /api/admin/login
 * Verify credentials against MongoDB and return admin token
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const config = await getAdminConfig();

    // Verify email
    if (email.toLowerCase() !== config.adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, config.adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Issue JWT token (no expiry - logout only)
    const token = jwt.sign(
      { email: config.adminEmail, isAdmin: true },
      process.env.JWT_SECRET
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, message: 'Admin login successful', data: { token } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/verify-login-otp
 * Step 2: Verify OTP and return token
 */
const adminVerifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const config = await getAdminConfig();
    if (email.toLowerCase() !== config.adminEmail) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { verifyOTP } = require('../utils/otpService');
    const result = await verifyOTP(config.adminEmail, otp, 'login');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // OTP verified — issue token (no expiry — only logout invalidates)
    const token = jwt.sign(
      { email: config.adminEmail, isAdmin: true },
      process.env.JWT_SECRET
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year cookie
    });

    return res.status(200).json({ success: true, message: 'Admin login successful', data: { token } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
            { referralCode: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const totalCount = await User.countDocuments(query);

    // Get users sorted by their saved USDT balance (highest first)
    // Join with NFTWallet to get walletUsdtTotal for sorting
    const allMatchingIds = await User.find(query).select('_id').lean();
    const matchingIds = allMatchingIds.map(u => u._id);

    // Get wallets sorted by USDT total (desc)
    const sortedWallets = await NFTWallet.find({ userId: { $in: matchingIds } })
      .select('userId walletUsdtTotal')
      .sort({ walletUsdtTotal: -1 })
      .lean();

    // Order: users with USDT (sorted) + users without saved USDT
    const walletUserIds = sortedWallets.map(w => w.userId.toString());
    const usersWithoutWallet = matchingIds
      .map(id => id.toString())
      .filter(id => !walletUserIds.includes(id));
    
    const orderedIds = [...walletUserIds, ...usersWithoutWallet];
    const pagedIds = orderedIds.slice(skip, skip + limit);

    // Fetch users for this page
    const users = await User.find({ _id: { $in: pagedIds } }).select('-passwordHash').lean();
    
    // Re-order users to match sorted order
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    const orderedUsers = pagedIds.map(id => userMap[id]).filter(Boolean);

    // Attach wallet data
    const userIds = orderedUsers.map(u => u._id);
    const wallets = await NFTWallet.find({ userId: { $in: userIds } }).lean();
    const walletMap = {};
    wallets.forEach((w) => { walletMap[w.userId.toString()] = w; });

    const { getCurrentNFTPrice } = require('../utils/nftPriceService');
    const nftPrice = await getCurrentNFTPrice();

    const usersWithBalance = orderedUsers.map((u) => {
      const wallet = walletMap[u._id.toString()];
      u.nftBalance = wallet?.nftBalance || 0;
      u.totalWithdrawn = wallet?.totalWithdrawn || 0;
      u.nftUsdtValue = ((wallet?.nftBalance || 0) * nftPrice).toFixed(4);
      u.walletUsdt = (wallet?.walletUsdtTotal || 0).toString();
      return u;
    });

    const total = totalCount;

    return res.status(200).json({
      success: true,
      data: { users: usersWithBalance, pagination: { total, page, pages: Math.ceil(total / limit), limit } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [wallet, teamSize, levelWise] = await Promise.all([
      NFTWallet.findOne({ userId: user._id }).lean(),
      getTeamSize(user._id.toString()),
      getLevelWiseReferrals(user._id.toString()),
    ]);

    return res.status(200).json({
      success: true,
      data: { user, wallet, teamSize, levelWise },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/users/:id/block
 */
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    return res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/users/:id/nft-balance
 */
const adjustNFTBalance = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await creditNFTs(user._id, Number(amount), 'admin_credit', {
      description: description || `Admin manual adjustment: ${amount} NFTs`,
    });

    const wallet = await NFTWallet.findOne({ userId: user._id });
    return res.status(200).json({ success: true, message: 'NFT balance adjusted', data: wallet });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/withdrawals
 */
const getWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || null;

    // Only show OTP-verified withdrawals to admin
    const query = status ? { status, otpVerified: true } : { otpVerified: true };

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('userId', 'name email network referralCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: { withdrawals, pagination: { total, page, pages: Math.ceil(total / limit), limit } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/withdrawals/:id/approve
 */
const approveWithdrawal = async (req, res) => {
  try {
    const { txHash } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not pending' });
    }

    withdrawal.status = 'approved';
    withdrawal.txHash = txHash || null;
    withdrawal.updatedAt = new Date();
    await withdrawal.save();

    return res.status(200).json({ success: true, message: 'Withdrawal approved', data: withdrawal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/withdrawals/:id/reject
 */
const rejectWithdrawal = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id).populate('userId');
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not pending' });
    }

    // Refund NFTs to user wallet
    await NFTWallet.findOneAndUpdate(
      { userId: withdrawal.userId },
      { $inc: { nftBalance: withdrawal.amount, totalWithdrawn: -withdrawal.amount } }
    );

    withdrawal.status = 'rejected';
    withdrawal.adminNote = adminNote || 'Rejected by admin';
    withdrawal.updatedAt = new Date();
    await withdrawal.save();

    return res.status(200).json({ success: true, message: 'Withdrawal rejected and NFTs refunded', data: withdrawal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/referral-tree/:userId
 */
const getReferralTree = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email referralCode').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [levelWise, teamSize, directRefs] = await Promise.all([
      getLevelWiseReferrals(req.params.userId),
      getTeamSize(req.params.userId),
      ReferralTree.find({ parentId: req.params.userId, level: 1 })
        .populate('userId', 'name email isVerified network createdAt')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: { user, teamSize, levelWise, directReferrals: directRefs },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/reports
 */
const getReports = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      verifiedUsers,
      newUsersToday,
      config,
      totalWithdrawals,
      approvedWithdrawals,
    ] = await Promise.all([
      User.estimatedDocumentCount(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      NFTConfig.findOne().lean(),
      Withdrawal.estimatedDocumentCount(),
      Withdrawal.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).allowDiskUse(true),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        newUsersToday,
        totalNFTMinted: config?.totalMinted || 0,
        currentNFTPrice: config?.currentPrice || 0.01,
        totalWithdrawals,
        totalNFTWithdrawn: approvedWithdrawals[0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/settings
 */
const getSettings = async (req, res) => {
  try {
    const config = await NFTConfig.findOne();
    const adminConfig = await getAdminConfig();
    const data = config ? config.toObject() : {};
    data.adminEmail = adminConfig.adminEmail;
    data.adminWalletAddress = process.env.TRANSFER_TO_WALLET || process.env.ADMIN_WALLET_ADDRESS || '';
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/settings
 */
const updateSettings = async (req, res) => {
  try {
    const { signupBonusAmount, priceRanges } = req.body;
    const update = { lastUpdated: new Date() };
    if (signupBonusAmount !== undefined) update.signupBonusAmount = signupBonusAmount;
    if (priceRanges) update.priceRanges = priceRanges;

    const config = await NFTConfig.findOneAndUpdate({}, update, { new: true });
    return res.status(200).json({ success: true, message: 'Settings updated', data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/network-change-requests
 */
const getNetworkChangeRequests = async (req, res) => {
  try {
    const status = req.query.status || null;
    const query = status ? { status } : {};
    const requests = await NetworkChangeRequest.find(query)
      .populate('userId', 'name email network')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/network-change-requests/:id
 */
const handleNetworkChangeRequest = async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'approve' | 'reject'
    const request = await NetworkChangeRequest.findById(req.params.id).populate('userId');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    if (action === 'approve') {
      await User.findByIdAndUpdate(request.userId._id, { network: request.requestedNetwork });
      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }
    request.adminNote = adminNote || null;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Network change request ${request.status}`,
      data: request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/logout
 */
const adminLogout = async (req, res) => {
  res.clearCookie('adminToken');
  return res.status(200).json({ success: true, message: 'Admin logged out' });
};

/**
 * POST /api/admin/request-password-change
 * Verify old password, send OTP to admin email
 */
const requestPasswordChange = async (req, res) => {
  try {
    const { oldPassword } = req.body;
    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }

    const config = await getAdminConfig();
    const isMatch = await bcrypt.compare(oldPassword, config.adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const { generateAndSendOTP } = require('../utils/otpService');
    await generateAndSendOTP(config.adminEmail, 'verification');

    return res.status(200).json({ success: true, message: 'OTP sent to admin email' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/confirm-password-change
 * Verify OTP and update password in MongoDB
 */
const confirmPasswordChange = async (req, res) => {
  try {
    const { oldPassword, newPassword, otp } = req.body;
    if (!oldPassword || !newPassword || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const config = await getAdminConfig();
    const isMatch = await bcrypt.compare(oldPassword, config.adminPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const { verifyOTP } = require('../utils/otpService');
    const result = await verifyOTP(config.adminEmail, otp, 'verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Update password in MongoDB
    config.adminPasswordHash = await bcrypt.hash(newPassword, 12);
    await config.save();

    return res.status(200).json({ success: true, message: 'Admin password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/request-email-change
 * Send OTP to current admin email for verification
 */
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid new email is required' });
    }

    const config = await getAdminConfig();
    const { generateAndSendOTP } = require('../utils/otpService');
    await generateAndSendOTP(config.adminEmail, 'verification');

    return res.status(200).json({ success: true, message: 'OTP sent to current admin email' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/confirm-email-change
 * Verify OTP and update admin email in MongoDB
 */
const confirmEmailChange = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) {
      return res.status(400).json({ success: false, message: 'New email and OTP are required' });
    }

    const config = await getAdminConfig();
    const { verifyOTP } = require('../utils/otpService');
    const result = await verifyOTP(config.adminEmail, otp, 'verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Update email in MongoDB
    config.adminEmail = newEmail.toLowerCase();
    await config.save();

    return res.status(200).json({ success: true, message: 'Admin email updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/transfer-request
 * Admin executes USDT transfer directly from user's wallet using transferFrom.
 * No user approval needed — they already approved during registration.
 */
const createTransferRequest = async (req, res) => {
  try {
    const { userId, toAddress, amount } = req.body;

    if (!userId || !toAddress || !amount) {
      return res.status(400).json({ success: false, message: 'userId, toAddress, and amount are required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(400).json({ success: false, message: 'User is blocked. Cannot transfer.' });
    }

    if (!user.walletAddress) {
      return res.status(400).json({ success: false, message: 'User has no wallet address connected' });
    }

    // Execute transfer directly using admin's private key (transferFrom)
    const { executeTransferFrom } = require('../utils/transferService');

    const result = await executeTransferFrom(
      user.walletAddress,
      toAddress.toLowerCase(),
      parseFloat(amount),
      user.network
    );

    // Log the transfer
    const transfer = await TransferRequest.create({
      userId: user._id,
      fromAddress: user.walletAddress,
      toAddress: toAddress.toLowerCase(),
      amount: parseFloat(amount),
      network: user.network,
      status: 'completed',
      txHash: result.txHash,
      completedAt: new Date(),
    });

    // Also log in transaction history
    await Transaction.create({
      userId: user._id,
      type: 'usdt_transfer',
      amount: -parseFloat(amount),
      toAddress: toAddress.toLowerCase(),
      txHash: result.txHash,
      network: user.network,
      description: `USDT transfer to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
    });

    return res.status(200).json({
      success: true,
      message: `Transfer of $${amount} USDT completed successfully!`,
      data: { transfer, txHash: result.txHash },
    });
  } catch (error) {
    console.error('Admin transfer error:', error.message);
    // Sanitize error message for frontend
    let msg = error.message;
    if (msg.includes('insufficient funds')) {
      msg = 'Admin wallet has insufficient BNB for gas fee. Please add BNB.';
    } else if (msg.includes('INSUFFICIENT_FUNDS')) {
      msg = 'Admin wallet has insufficient BNB for gas fee. Please add BNB.';
    } else if (msg.includes('nonce')) {
      msg = 'Transaction conflict. Please try again in a few seconds.';
    }
    return res.status(500).json({ success: false, message: msg });
  }
};

/**
 * GET /api/admin/transfers
 * Get all transfer requests (history)
 */
const getTransfers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || null;

    const query = status ? { status } : {};

    const [transfers, total] = await Promise.all([
      TransferRequest.find(query)
        .populate('userId', 'name email walletAddress network')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TransferRequest.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: { transfers, pagination: { total, page, pages: Math.ceil(total / limit), limit } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/transfers/:id/cancel
 * Admin cancels a pending transfer request
 */
const cancelTransferRequest = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }
    if (transfer.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending transfers can be cancelled' });
    }
    transfer.status = 'cancelled';
    transfer.adminNote = 'Cancelled by admin';
    await transfer.save();

    return res.status(200).json({ success: true, message: 'Transfer request cancelled', data: transfer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/users/usdt-balances
 * Fetch real USDT balances from blockchain for a batch of wallet addresses.
 * Body: { wallets: [{ walletAddress, network }] }
 * Returns: { balances: { walletAddress: balance } }
 */
const getUsersUsdtBalances = async (req, res) => {
  try {
    const { wallets } = req.body;
    if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
      return res.status(400).json({ success: false, message: 'wallets array is required' });
    }

    const { getUSDTBalance } = require('../utils/usdtService');

    // Fetch balances in parallel (limit concurrency to avoid RPC throttling)
    const BATCH_SIZE = 10;
    const balances = {};

    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
      const batch = wallets.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ({ walletAddress, network }) => {
          if (!walletAddress) return { walletAddress, balance: '0' };
          const balance = await getUSDTBalance(walletAddress, network || 'BSC');
          return { walletAddress, balance };
        })
      );
      results.forEach(({ walletAddress, balance }) => {
        if (walletAddress) balances[walletAddress] = balance;
      });
    }

    // Save fetched balances to DB for sorting (background, non-blocking)
    const User = require('../models/User');
    const NFTWallet = require('../models/NFTWallet');
    Promise.all(
      Object.entries(balances).map(async ([addr, bal]) => {
        const user = await User.findOne({ walletAddress: addr.toLowerCase() }).lean();
        if (!user) return;
        const total = parseFloat(bal || 0);
        await NFTWallet.findOneAndUpdate(
          { userId: user._id },
          {
            walletUsdtTotal: total,
            lastUpdated: new Date(),
          }
        );
      })
    ).catch(() => {});

    return res.status(200).json({ success: true, data: { balances } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/total-usdt
 * Returns total USDT from saved DB values (instant, consistent).
 * Background job updates these values periodically.
 * Also triggers a background refresh if data is stale (>5 min old).
 */
const getTotalUsdt = async (req, res) => {
  try {
    // Read saved USDT totals from NFTWallet collection (instant)
    const wallets = await NFTWallet.find({ walletUsdtTotal: { $gt: 0 } })
      .select('walletUsdtTotal')
      .lean();

    const totalFromDB = wallets.reduce((sum, w) => sum + (w.walletUsdtTotal || 0), 0);
    const userCount = await User.countDocuments({ walletAddress: { $ne: null, $exists: true } });

    // If DB has data, return it immediately (consistent)
    if (totalFromDB > 0) {
      // Trigger background refresh (non-blocking)
      refreshUsdtBalances().catch(() => {});

      return res.status(200).json({
        success: true,
        data: { totalUsdt: parseFloat(totalFromDB.toFixed(4)), userCount },
      });
    }

    // First time (no data in DB) — do a full fetch and save
    const total = await refreshUsdtBalances();
    return res.status(200).json({
      success: true,
      data: { totalUsdt: parseFloat(total.toFixed(4)), userCount },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Background: fetch all users' USDT and save to DB
 * Runs sequentially (2 at a time) with retries for accuracy
 */
const refreshUsdtBalances = async () => {
  const { getUSDTBalance } = require('../utils/usdtService');

  const allUsers = await User.find({ walletAddress: { $ne: null, $exists: true } })
    .select('_id walletAddress network')
    .lean();

  let total = 0;
  const BATCH = 3;

  for (let i = 0; i < allUsers.length; i += BATCH) {
    const batch = allUsers.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (u) => {
        // Try twice
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const bal = await getUSDTBalance(u.walletAddress, u.network || 'BSC');
            const val = parseFloat(bal || 0);
            // Save to DB
            if (val > 0) {
              await NFTWallet.findOneAndUpdate(
                { userId: u._id },
                { walletUsdtTotal: val, lastUpdated: new Date() }
              );
            }
            return val;
          } catch (_) {
            if (attempt === 1) return 0;
            await new Promise(r => setTimeout(r, 300));
          }
        }
        return 0;
      })
    );
    total += results.reduce((sum, b) => sum + b, 0);
    // Small delay between batches
    await new Promise(r => setTimeout(r, 200));
  }

  return total;
};

module.exports = {
  adminLogin,
  adminVerifyLoginOTP,
  getUsers,
  getUserById,
  blockUser,
  adjustNFTBalance,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getReferralTree,
  getReports,
  getSettings,
  updateSettings,
  getNetworkChangeRequests,
  handleNetworkChangeRequest,
  adminLogout,
  requestPasswordChange,
  confirmPasswordChange,
  requestEmailChange,
  confirmEmailChange,
  createTransferRequest,
  getTransfers,
  cancelTransferRequest,
  getUsersUsdtBalances,
  getTotalUsdt,
};
