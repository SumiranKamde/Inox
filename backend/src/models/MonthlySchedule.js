const mongoose = require('mongoose');

const monthlyAssignmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    days: {
      type: mongoose.Schema.Types.Mixed, // { "1": "A", "2": "W/O", ... "31": "C" }
      default: {}
    }
  },
  { _id: false }
);

const monthlyScheduleSchema = new mongoose.Schema(
  {
    month: {
      type: String, // "YYYY-MM" e.g. "2026-10"
      required: true,
      unique: true,
      index: true
    },
    plantName: {
      type: String,
      default: 'INOX AIR PRODUCTS PVT LTD. BHANDARA'
    },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft'
    },
    assignments: [monthlyAssignmentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MonthlySchedule', monthlyScheduleSchema);
