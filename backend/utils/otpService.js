const OTP = require('../models/OTP');
const { sendOTPEmail } = require('./emailService');

const OTP_EXPIRY = 1800; // 30 minutes in seconds

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
    await OTP.deleteOne({ email: identifier.toLowerCase(), purpose });
    const expiresAt = new Date(Date.now() + OTP_EXPIRY * 1000);
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
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return { valid: false, message: 'OTP expired or not found' };
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return { valid: false, message: 'Too many attempts. Request new OTP.' };
    }

    if (otpRecord.otp !== otp.toString()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return { valid: false, message: 'Invalid OTP' };
    }

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

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      try {
        console.log(`[OTP] Sending | To: ${email} | Purpose: ${purpose}`);
        await sendOTPEmail(email, otp, purpose);
        console.log(`[OTP] Sent successfully | To: ${email}`);
      } catch (err) {
        console.error(`[OTP] FAILED | To: ${email} | Error: ${err.message}`);
        throw new Error(`Failed to send OTP email: ${err.message}`);
      }
    } else {
      sendOTPEmail(email, otp, purpose).catch((err) => {
        console.error(`[OTP] Failed in dev | To: ${email} | Error: ${err.message}`);
      });
    }

    return otp;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete OTP explicitly
 */
const deleteOTP = async (identifier, purpose = 'verification') => {
  try {
    await OTP.deleteOne({ email: identifier.toLowerCase(), purpose });
  } catch (_) {}
};

module.exports = { generateOTP, storeOTP, verifyOTP, generateAndSendOTP, deleteOTP };
