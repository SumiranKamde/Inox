const express = require('express');
const router = express.Router();
const {
  getMonthlySchedule,
  saveMonthlySchedule,
  exportMonthlySchedule
} = require('../controllers/monthlyScheduleController');
const { protect } = require('../middleware/authMiddleware');

// Direct download export with token support
router.get('/:month/export', async (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return protect(req, res, next);
}, exportMonthlySchedule);

// Protected APIs
router.use(protect);

router.get('/:month', getMonthlySchedule);
router.put('/:month', saveMonthlySchedule);

module.exports = router;
