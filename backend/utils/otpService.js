const OTP = require('../models/OTP');
const { sendOTPEmail } = require('./emailService');

const OTP_EXPIRY = 600; // 10 minutes in seconds

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP in MongoDB with expiry
 */
const storeOTP = async (identifier, otp, purpose = 'verification') => {
  try {
    // Delete any existing OTP for this email/purpose
    await OTP.deleteOne({ email: identifier.toLowerCase(), purpose });
    
    // Store new OTP
    const expiresAt = new Date(Date.now() + OTP_EXPIRY * 1000); // Convert to ms
    await OTP.create({
      email: identifier.toLowerCase(),
      otp,
      purpose,
      expiresAt,
      attempts: 0,
    });
    return otp;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify OTP from MongoDB
 */
const verifyOTP = async (identifier, otp, purpose = 'verification') => {
  try {
    const otpRecord = await OTP.findOne({
      email: identifier.toLowerCase(),
      purpose,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!otpRecord) {
      return { valid: false, message: 'OTP expired or not found' };
    }

    // Check max attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return { valid: false, message: 'Too many attempts. Request new OTP.' };
    }

    // Check OTP value
    if (otpRecord.otp !== otp.toString()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return { valid: false, message: 'Invalid OTP' };
    }

    // OTP verified - delete it
    await OTP.deleteOne({ _id: otpRecord._id });
    return { valid: true, message: 'OTP verified' };
  } catch (error) {
    throw error;
  }
};

/**
 * Generate, store, and send OTP via email
 */
const generateAndSendOTP = async (email, purpose = 'verification') => {
  try {
    const otp = generateOTP();
    await storeOTP(email, otp, purpose);
    await sendOTPEmail(email, otp, purpose);
    return otp;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete OTP explicitly (e.g., after max retries)
 */
const deleteOTP = async (identifier, purpose = 'verification') => {
  try {
    await OTP.deleteOne({
      email: identifier.toLowerCase(),
      purpose,
    });
  } catch (error) {
    // Silently ignore
  }
};

module.exports = { generateOTP, storeOTP, verifyOTP, generateAndSendOTP, deleteOTP };
