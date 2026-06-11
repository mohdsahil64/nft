const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fromAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    toAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    network: {
      type: String,
      enum: ['BSC', 'Polygon'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    txHash: {
      type: String,
      default: null,
    },
    adminNote: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
transferRequestSchema.index({ userId: 1, status: 1 });
transferRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
