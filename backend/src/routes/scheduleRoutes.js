const express = require('express');
const router = express.Router();
const {
  getScheduleByDate,
  saveSchedule,
  finalizeSchedule,
  reopenSchedule,
  copyFromDate,
  exportSchedule,
  getDashboardStats
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// Summary stats
router.get('/stats/summary', protect, getDashboardStats);

// Export (supports token in header or ?token= for direct anchor download)
router.get('/:date/export', async (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return protect(req, res, next);
}, exportSchedule);

// Protected routes
router.use(protect);

router.get('/:date', getScheduleByDate);
router.put('/:date', saveSchedule);
router.post('/:date/finalize', finalizeSchedule);
router.post('/:date/reopen', reopenSchedule);
router.post('/:date/copy-from', copyFromDate);

module.exports = router;
