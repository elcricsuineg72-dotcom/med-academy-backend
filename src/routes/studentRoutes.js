const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getMyModules,
  getModuleContent,
  logActivity,
  getAnnouncements,
  markAnnouncementRead,
} = require('../controllers/studentController');
const { protect, requireActive } = require('../middleware/auth');

// All student routes require auth + active status
router.use(protect, requireActive);

router.get('/dashboard', getDashboard);
router.get('/modules', getMyModules);
router.get('/modules/:id/content', getModuleContent);
router.post('/log', logActivity);
router.get('/announcements', getAnnouncements);
router.post('/announcements/:id/read', markAnnouncementRead);

module.exports = router;
