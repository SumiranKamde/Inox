const Shift = require('../models/Shift');
const AuditLog = require('../models/AuditLog');

// GET /api/shifts
exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ startTime: 1 });
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch shifts', error: error.message });
  }
};

// POST /api/shifts
exports.createShift = async (req, res) => {
  try {
    const { name, code, startTime, endTime, breakMinutes, minStaffing, color } = req.body;

    if (!name || !code || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide shift name, code, and start/end times' });
    }

    const existing = await Shift.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Shift code "${code}" already exists` });
    }

    const shift = await Shift.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      breakMinutes: breakMinutes !== undefined ? Number(breakMinutes) : 30,
      minStaffing: minStaffing !== undefined ? Number(minStaffing) : 5,
      color: color || '#3b82f6',
      isActive: true
    });

    await AuditLog.create({
      userId: req.user?._id,
      action: 'SHIFT_CREATED',
      details: `Created shift ${shift.name} (${shift.code}: ${shift.startTime}-${shift.endTime})`
    });

    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create shift', error: error.message });
  }
};

// PATCH /api/shifts/:id
exports.updateShift = async (req, res) => {
  try {
    const { name, code, startTime, endTime, breakMinutes, minStaffing, color, isActive } = req.body;
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    if (code && code.trim().toUpperCase() !== shift.code) {
      const existing = await Shift.findOne({ code: code.trim().toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Shift code "${code}" already exists` });
      }
      shift.code = code.trim().toUpperCase();
    }

    if (name) shift.name = name.trim();
    if (startTime) shift.startTime = startTime.trim();
    if (endTime) shift.endTime = endTime.trim();
    if (breakMinutes !== undefined) shift.breakMinutes = Number(breakMinutes);
    if (minStaffing !== undefined) shift.minStaffing = Number(minStaffing);
    if (color) shift.color = color;
    if (isActive !== undefined) shift.isActive = Boolean(isActive);

    await shift.save();

    await AuditLog.create({
      userId: req.user?._id,
      action: 'SHIFT_UPDATED',
      details: `Updated shift ${shift.name} (${shift.code})`
    });

    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update shift', error: error.message });
  }
};
