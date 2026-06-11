const mongoose = require('mongoose');

const networkChangeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentNetwork: {
      type: String,
      enum: ['BSC', 'Polygon'],
      required: true,
    },
    requestedNetwork: {
      type: String,
      enum: ['BSC', 'Polygon'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for common lookup
networkChangeRequestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('NetworkChangeRequest', networkChangeRequestSchema);
