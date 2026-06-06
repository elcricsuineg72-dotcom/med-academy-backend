const User = require('../models/User');
const Module = require('../models/Module');
const Content = require('../models/Content');
const Announcement = require('../models/Announcement');
const ViewLog = require('../models/ViewLog');
const path = require('path');
const fs = require('fs');

// ============================================================
// DASHBOARD
// ============================================================

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats/overview
// @access  Private (Tutor)
const getDashboardStats = async (req, res) => {
  const [totalStudents, activeModules, pendingApprovals, filesUploaded] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Module.countDocuments({ isPublished: true }),
    User.countDocuments({ role: 'student', status: 'pending' }),
    Content.countDocuments(),
  ]);

  // Recent activity (last 20 events)
  const recentViewLogs = await ViewLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('student', 'firstName lastName')
    .populate('content', 'title')
    .populate('module', 'title');

  const recentRegistrations = await User.find({ role: 'student' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName email createdAt');

  // Combine and sort activity feed
  const activityFeed = [
    ...recentViewLogs.map((log) => ({
      type: log.action === 'download' ? 'download' : 'view',
      message: `${log.student?.firstName} ${log.student?.lastName} ${log.action === 'download' ? 'downloaded' : 'viewed'} ${log.content?.title}`,
      timestamp: log.createdAt,
    })),
    ...recentRegistrations.map((u) => ({
      type: 'registration',
      message: `${u.firstName} ${u.lastName} registered`,
      timestamp: u.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

  // Module engagement (ViewLog grouped by module)
  const moduleEngagement = await ViewLog.aggregate([
    { $group: { _id: '$module', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: 'modules',
        localField: '_id',
        foreignField: '_id',
        as: 'moduleInfo',
      },
    },
    { $unwind: '$moduleInfo' },
    { $project: { _id: 1, views: 1, name: '$moduleInfo.title' } },
  ]);

  // Pending approvals mini table
  const pendingStudents = await User.find({ role: 'student', status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName email requestedSubjects createdAt');

  res.status(200).json({
    success: true,
    data: {
      stats: { totalStudents, activeModules, pendingApprovals, filesUploaded },
      activityFeed,
      moduleEngagement,
      pendingStudents,
    },
  });
};

// ============================================================
// STUDENTS
// ============================================================

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Tutor)
const getStudents = async (req, res) => {
  const { status, module: moduleFilter, search, page = 1, limit = 10 } = req.query;

  const filter = { role: 'student' };
  if (status && status !== 'all') filter.status = status;
  if (moduleFilter && moduleFilter !== 'all') filter.enrolledModules = moduleFilter;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const students = await User.find(filter)
    .populate('enrolledModules', 'title code')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: students,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
  });
};

// @desc    Approve student and enroll in modules
// @route   PUT /api/admin/students/:id/approve
// @access  Private (Tutor)
const approveStudent = async (req, res) => {
  const { moduleIds } = req.body;

  const student = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'active', enrolledModules: moduleIds || [] },
    { new: true }
  ).populate('enrolledModules', 'title code');

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  // Update module enrollment arrays
  if (moduleIds && moduleIds.length > 0) {
    await Module.updateMany(
      { _id: { $in: moduleIds } },
      { $addToSet: { enrolledStudents: student._id } }
    );
  }

  res.status(200).json({ success: true, data: student, message: 'Student approved successfully' });
};

// @desc    Update student status
// @route   PUT /api/admin/students/:id/status
// @access  Private (Tutor)
const updateStudentStatus = async (req, res) => {
  const { status } = req.body;
  const student = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.status(200).json({ success: true, data: student });
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Tutor)
const deleteStudent = async (req, res) => {
  const student = await User.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.status(200).json({ success: true, message: 'Student deleted' });
};

// @desc    Update student modules
// @route   PUT /api/admin/students/:id/modules
// @access  Private (Tutor)
const updateStudentModules = async (req, res) => {
  const { moduleIds } = req.body;
  const student = await User.findByIdAndUpdate(
    req.params.id,
    { enrolledModules: moduleIds },
    { new: true }
  ).populate('enrolledModules', 'title code');
  res.status(200).json({ success: true, data: student });
};

// ============================================================
// MODULES
// ============================================================

// @desc    Get all modules
// @route   GET /api/admin/modules
// @access  Private (Tutor)
const getModules = async (req, res) => {
  const modules = await Module.find()
    .populate('instructor', 'firstName lastName')
    .sort({ sortOrder: 1, createdAt: -1 });

  const modulesWithCounts = await Promise.all(
    modules.map(async (mod) => {
      const contentCount = await Content.countDocuments({ module: mod._id });
      return { ...mod.toJSON(), contentCount };
    })
  );

  res.status(200).json({ success: true, data: modulesWithCounts });
};

// @desc    Create module
// @route   POST /api/admin/modules
// @access  Private (Tutor)
const createModule = async (req, res) => {
  const { title, code, description, icon, color, isPublished, sortOrder } = req.body;

  const module = await Module.create({
    title,
    code,
    description,
    icon: icon || 'flask',
    color: color || '#2563EB',
    isPublished: isPublished || false,
    instructor: req.user._id,
    sortOrder: sortOrder || 0,
  });

  res.status(201).json({ success: true, data: module });
};

// @desc    Update module
// @route   PUT /api/admin/modules/:id
// @access  Private (Tutor)
const updateModule = async (req, res) => {
  const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
  res.status(200).json({ success: true, data: module });
};

// @desc    Delete module
// @route   DELETE /api/admin/modules/:id
// @access  Private (Tutor)
const deleteModule = async (req, res) => {
  await Module.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Module deleted' });
};

// ============================================================
// CONTENT
// ============================================================

// @desc    Get content for a module
// @route   GET /api/admin/modules/:id/content
// @access  Private (Tutor)
const getModuleContent = async (req, res) => {
  const content = await Content.find({ module: req.params.id })
    .sort({ sortOrder: 1, createdAt: -1 })
    .populate('uploadedBy', 'firstName lastName');

  const module = await Module.findById(req.params.id);
  res.status(200).json({ success: true, data: { module, content } });
};

// @desc    Upload content file
// @route   POST /api/admin/modules/:id/upload
// @access  Private (Tutor)
const uploadContent = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { title, category, year, sortOrder, isPublished } = req.body;
  const fileUrl = `/uploads/${req.file.filename}`;

  const content = await Content.create({
    title,
    module: req.params.id,
    category,
    year: year ? parseInt(year) : undefined,
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    isPublished: isPublished === 'true',
    uploadedBy: req.user._id,
  });

  // Update module views
  await Module.findByIdAndUpdate(req.params.id, { $push: { content: content._id } });

  res.status(201).json({ success: true, data: content });
};

// @desc    Update content
// @route   PUT /api/admin/content/:id
// @access  Private (Tutor)
const updateContent = async (req, res) => {
  const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
  res.status(200).json({ success: true, data: content });
};

// @desc    Delete content
// @route   DELETE /api/admin/content/:id
// @access  Private (Tutor)
const deleteContent = async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });

  // Delete file from disk if local
  if (content.fileUrl && content.fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../../', content.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await Content.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Content deleted' });
};

// ============================================================
// ANNOUNCEMENTS
// ============================================================

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private (Tutor)
const getAnnouncements = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .populate('author', 'firstName lastName')
    .populate('targetModule', 'title code');

  res.status(200).json({ success: true, data: announcements });
};

// @desc    Create announcement
// @route   POST /api/admin/announcements
// @access  Private (Tutor)
const createAnnouncement = async (req, res) => {
  const { title, body, scope, targetModule, status, notifyViaEmail, scheduledAt } = req.body;

  const announcement = await Announcement.create({
    title,
    body,
    scope: scope || 'global',
    targetModule: scope === 'module' ? targetModule : null,
    status: status || 'draft',
    notifyViaEmail: notifyViaEmail || false,
    scheduledAt: scheduledAt || null,
    publishedAt: status === 'published' ? new Date() : null,
    author: req.user._id,
  });

  await announcement.populate('author', 'firstName lastName');
  res.status(201).json({ success: true, data: announcement });
};

// @desc    Update announcement
// @route   PUT /api/admin/announcements/:id
// @access  Private (Tutor)
const updateAnnouncement = async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === 'published' && !updates.publishedAt) {
    updates.publishedAt = new Date();
  }

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('author', 'firstName lastName')
    .populate('targetModule', 'title code');

  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  res.status(200).json({ success: true, data: announcement });
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private (Tutor)
const deleteAnnouncement = async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Announcement deleted' });
};

// ============================================================
// ANALYTICS
// ============================================================

// @desc    Get engagement analytics
// @route   GET /api/admin/analytics
// @access  Private (Tutor)
const getAnalytics = async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const [totalViews, totalDownloads, activeToday] = await Promise.all([
    ViewLog.countDocuments({ action: 'view', createdAt: { $gte: startDate } }),
    ViewLog.countDocuments({ action: 'download', createdAt: { $gte: startDate } }),
    ViewLog.distinct('student', {
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  // Avg session duration
  const sessionAgg = await ViewLog.aggregate([
    { $match: { createdAt: { $gte: startDate }, sessionDuration: { $gt: 0 } } },
    { $group: { _id: null, avgDuration: { $avg: '$sessionDuration' } } },
  ]);
  const avgSession = sessionAgg[0] ? Math.round(sessionAgg[0].avgDuration / 60) : 14;

  // Daily trend
  const dailyTrend = await ViewLog.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, action: '$action' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  // Most viewed content
  const mostViewedContent = await ViewLog.aggregate([
    { $match: { action: 'view' } },
    { $group: { _id: '$content', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'contents', localField: '_id', foreignField: '_id', as: 'contentInfo' } },
    { $unwind: '$contentInfo' },
    { $project: { _id: 1, views: 1, title: '$contentInfo.title' } },
  ]);

  // Per-student activity log
  const studentActivity = await ViewLog.find({ createdAt: { $gte: startDate } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('student', 'firstName lastName')
    .populate('content', 'title')
    .populate('module', 'title');

  // At-risk students (no activity in 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const activeStudentIds = await ViewLog.distinct('student', { createdAt: { $gte: fourteenDaysAgo } });
  const atRiskStudents = await User.find({
    role: 'student',
    status: 'active',
    _id: { $nin: activeStudentIds },
  }).select('firstName lastName email').limit(5);

  // Module heatmap (by day and hour)
  const heatmapData = await ViewLog.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          hour: { $hour: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: { totalViews, totalDownloads, avgSession, activeToday: activeToday.length },
      dailyTrend,
      mostViewedContent,
      studentActivity,
      atRiskStudents,
      heatmapData,
    },
  });
};

module.exports = {
  getDashboardStats,
  getStudents,
  approveStudent,
  updateStudentStatus,
  deleteStudent,
  updateStudentModules,
  getModules,
  createModule,
  updateModule,
  deleteModule,
  getModuleContent,
  uploadContent,
  updateContent,
  deleteContent,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnalytics,
};
