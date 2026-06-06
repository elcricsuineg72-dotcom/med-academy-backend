const mongoose = require('mongoose');

const viewLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    action: {
      type: String,
      enum: ['view', 'download'],
      required: true,
    },
    sessionDuration: {
      type: Number, // seconds
      default: 0,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ViewLog', viewLogSchema);
