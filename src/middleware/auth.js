const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized - no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('enrolledModules', 'title code icon color');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized - invalid token' });
  }
};

// Require student role
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student' && req.user.role !== 'tutor') {
    return res.status(403).json({ success: false, message: 'Access denied - students only' });
  }
  next();
};

// Require tutor/admin role
const requireTutor = (req, res, next) => {
  if (req.user.role !== 'tutor') {
    return res.status(403).json({ success: false, message: 'Access denied - tutors only' });
  }
  next();
};

// Require active account
const requireActive = (req, res, next) => {
  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval. Please wait for tutor approval.',
      status: req.user.status,
    });
  }
  next();
};

module.exports = { protect, requireStudent, requireTutor, requireActive };
