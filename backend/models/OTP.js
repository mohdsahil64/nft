const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    // Stores an identifier — either an email address or a mobile number
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['verification', 'login', 'withdrawal', 'email_verification', 'mobile_verification', 'password_reset'],
      default: 'verification',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      index: { expireAfterSeconds: 0 }, // TTL index - removes docs after 30 mins
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

// Compound index for the most common lookup pattern
otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
