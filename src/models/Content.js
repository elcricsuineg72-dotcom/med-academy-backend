const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module is required'],
    },
    category: {
      type: String,
      enum: ['notes', 'past_paper', 'lab_report', 'assignment', 'resource'],
      required: [true, 'Category is required'],
    },
    year: {
      type: Number,
      min: 2000,
      max: 2030,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },
    mimeType: {
      type: String,
    },
    markingSchemeUrl: {
      type: String,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: formatted file size
contentSchema.virtual('fileSizeFormatted').get(function () {
  if (!this.fileSize) return 'Unknown';
  const mb = this.fileSize / (1024 * 1024);
  return mb < 1 ? `${(this.fileSize / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
});

module.exports = mongoose.model('Content', contentSchema);
