const express = require('express');
const router = express.Router();
const {
  getShifts,
  createShift,
  updateShift
} = require('../controllers/shiftController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getShifts);
router.post('/', createShift);
router.patch('/:id', updateShift);

module.exports = router;
