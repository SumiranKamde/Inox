const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getDepartments,
  createEmployee,
  updateEmployee,
  bulkCreateEmployees
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getEmployees);
router.get('/departments', getDepartments);
router.post('/', createEmployee);
router.patch('/:id', updateEmployee);
router.post('/bulk', bulkCreateEmployees);

module.exports = router;
