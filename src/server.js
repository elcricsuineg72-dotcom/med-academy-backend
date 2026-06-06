require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Med Academy API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Med Academy Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`\n📚 Available Routes:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/student/dashboard`);
  console.log(`   GET  /api/admin/stats/overview`);
});

module.exports = app;
