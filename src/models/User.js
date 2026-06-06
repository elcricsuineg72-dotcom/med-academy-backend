const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'tutor'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    enrolledModules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
      },
    ],
    requestedSubjects: [
      {
        type: String,
      },
    ],
    notifyEmail: {
      type: Boolean,
      default: true,
    },
    notifyAnnouncements: {
      type: Boolean,
      default: true,
    },
    notifyWeeklyDigest: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    memberSince: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
