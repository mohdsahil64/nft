const Withdrawal = require('../models/Withdrawal');
const NFTWallet = require('../models/NFTWallet');
const { generateAndSendOTP, verifyOTP } = require('../utils/otpService');
const { debitNFTs } = require('../utils/nftPriceService');

/**
 * POST /api/withdrawal/initiate
 * Start withdrawal — ad must be watched, then send OTP
 * NFTs are NOT debited here — only after OTP verification
 */
const initiateWithdrawal = async (req, res) => {
  try {
    const { amount, walletAddress, adWatched } = req.body;
    const user = req.user;

    if (!amount || !walletAddress) {
      return res.status(400).json({ success: false, message: 'Amount and wallet address are required' });
    }

    if (!adWatched) {
      return res.status(400).json({ success: false, message: 'You must watch the ad before withdrawing' });
    }

    if (amount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is 1 NFT' });
    }

    // Check balance
    const wallet = await NFTWallet.findOne({ userId: user._id }).lean();
    if (!wallet || wallet.nftBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient NFT balance' });
    }

    // Check for pending withdrawal (one at a time)
    const pendingWithdrawal = await Withdrawal.findOne({ userId: user._id, status: 'pending', otpVerified: false }).lean();
    if (pendingWithdrawal) {
      // Delete old unverified withdrawal so user can try again
      await Withdrawal.deleteOne({ _id: pendingWithdrawal._id });
    }

    // Also check for verified pending withdrawal
    const verifiedPending = await Withdrawal.findOne({ userId: user._id, status: 'pending', otpVerified: true }).lean();
    if (verifiedPending) {
      return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request awaiting admin approval' });
    }

    // Create withdrawal record (unverified — NO debit yet)
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      walletAddress,
      network: user.network,
      adWatched: true,
      otpVerified: false,
      status: 'pending',
    });

    // Send OTP (do NOT debit NFTs yet)
    await generateAndSendOTP(user.email, 'withdrawal');

    return res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to confirm withdrawal.',
      data: { withdrawalId: withdrawal._id },
    });
  } catch (error) {
    console.error('Initiate withdrawal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/withdrawal/verify-otp
 * Confirm withdrawal with OTP — NFTs are debited only here
 */
const verifyWithdrawalOTP = async (req, res) => {
  try {
    const { withdrawalId, otp } = req.body;
    const user = req.user;

    if (!withdrawalId || !otp) {
      return res.status(400).json({ success: false, message: 'Withdrawal ID and OTP are required' });
    }

    const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, userId: user._id });
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawal.otpVerified) {
      return res.status(400).json({ success: false, message: 'Withdrawal already verified' });
    }

    const result = await verifyOTP(user.email, otp, 'withdrawal');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Re-check balance before debiting (in case balance changed)
    const wallet = await NFTWallet.findOne({ userId: user._id }).lean();
    if (!wallet || wallet.nftBalance < withdrawal.amount) {
      // Remove the unverified withdrawal
      await Withdrawal.deleteOne({ _id: withdrawal._id });
      return res.status(400).json({ success: false, message: 'Insufficient NFT balance. Withdrawal cancelled.' });
    }

    // NOW debit NFTs (only after OTP is verified)
    await debitNFTs(user._id, withdrawal.amount, `Withdrawal request #${withdrawal._id}`);

    // Mark as OTP verified
    withdrawal.otpVerified = true;
    await withdrawal.save();

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request confirmed. Admin will process it soon.',
      data: withdrawal,
    });
  } catch (error) {
    console.error('Verify withdrawal OTP error:', error);
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

module.exports = { initiateWithdrawal, verifyWithdrawalOTP, getWithdrawalHistory };
