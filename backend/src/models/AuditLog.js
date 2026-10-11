const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    targetDate: {
      type: String,
      default: ''
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailySchedule',
      default: null
    },
    details: {
      type: String,
      required: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
