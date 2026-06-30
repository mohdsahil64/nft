const OTP = require('../models/OTP');
const { sendOTPEmail } = require('./emailService');
const { redisSet, redisGet, redisDel, isRedisAvailable } = require('../config/redis');

const OTP_EXPIRY = 600; // 10 minutes in seconds

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP — tries Redis first (fast), falls back to MongoDB
 */
const storeOTP = async (identifier, otp, purpose = 'verification') => {
  const key = `otp:${identifier.toLowerCase()}:${purpose}`;

  // Try Redis first
  if (isRedisAvailable()) {
    const data = JSON.stringify({ otp, attempts: 0 });
    const saved = await redisSet(key, data, OTP_EXPIRY);
    if (saved !== null) return otp;
    // Redis failed — fall through to MongoDB
  }

  // MongoDB fallback
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
 * Verify OTP — checks Redis first, then MongoDB
 */
const verifyOTP = async (identifier, otp, purpose = 'verification') => {
  const key = `otp:${identifier.toLowerCase()}:${purpose}`;

  // Try Redis first
  if (isRedisAvailable()) {
    const cached = await redisGet(key);
    if (cached) {
      // Found in Redis
      if (cached.attempts >= 5) {
        await redisDel(key);
        return { valid: false, message: 'Too many attempts. Request new OTP.' };
      }
      if (cached.otp !== otp.toString()) {
        cached.attempts += 1;
        await redisSet(key, cached, OTP_EXPIRY);
        return { valid: false, message: 'Invalid OTP' };
      }
      // OTP correct — delete and return success
      await redisDel(key);
      return { valid: true, message: 'OTP verified' };
    }
    // Not found in Redis — might be in MongoDB (stored before Redis was active)
  }

  // MongoDB fallback
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

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      try {
        console.log(`[OTP] Attempting to send OTP email | To: ${email} | Purpose: ${purpose}`);
        await sendOTPEmail(email, otp, purpose);
        console.log(`[OTP] OTP email sent successfully | To: ${email} | Purpose: ${purpose}`);
      } catch (err) {
        console.error(`[OTP] Email send FAILED in production | To: ${email} | Purpose: ${purpose} | Error: ${err.message}`);
        throw new Error(`Failed to send OTP email: ${err.message}`);
      }
    } else {
      sendOTPEmail(email, otp, purpose).catch((err) => {
        console.error(`[OTP] Email send failed in dev | To: ${email} | Error: ${err.message}`);
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
  const key = `otp:${identifier.toLowerCase()}:${purpose}`;

  // Try Redis
  if (isRedisAvailable()) {
    await redisDel(key);
  }

  // Also clean MongoDB (in case it was stored there)
  try {
    await OTP.deleteOne({ email: identifier.toLowerCase(), purpose });
  } catch (_) {}
};

module.exports = { generateOTP, storeOTP, verifyOTP, generateAndSendOTP, deleteOTP };
