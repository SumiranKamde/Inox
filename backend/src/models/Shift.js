const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true // Format "HH:mm" e.g., "06:00"
    },
    endTime: {
      type: String,
      required: true,
      trim: true // Format "HH:mm" e.g., "14:00"
    },
    breakMinutes: {
      type: Number,
      default: 30
    },
    minStaffing: {
      type: Number,
      default: 5
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Shift', shiftSchema);
