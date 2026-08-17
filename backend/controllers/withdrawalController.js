const Withdrawal = require('../models/Withdrawal');
const NFTWallet = require('../models/NFTWallet');
const NFTConfig = require('../models/NFTConfig');
const OTP = require('../models/OTP');
const { generateAndSendOTP, verifyOTP, generateOTP, storeOTP } = require('../utils/otpService');
const { sendSMSOTP } = require('../utils/smsService');

/**
 * POST /api/withdrawal/initiate
 * Step 1: Check balance → Send mobile OTP
 */
const initiateWithdrawal = async (req, res) => {
  try {
    const { amount, walletAddress, network } = req.body;
    const user = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount' });
    }

    // Get dynamic min withdrawal from config
    const config = await NFTConfig.findOne().lean();
    const minWithdrawal = config?.minWithdrawal || 100;
    if (amount < minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is $${minWithdrawal} USDT` });
    }

    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address' });
    }

    // Check USDT internal balance
    const wallet = await NFTWallet.findOne({ userId: user._id }).lean();
    if (!wallet || (wallet.usdtInternalBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient USDT balance' });
    }

    // Check for existing pending withdrawal
    const pendingUnverified = await Withdrawal.findOne({ userId: user._id, status: 'pending', otpVerified: false });
    if (pendingUnverified) await Withdrawal.deleteOne({ _id: pendingUnverified._id });

    const verifiedPending = await Withdrawal.findOne({ userId: user._id, status: 'pending', otpVerified: true }).lean();
    if (verifiedPending) {
      return res.status(400).json({ success: false, message: 'You already have a pending withdrawal awaiting admin approval' });
    }

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      walletAddress: walletAddress.toLowerCase(),
      network: network || user.network || 'BSC',
      adWatched: true,
      otpVerified: false,
      status: 'pending',
    });

    // Send mobile OTP directly (no email step)
    const mobileOtp = generateOTP();
    await storeOTP(user.mobile, mobileOtp, 'withdrawal');

    try {
      await sendSMSOTP(user.mobile, mobileOtp);
    } catch (smsErr) {
      console.error('[Withdrawal] SMS failed:', smsErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send mobile OTP. Try again.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Mobile OTP sent. Please verify.',
      data: { withdrawalId: withdrawal._id, step: 'mobile' },
    });
  } catch (error) {
    console.error('Initiate withdrawal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/withdrawal/verify-email
 * Step 2: Verify email OTP → Send mobile OTP
 */
const verifyEmailOTP = async (req, res) => {
  try {
    const { withdrawalId, otp } = req.body;
    const user = req.user;

    if (!withdrawalId || !otp) {
      return res.status(400).json({ success: false, message: 'Withdrawal ID and OTP required' });
    }

    const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, userId: user._id });
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    // Verify email OTP
    const result = await verifyOTP(user.email, otp, 'withdrawal');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Email verified — now send mobile OTP
    const mobileOtp = generateOTP();
    await storeOTP(user.mobile, mobileOtp, 'withdrawal');

    // Send SMS
    try {
      await sendSMSOTP(user.mobile, mobileOtp);
    } catch (smsErr) {
      console.error('[Withdrawal] SMS failed:', smsErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send mobile OTP. Try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified! Mobile OTP sent.',
      data: { withdrawalId: withdrawal._id, step: 'mobile' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/withdrawal/verify-mobile
 * Step 3: Verify mobile OTP → Debit USDT → Request goes to admin
 */
const verifyMobileOTP = async (req, res) => {
  try {
    const { withdrawalId, otp } = req.body;
    const user = req.user;

    if (!withdrawalId || !otp) {
      return res.status(400).json({ success: false, message: 'Withdrawal ID and OTP required' });
    }

    const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, userId: user._id });
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.otpVerified) {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    // Verify mobile OTP
    const result = await verifyOTP(user.mobile, otp, 'withdrawal');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Re-check balance
    const wallet = await NFTWallet.findOne({ userId: user._id }).lean();
    if (!wallet || (wallet.usdtInternalBalance || 0) < withdrawal.amount) {
      await Withdrawal.deleteOne({ _id: withdrawal._id });
      return res.status(400).json({ success: false, message: 'Insufficient balance. Withdrawal cancelled.' });
    }

    // Debit USDT
    await NFTWallet.findOneAndUpdate(
      { userId: user._id },
      { $inc: { usdtInternalBalance: -withdrawal.amount }, lastUpdated: new Date() }
    );

    // Mark verified
    withdrawal.otpVerified = true;
    await withdrawal.save();

    return res.status(200).json({
      success: true,
      message: 'Withdrawal confirmed! Admin will process it soon.',
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/withdrawal/history
 */
const getWithdrawalHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ userId: req.user._id, otpVerified: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments({ userId: req.user._id, otpVerified: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: { total, page, pages: Math.ceil(total / limit), limit },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initiateWithdrawal, verifyEmailOTP, verifyMobileOTP, getWithdrawalHistory };
