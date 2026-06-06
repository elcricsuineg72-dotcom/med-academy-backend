const User = require('../models/User');
const { sendTokenResponse } = require('../utils/tokenUtils');

// @desc    Register student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { firstName, lastName, email, password, requestedSubjects } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    requestedSubjects: requestedSubjects || [],
    role: 'student',
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please wait for tutor approval.',
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
    },
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email })
    .select('+password')
    .populate('enrolledModules', 'title code icon color');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact your tutor.' });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('enrolledModules', 'title code icon color description');

  res.status(200).json({
    success: true,
    user,
  });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { firstName, lastName, phone, notifyEmail, notifyAnnouncements, notifyWeeklyDigest } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, phone, notifyEmail, notifyAnnouncements, notifyWeeklyDigest },
    { new: true, runValidators: true }
  ).populate('enrolledModules', 'title code icon color');

  res.status(200).json({ success: true, user: updatedUser });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
};

// @desc    Delete own account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.status(200).json({ success: true, message: 'Account deleted successfully' });
};

module.exports = { register, login, getMe, updateProfile, changePassword, deleteAccount };
