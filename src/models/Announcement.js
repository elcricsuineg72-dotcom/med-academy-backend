const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
    },
    scope: {
      type: String,
      enum: ['global', 'module'],
      default: 'global',
    },
    targetModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft',
    },
    notifyViaEmail: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: read count
announcementSchema.virtual('readCount').get(function () {
  return this.readBy ? this.readBy.length : 0;
});

module.exports = mongoose.model('Announcement', announcementSchema);
