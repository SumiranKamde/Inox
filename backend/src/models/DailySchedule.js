const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    status: {
      type: String,
      enum: ['assigned', 'off', 'leave', 'unassigned'],
      default: 'unassigned'
    },
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const dailyScheduleSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Normalized to "YYYY-MM-DD"
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft'
    },
    assignments: [assignmentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    finalizedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DailySchedule', dailyScheduleSchema);
