const MonthlySchedule = require('../models/MonthlySchedule');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const { generateMonthlyExcel } = require('../services/monthlyExcelService');

// Normalize month to "YYYY-MM"
const normalizeMonth = (m) => {
  if (!m) return new Date().toISOString().slice(0, 7);
  return m.slice(0, 7);
};

// GET /api/monthly-schedules/:month
exports.getMonthlySchedule = async (req, res) => {
  try {
    const month = normalizeMonth(req.params.month);

    // Fetch shift workers (sorted by serialNo or employeeCode)
    const shiftWorkers = await Employee.find({ category: 'shift', isActive: true }).sort({ serialNo: 1, employeeCode: 1 });
    const generalWorkers = await Employee.find({ category: 'general', isActive: true }).sort({ serialNo: 1, employeeCode: 1 });

    let schedule = await MonthlySchedule.findOne({ month })
      .populate('assignments.employeeId')
      .populate('createdBy', 'name email');

    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    if (!schedule) {
      // Create empty/initial template for all shift workers
      const initialAssignments = shiftWorkers.map((emp) => {
        const days = {};
        // Leave all days empty — manager will fill them in
        for (let d = 1; d <= daysInMonth; d++) {
          days[d.toString()] = '';
        }
        return {
          employeeId: emp,
          days
        };
      });

      return res.json({
        success: true,
        isNew: true,
        data: {
          month,
          plantName: 'INOX AIR PRODUCTS PVT LTD. BHANDARA',
          status: 'draft',
          assignments: initialAssignments,
          generalWorkers
        }
      });
    }

    // Merge in any newly added shift workers
    const assignedIds = new Set(
      schedule.assignments
        .filter((a) => a.employeeId)
        .map((a) => (a.employeeId._id || a.employeeId).toString())
    );

    const mergedAssignments = [...schedule.assignments];
    shiftWorkers.forEach((emp) => {
      if (!assignedIds.has(emp._id.toString())) {
        const days = {};
        for (let d = 1; d <= daysInMonth; d++) {
          days[d.toString()] = '';
        }
        mergedAssignments.push({
          employeeId: emp,
          days
        });
      }
    });

    const result = schedule.toObject();
    result.assignments = mergedAssignments;
    result.generalWorkers = generalWorkers;

    res.json({
      success: true,
      isNew: false,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load monthly schedule', error: error.message });
  }
};

// PUT /api/monthly-schedules/:month
exports.saveMonthlySchedule = async (req, res) => {
  try {
    const month = normalizeMonth(req.params.month);
    const { assignments, status } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ success: false, message: 'Assignments array is required' });
    }

    const cleanAssignments = assignments.map((a) => ({
      employeeId: a.employeeId?._id || a.employeeId,
      days: a.days || {}
    }));

    let schedule = await MonthlySchedule.findOne({ month });

    if (!schedule) {
      schedule = new MonthlySchedule({
        month,
        plantName: 'INOX AIR PRODUCTS PVT LTD. BHANDARA',
        status: status || 'draft',
        assignments: cleanAssignments,
        createdBy: req.user?._id,
        updatedBy: req.user?._id
      });
    } else {
      schedule.assignments = cleanAssignments;
      if (status) schedule.status = status;
      schedule.updatedBy = req.user?._id;
    }

    await schedule.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'MONTHLY_SCHEDULE_SAVED',
      details: `Saved monthly shift schedule for ${month} (${cleanAssignments.length} employees)`
    });

    const populated = await MonthlySchedule.findById(schedule._id)
      .populate('assignments.employeeId');

    res.json({
      success: true,
      message: 'Monthly schedule saved successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save monthly schedule', error: error.message });
  }
};

// GET /api/monthly-schedules/:month/export
exports.exportMonthlySchedule = async (req, res) => {
  try {
    const month = normalizeMonth(req.params.month);
    const schedule = await MonthlySchedule.findOne({ month })
      .populate('assignments.employeeId');

    if (!schedule) {
      return res.status(404).json({ success: false, message: `No schedule found for month ${month}` });
    }

    const generalWorkers = await Employee.find({ category: 'general', isActive: true }).sort({ serialNo: 1, employeeCode: 1 });

    await generateMonthlyExcel(schedule, generalWorkers, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Monthly export failed', error: error.message });
  }
};
