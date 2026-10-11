const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50 } = req.query;
    const filter = {};
    if (action) {
      filter.action = action;
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};
