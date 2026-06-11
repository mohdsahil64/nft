const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // unique implies index, no need for both
    },
    telegram_channel: { type: Boolean, default: false },
    telegram_group:   { type: Boolean, default: false },
    instagram:        { type: Boolean, default: false },
    twitter:          { type: Boolean, default: false },
    facebook:         { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
