const Module = require('../models/Module');
const Content = require('../models/Content');
const Announcement = require('../models/Announcement');
const ViewLog = require('../models/ViewLog');
const User = require('../models/User');

// @desc    Get student dashboard
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getDashboard = async (req, res) => {
  const studentId = req.user._id;
  const enrolledModuleIds = req.user.enrolledModules.map((m) => m._id || m);

  // Stats
  const filesViewed = await ViewLog.countDocuments({ student: studentId, action: 'view' });
  const filesDownloaded = await ViewLog.countDocuments({ student: studentId, action: 'download' });

  // Hours studied (estimate: each view = 15 min)
  const hoursStudied = Math.round((filesViewed * 15) / 60);

  // Recent uploads across enrolled modules (last 10)
  const recentContent = await Content.find({
    module: { $in: enrolledModuleIds },
    isPublished: true,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('module', 'title code');

  // Progress per module (% of published content viewed)
  const progressByModule = [];
  for (const mod of req.user.enrolledModules) {
    const modId = mod._id || mod;
    const totalContent = await Content.countDocuments({ module: modId, isPublished: true });
    const viewedContent = await ViewLog.distinct('content', { student: studentId, module: modId });
    const percentage = totalContent > 0 ? Math.round((viewedContent.length / totalContent) * 100) : 0;
    progressByModule.push({
      module: mod,
      totalContent,
      viewedContent: viewedContent.length,
      percentage,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      stats: {
        enrolledModules: enrolledModuleIds.length,
        filesViewed,
        filesDownloaded,
        hoursStudied,
      },
      recentContent,
      progressByModule,
    },
  });
};

// @desc    Get student's modules
// @route   GET /api/student/modules
// @access  Private (Student)
const getMyModules = async (req, res) => {
  const modules = await Module.find({
    _id: { $in: req.user.enrolledModules },
    isPublished: true,
  }).populate('instructor', 'firstName lastName');

  // Add content count for each module
  const modulesWithCounts = await Promise.all(
    modules.map(async (mod) => {
      const notesCount = await Content.countDocuments({ module: mod._id, category: 'notes', isPublished: true });
      const papersCount = await Content.countDocuments({ module: mod._id, category: 'past_paper', isPublished: true });
      return {
        ...mod.toJSON(),
        notesCount,
        papersCount,
      };
    })
  );

  res.status(200).json({ success: true, data: modulesWithCounts });
};

// @desc    Get content for a module
// @route   GET /api/student/modules/:id/content
// @access  Private (Student)
const getModuleContent = async (req, res) => {
  const moduleId = req.params.id;
  const { category } = req.query;

  // Check enrollment
  const isEnrolled = req.user.enrolledModules.some(
    (m) => m._id?.toString() === moduleId || m.toString() === moduleId
  );

  if (!isEnrolled && req.user.role !== 'tutor') {
    return res.status(403).json({ success: false, message: 'You are not enrolled in this module' });
  }

  const filter = { module: moduleId, isPublished: true };
  if (category) filter.category = category;

  const content = await Content.find(filter)
    .sort({ sortOrder: 1, createdAt: -1 })
    .populate('uploadedBy', 'firstName lastName');

  const module = await Module.findById(moduleId).populate('instructor', 'firstName lastName');

  res.status(200).json({ success: true, data: { module, content } });
};

// @desc    Log view/download
// @route   POST /api/student/log
// @access  Private (Student)
const logActivity = async (req, res) => {
  const { contentId, moduleId, action, sessionDuration } = req.body;

  // Increment counter on content
  const updateField = action === 'download' ? { $inc: { downloads: 1 } } : { $inc: { views: 1 } };
  await Content.findByIdAndUpdate(contentId, updateField);

  await ViewLog.create({
    student: req.user._id,
    content: contentId,
    module: moduleId,
    action,
    sessionDuration: sessionDuration || 0,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({ success: true, message: 'Activity logged' });
};

// @desc    Get announcements for student
// @route   GET /api/student/announcements
// @access  Private (Student)
const getAnnouncements = async (req, res) => {
  const enrolledModuleIds = req.user.enrolledModules.map((m) => m._id || m);

  const announcements = await Announcement.find({
    status: 'published',
    $or: [
      { scope: 'global' },
      { scope: 'module', targetModule: { $in: enrolledModuleIds } },
    ],
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .populate('author', 'firstName lastName')
    .populate('targetModule', 'title code');

  // Mark which ones the student has read
  const withReadStatus = announcements.map((ann) => {
    const hasRead = ann.readBy.some((r) => r.user?.toString() === req.user._id.toString());
    return { ...ann.toJSON(), hasRead };
  });

  res.status(200).json({ success: true, data: withReadStatus });
};

// @desc    Mark announcement as read
// @route   POST /api/student/announcements/:id/read
// @access  Private (Student)
const markAnnouncementRead = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  const alreadyRead = announcement.readBy.some((r) => r.user?.toString() === req.user._id.toString());
  if (!alreadyRead) {
    announcement.readBy.push({ user: req.user._id });
    announcement.views += 1;
    await announcement.save();
  }

  res.status(200).json({ success: true, message: 'Marked as read' });
};

module.exports = {
  getDashboard,
  getMyModules,
  getModuleContent,
  logActivity,
  getAnnouncements,
  markAnnouncementRead,
};
