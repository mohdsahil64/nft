const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning'],
      default: 'info',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
