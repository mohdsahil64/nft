const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['signup', 'referral', 'team', 'withdrawal', 'admin_credit', 'usdt_transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    level: {
      type: Number, // for referral transactions
      default: null,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    toAddress: {
      type: String, // for USDT transfers
      default: null,
    },
    txHash: {
      type: String, // blockchain transaction hash
      default: null,
    },
    network: {
      type: String, // BSC or Polygon
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
