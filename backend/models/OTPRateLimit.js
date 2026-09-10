const mongoose = require('mongoose');

/**
 * Tracks how many OTPs have been sent to a mobile number.
 * Each document auto-expires 24 hours after creation (TTL index),
 * so the count naturally resets every day.
 */
const otpRateLimitSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    // Window start — document auto-deletes 24h after this
    windowStart: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds (TTL)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OTPRateLimit', otpRateLimitSchema);
