const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const userData = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    profilePhoto: user.profilePhoto,
    enrolledModules: user.enrolledModules,
    notifyEmail: user.notifyEmail,
    notifyAnnouncements: user.notifyAnnouncements,
    notifyWeeklyDigest: user.notifyWeeklyDigest,
    memberSince: user.memberSince,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

module.exports = { generateToken, sendTokenResponse };
