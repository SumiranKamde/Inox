const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

// GET /api/employees
exports.getEmployees = async (req, res) => {
  try {
    const { search, department, isActive } = req.query;
    const filter = {};

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { employeeCode: searchRegex },
        { designation: searchRegex },
        { department: searchRegex }
      ];
    }

    const employees = await Employee.find(filter).sort({ employeeCode: 1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
  }
};

// GET /api/employees/departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Employee.distinct('department');
    res.json({ success: true, data: departments.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
  }
};

// POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    const { employeeCode, name, department, designation, phone, joiningDate } = req.body;

    if (!employeeCode || !name || !department || !designation) {
      return res.status(400).json({ success: false, message: 'Please provide all required employee fields' });
    }

    const existing = await Employee.findOne({ employeeCode: employeeCode.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Employee ID "${employeeCode}" already exists` });
    }

    const employee = await Employee.create({
      employeeCode: employeeCode.trim().toUpperCase(),
      name: name.trim(),
      department: department.trim(),
      designation: designation.trim(),
      phone: phone ? phone.trim() : '',
      joiningDate: joiningDate || Date.now(),
      isActive: true
    });

    // Record audit
    await AuditLog.create({
      userId: req.user?._id,
      action: 'EMPLOYEE_CREATED',
      details: `Added new employee ${employee.name} (${employee.employeeCode})`
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create employee', error: error.message });
  }
};

// PATCH /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeCode, name, department, designation, phone, joiningDate, isActive } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (employeeCode && employeeCode.trim().toUpperCase() !== employee.employeeCode) {
      const existing = await Employee.findOne({ employeeCode: employeeCode.trim().toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Employee ID "${employeeCode}" already exists` });
      }
      employee.employeeCode = employeeCode.trim().toUpperCase();
    }

    if (name) employee.name = name.trim();
    if (department) employee.department = department.trim();
    if (designation) employee.designation = designation.trim();
    if (phone !== undefined) employee.phone = phone.trim();
    if (joiningDate) employee.joiningDate = joiningDate;
    if (isActive !== undefined) employee.isActive = Boolean(isActive);

    await employee.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'EMPLOYEE_UPDATED',
      details: `Updated employee record for ${employee.name} (${employee.employeeCode})`
    });

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update employee', error: error.message });
  }
};

// POST /api/employees/bulk
exports.bulkCreateEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ success: false, message: 'Employees array is required' });
    }

    const inserted = [];
    const skipped = [];

    for (const item of employees) {
      const code = (item.employeeCode || item.code || '').trim().toUpperCase();
      if (!code || !item.name) {
        skipped.push({ item, reason: 'Missing name or code' });
        continue;
      }

      const existing = await Employee.findOne({ employeeCode: code });
      if (existing) {
        skipped.push({ item, reason: 'Duplicate code' });
        continue;
      }

      const emp = await Employee.create({
        employeeCode: code,
        name: item.name.trim(),
        department: (item.department || 'General').trim(),
        designation: (item.designation || 'Worker').trim(),
        phone: item.phone ? String(item.phone).trim() : '',
        joiningDate: item.joiningDate || Date.now(),
        isActive: true
      });
      inserted.push(emp);
    }

    await AuditLog.create({
      userId: req.user?._id,
      action: 'EMPLOYEES_IMPORTED',
      details: `Bulk imported ${inserted.length} employees (Skipped: ${skipped.length})`
    });

    res.json({
      success: true,
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      skipped
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bulk import failed', error: error.message });
  }
};
