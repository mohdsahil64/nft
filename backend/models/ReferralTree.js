const mongoose = require('mongoose');

const referralTreeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 15,
    },
    // Array of ancestor userIds from direct parent up to level-15 ancestor
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
referralTreeSchema.index({ parentId: 1, level: 1 });
referralTreeSchema.index({ userId: 1, level: 1 });

module.exports = mongoose.model('ReferralTree', referralTreeSchema);
