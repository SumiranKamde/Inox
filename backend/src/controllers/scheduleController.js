const DailySchedule = require('../models/DailySchedule');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const AuditLog = require('../models/AuditLog');
const { generateDailyRoster } = require('../services/excelService');

// Normalize date to "YYYY-MM-DD"
const normalizeDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const parts = dateStr.split('T')[0];
  return parts;
};

// GET /api/schedules/:date
exports.getScheduleByDate = async (req, res) => {
  try {
    const date = normalizeDate(req.params.date);

    // Fetch all active employees
    const allActiveEmployees = await Employee.find({ isActive: true }).sort({ employeeCode: 1 });

    let schedule = await DailySchedule.findOne({ date })
      .populate('assignments.employeeId')
      .populate('assignments.shiftId')
      .populate('createdBy', 'name email')
      .populate('finalizedBy', 'name email');

    if (!schedule) {
      // Auto-construct initial draft view for this date with all active employees
      const initialAssignments = allActiveEmployees.map((emp) => ({
        employeeId: emp,
        shiftId: null,
        status: 'unassigned',
        note: ''
      }));

      return res.json({
        success: true,
        isNew: true,
        data: {
          date,
          status: 'draft',
          assignments: initialAssignments,
          createdAt: null,
          updatedAt: null
        }
      });
    }

    // Merge in any active employees that might have been added after schedule creation
    const assignedEmpIds = new Set(
      schedule.assignments
        .filter((a) => a.employeeId)
        .map((a) => a.employeeId._id ? a.employeeId._id.toString() : a.employeeId.toString())
    );

    const mergedAssignments = [...schedule.assignments];
    allActiveEmployees.forEach((emp) => {
      if (!assignedEmpIds.has(emp._id.toString())) {
        mergedAssignments.push({
          employeeId: emp,
          shiftId: null,
          status: 'unassigned',
          note: ''
        });
      }
    });

    const result = schedule.toObject();
    result.assignments = mergedAssignments;

    res.json({
      success: true,
      isNew: false,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve schedule', error: error.message });
  }
};

// PUT /api/schedules/:date
exports.saveSchedule = async (req, res) => {
  try {
    const date = normalizeDate(req.params.date);
    const { assignments } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ success: false, message: 'Invalid assignments payload format' });
    }

    // Check if schedule is already finalized
    let existingSchedule = await DailySchedule.findOne({ date });
    if (existingSchedule && existingSchedule.status === 'finalized') {
      return res.status(403).json({
        success: false,
        message: 'This schedule is finalized and locked. You must reopen it to make changes.'
      });
    }

    // Validate duplicate employees in payload
    const seenEmployees = new Set();
    const cleanAssignments = [];

    for (const a of assignments) {
      const empId = a.employeeId ? (a.employeeId._id || a.employeeId).toString() : null;
      if (!empId) continue;

      if (seenEmployees.has(empId)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate assignment detected for employee ID: ${empId}. An employee can only be assigned once per day.`
        });
      }
      seenEmployees.add(empId);

      cleanAssignments.push({
        employeeId: empId,
        shiftId: a.shiftId ? (a.shiftId._id || a.shiftId).toString() : null,
        status: a.status || 'unassigned',
        note: (a.note || '').trim()
      });
    }

    if (!existingSchedule) {
      existingSchedule = new DailySchedule({
        date,
        status: 'draft',
        assignments: cleanAssignments,
        createdBy: req.user?._id,
        updatedBy: req.user?._id
      });
    } else {
      existingSchedule.assignments = cleanAssignments;
      existingSchedule.updatedBy = req.user?._id;
    }

    await existingSchedule.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'SCHEDULE_SAVED',
      targetDate: date,
      scheduleId: existingSchedule._id,
      details: `Saved shift schedule for ${date} with ${cleanAssignments.length} employee records`
    });

    // Populate and return
    const populated = await DailySchedule.findById(existingSchedule._id)
      .populate('assignments.employeeId')
      .populate('assignments.shiftId')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Schedule saved successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save schedule', error: error.message });
  }
};

// POST /api/schedules/:date/finalize
exports.finalizeSchedule = async (req, res) => {
  try {
    const date = normalizeDate(req.params.date);
    const schedule = await DailySchedule.findOne({ date });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'No schedule found for this date to finalize' });
    }

    schedule.status = 'finalized';
    schedule.finalizedBy = req.user?._id;
    schedule.finalizedAt = new Date();
    await schedule.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'SCHEDULE_FINALIZED',
      targetDate: date,
      scheduleId: schedule._id,
      details: `Schedule for ${date} was finalized and locked`
    });

    res.json({ success: true, message: `Schedule for ${date} finalized successfully`, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to finalize schedule', error: error.message });
  }
};

// POST /api/schedules/:date/reopen
exports.reopenSchedule = async (req, res) => {
  try {
    const date = normalizeDate(req.params.date);
    const { reason } = req.body;
    const schedule = await DailySchedule.findOne({ date });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'No schedule found for this date' });
    }

    schedule.status = 'draft';
    await schedule.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'SCHEDULE_REOPENED',
      targetDate: date,
      scheduleId: schedule._id,
      details: `Schedule for ${date} was unlocked/reopened. Reason: ${reason || 'Manager manual edit'}`
    });

    res.json({ success: true, message: `Schedule for ${date} unlocked for editing`, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reopen schedule', error: error.message });
  }
};

// POST /api/schedules/:date/copy-from
exports.copyFromDate = async (req, res) => {
  try {
    const targetDate = normalizeDate(req.params.date);
    const { sourceDate } = req.body;

    if (!sourceDate) {
      return res.status(400).json({ success: false, message: 'Please specify source date to copy from' });
    }

    const source = await DailySchedule.findOne({ date: normalizeDate(sourceDate) });
    if (!source) {
      return res.status(404).json({ success: false, message: `No schedule found for source date ${sourceDate}` });
    }

    let target = await DailySchedule.findOne({ date: targetDate });
    if (target && target.status === 'finalized') {
      return res.status(403).json({ success: false, message: 'Target date schedule is finalized and locked.' });
    }

    // Clean assignments mapping
    const copiedAssignments = source.assignments.map((a) => ({
      employeeId: a.employeeId,
      shiftId: a.shiftId,
      status: a.status,
      note: a.note ? `(Copied from ${sourceDate}) ${a.note}` : ''
    }));

    if (!target) {
      target = new DailySchedule({
        date: targetDate,
        status: 'draft',
        assignments: copiedAssignments,
        createdBy: req.user?._id
      });
    } else {
      target.assignments = copiedAssignments;
      target.updatedBy = req.user?._id;
    }

    await target.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'SCHEDULE_COPIED',
      targetDate,
      scheduleId: target._id,
      details: `Copied schedule roster from ${sourceDate} into ${targetDate}`
    });

    const populated = await DailySchedule.findById(target._id)
      .populate('assignments.employeeId')
      .populate('assignments.shiftId')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: `Successfully copied schedule from ${sourceDate} to ${targetDate}`,
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to copy schedule', error: error.message });
  }
};

// GET /api/schedules/:date/export
exports.exportSchedule = async (req, res) => {
  try {
    const date = normalizeDate(req.params.date);
    const schedule = await DailySchedule.findOne({ date })
      .populate('assignments.employeeId')
      .populate('assignments.shiftId');

    if (!schedule) {
      return res.status(404).json({ success: false, message: `No roster found for date ${date} to export` });
    }

    const shiftsList = await Shift.find({ isActive: true });
    await generateDailyRoster(schedule, shiftsList, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export generation failed', error: error.message });
  }
};

// GET /api/schedules/stats/summary
exports.getDashboardStats = async (req, res) => {
  try {
    const date = normalizeDate(req.query.date || new Date().toISOString().slice(0, 10));

    const totalActiveEmployees = await Employee.countDocuments({ isActive: true });
    const totalDepartments = (await Employee.distinct('department')).length;
    const shifts = await Shift.find({ isActive: true });

    const schedule = await DailySchedule.findOne({ date })
      .populate('assignments.employeeId')
      .populate('assignments.shiftId');

    let assignedToday = 0;
    let offToday = 0;
    let leaveToday = 0;
    let unassignedToday = 0;

    const shiftHeadcounts = {};
    shifts.forEach((s) => {
      shiftHeadcounts[s._id.toString()] = {
        name: s.name,
        code: s.code,
        startTime: s.startTime,
        endTime: s.endTime,
        minStaffing: s.minStaffing,
        color: s.color,
        count: 0
      };
    });

    if (schedule && schedule.assignments) {
      const assignedEmpIds = new Set();
      schedule.assignments.forEach((a) => {
        if (!a.employeeId) return;
        assignedEmpIds.add(a.employeeId._id ? a.employeeId._id.toString() : a.employeeId.toString());

        if (a.status === 'assigned' && a.shiftId) {
          assignedToday++;
          const sid = (a.shiftId._id || a.shiftId).toString();
          if (shiftHeadcounts[sid]) {
            shiftHeadcounts[sid].count++;
          }
        } else if (a.status === 'off') {
          offToday++;
        } else if (a.status === 'leave') {
          leaveToday++;
        } else {
          unassignedToday++;
        }
      });

      // Also account for active employees not in assignments list
      const missingCount = Math.max(0, totalActiveEmployees - assignedEmpIds.size);
      unassignedToday += missingCount;
    } else {
      unassignedToday = totalActiveEmployees;
    }

    res.json({
      success: true,
      data: {
        date,
        scheduleStatus: schedule ? schedule.status : 'not_created',
        totalActiveEmployees,
        totalDepartments,
        assignedToday,
        offToday,
        leaveToday,
        unassignedToday,
        shiftStats: Object.values(shiftHeadcounts)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
