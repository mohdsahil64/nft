const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // No index here - will be in compound unique index below
    },
    memberCount: {
      type: Number,
      required: true,
    },
    awarded: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound unique index covers userId lookup
milestoneSchema.index({ userId: 1, memberCount: 1 }, { unique: true });

module.exports = mongoose.model('Milestone', milestoneSchema);
