const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Module code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    icon: {
      type: String,
      default: 'flask',
    },
    color: {
      type: String,
      default: '#2563EB',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: student count
moduleSchema.virtual('studentCount').get(function () {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

module.exports = mongoose.model('Module', moduleSchema);
