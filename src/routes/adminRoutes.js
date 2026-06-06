const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, requireTutor } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All admin routes require auth + tutor role
router.use(protect, requireTutor);

// Dashboard
router.get('/stats/overview', getDashboardStats);

// Students
router.get('/students', getStudents);
router.put('/students/:id/approve', approveStudent);
router.put('/students/:id/status', updateStudentStatus);
router.put('/students/:id/modules', updateStudentModules);
router.delete('/students/:id', deleteStudent);

// Modules
router.get('/modules', getModules);
router.post('/modules', createModule);
router.put('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);
router.get('/modules/:id/content', getModuleContent);
router.post('/modules/:id/upload', upload.single('file'), uploadContent);

// Content
router.put('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
