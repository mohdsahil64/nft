const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const NFTWallet = require('../models/NFTWallet');
const { generateAndSendOTP, verifyOTP } = require('../utils/otpService');
const { creditNFTs, getConfig } = require('../utils/nftPriceService');
const { processReferralChain } = require('../utils/referralService');
const { checkTeamMilestones } = require('../utils/teamService');

/**
 * Generate unique 8-char referral code
 */
const generateReferralCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
    exists = await User.findOne({ referralCode: code });
  }
  return code;
};

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, mobile, password, referralCode, network, walletAddress } = req.body;

    if (!name || !email || !mobile || !password || !network) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['BSC', 'Polygon'].includes(network)) {
      return res.status(400).json({ success: false, message: 'Network must be BSC or Polygon' });
    }

    // Check max 3 accounts per email and per mobile (only count verified users, not pending)
    const PendingReg = require('../models/PendingRegistration');
    
    const emailCount = await User.countDocuments({ email: email.toLowerCase() });
    if (emailCount >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 accounts allowed per email' });
    }

    const mobileCount = await User.countDocuments({ mobile });
    if (mobileCount >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 accounts allowed per mobile number' });
    }

    // Clean up any existing pending registration for this email (allow retry)
    await PendingReg.deleteMany({ email: email.toLowerCase() });

    // Check wallet address — 1 wallet per account only
    if (walletAddress) {
      const walletExists = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (walletExists) {
        return res.status(409).json({ 
          success: false, 
          message: 'This wallet is already registered. Please login instead.',
          isExistingWallet: true,
        });
      }
      // If wallet is stuck in pending registration, delete the old one and allow retry
      const walletPending = await PendingReg.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (walletPending) {
        await PendingReg.deleteOne({ _id: walletPending._id });
        // Also clean up any old OTP for this email
        const OTPModel = require('../models/OTP');
        await OTPModel.deleteMany({ email: walletPending.email, purpose: 'verification' });
      }
    }

    // Validate referral code if provided
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referredByUser) {
        return res.status(400).json({ success: false, message: 'Invalid referral code' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Store registration data temporarily in OTP collection (not in User DB)
    const OTP = require('../models/OTP');
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'verification' });

    // Save pending registration data in OTP record
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp: Math.floor(100000 + Math.random() * 900000).toString(),
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    });

    // Store registration data temporarily (we'll use a separate temp collection)
    const PendingRegistration = require('../models/PendingRegistration');
    await PendingRegistration.deleteMany({ email: email.toLowerCase() });
    await PendingRegistration.create({
      name,
      email: email.toLowerCase(),
      mobile,
      passwordHash,
      walletAddress: walletAddress ? walletAddress.toLowerCase() : undefined,
      network,
      referredBy: referredByUser ? referredByUser._id : null,
    });

    // Send OTP email (non-blocking — don't wait for SMTP, respond immediately)
    const { sendOTPEmail } = require('../utils/emailService');
    sendOTPEmail(email.toLowerCase(), otpRecord.otp, 'verification').catch((err) => {
      console.error('OTP email send failed:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      data: { email: email.toLowerCase() },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] || 'Validation error' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await verifyOTP(email.toLowerCase(), otp, 'verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Get pending registration data
    const PendingRegistration = require('../models/PendingRegistration');
    const pending = await PendingRegistration.findOne({ email: email.toLowerCase() });
    if (!pending) {
      return res.status(404).json({ success: false, message: 'Registration data not found or expired. Please register again.' });
    }

    // Now create the actual user in DB
    const newReferralCode = await generateReferralCode();

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      mobile: pending.mobile,
      passwordHash: pending.passwordHash,
      walletAddress: pending.walletAddress || undefined,
      network: pending.network,
      referralCode: newReferralCode,
      referredBy: pending.referredBy || null,
      isVerified: true,
      signupBonusClaimed: false, // Will claim from dashboard
    });

    // Create NFT wallet (empty — bonus credited on claim)
    await NFTWallet.create({ userId: user._id });

    // Process referral chain if referred (but no signup bonus yet)
    if (user.referredBy) {
      await processReferralChain(user._id, user.referredBy);
      await checkTeamMilestones(user.referredBy.toString());
    }

    // Delete pending registration
    await PendingRegistration.deleteOne({ email: email.toLowerCase() });

    // Generate JWT — auto login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Account verified! Welcome to FutureMint NFT.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          walletAddress: user.walletAddress,
          network: user.network,
          referralCode: user.referralCode,
          signupBonusClaimed: false,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'OTP verification failed' });
  }
};

/**
 * POST /api/auth/login — Login with email + password + walletAddress validation
 */
const login = async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required. Please connect your wallet first.' });
    }

    // Find user by wallet address first (wallet is the unique key)
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this wallet address.' });
    }

    // Check email matches this wallet's account
    if (user.email !== email.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Email does not match this wallet address.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Account not verified. Please check your email for OTP.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password for this account.' });
    }

    // Generate JWT directly (no OTP required for login)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          walletAddress: user.walletAddress,
          network: user.network,
          referralCode: user.referralCode,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
};

/**
 * POST /api/auth/login-verify-otp  — step 2: verify OTP, return JWT
 */
const loginVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await verifyOTP(email.toLowerCase(), otp, 'login');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          walletAddress: user.walletAddress,
          network: user.network,
          referralCode: user.referralCode,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login OTP verify error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Login verification failed' });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

/**
 * POST /api/auth/resend-otp
 */
const resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const validPurposes = ['verification', 'login', 'withdrawal'];
    const otpPurpose = validPurposes.includes(purpose) ? purpose : 'verification';

    await generateAndSendOTP(email.toLowerCase(), otpPurpose);
    return res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to resend OTP' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Find user by email + walletAddress, send OTP
 */
const forgotPassword = async (req, res) => {
  try {
    const { email, walletAddress } = req.body;
    if (!email || !walletAddress) {
      return res.status(400).json({ success: false, message: 'Email and wallet address are required' });
    }

    // Find user matching email AND wallet address
    const user = await User.findOne({
      email: email.toLowerCase(),
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email and wallet address combination.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Account not verified.' });
    }

    // Send OTP for password reset
    await generateAndSendOTP(user.email, 'verification');

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Verify to reset password.',
      data: { email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

/**
 * POST /api/auth/reset-password
 * Verify OTP + set new password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const result = await verifyOTP(email.toLowerCase(), otp, 'verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Password reset failed' });
  }
};

/**
 * POST /api/auth/check-wallet
 * Check if a wallet address is already registered
 */
const checkWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() }).select('name email');
    if (user) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: 'This wallet is already registered. Please login.',
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: 'New wallet — you can register.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/auth/register-direct
 * Register user directly without OTP (after smart contract approval)
 */
const registerDirect = async (req, res) => {
  try {
    const { name, email, mobile, password, referralCode, network, walletAddress } = req.body;

    if (!name || !email || !mobile || !password || !network) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['BSC', 'Polygon'].includes(network)) {
      return res.status(400).json({ success: false, message: 'Network must be BSC or Polygon' });
    }

    // Check max 3 accounts per email and per mobile
    const emailCount = await User.countDocuments({ email: email.toLowerCase() });
    if (emailCount >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 accounts allowed per email' });
    }

    const mobileCount = await User.countDocuments({ mobile });
    if (mobileCount >= 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 accounts allowed per mobile number' });
    }

    // Check wallet address — 1 wallet per account only
    if (walletAddress) {
      const walletExists = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (walletExists) {
        return res.status(409).json({
          success: false,
          message: 'This wallet is already registered. Please login instead.',
        });
      }
    }

    // Validate referral code if provided
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referredByUser) {
        return res.status(400).json({ success: false, message: 'Invalid referral code' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newReferralCode = await generateReferralCode();

    // Create user directly (no OTP needed — smart contract approval is the verification)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      passwordHash,
      walletAddress: walletAddress ? walletAddress.toLowerCase() : undefined,
      network,
      referralCode: newReferralCode,
      referredBy: referredByUser ? referredByUser._id : null,
      isVerified: true,
      signupBonusClaimed: false,
    });

    // Create NFT wallet
    await NFTWallet.create({ userId: user._id });

    // Process referral chain if referred
    if (user.referredBy) {
      await processReferralChain(user._id, user.referredBy);
      await checkTeamMilestones(user.referredBy.toString());
    }

    // Generate JWT — auto login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          walletAddress: user.walletAddress,
          network: user.network,
          referralCode: user.referralCode,
          signupBonusClaimed: false,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] || 'Validation error' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Account already exists with these details.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

module.exports = { register, verifyRegistrationOTP, login, loginVerifyOTP, logout, resendOTP, forgotPassword, resetPassword, checkWallet, registerDirect };
