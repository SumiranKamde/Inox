const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    serialNo: {
      type: Number,
      default: 0
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      default: 'Plant Operations',
      trim: true
    },
    designation: {
      type: String,
      default: 'Operator',
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    stopLocation: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['shift', 'general'],
      default: 'shift'
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Employee', employeeSchema);
