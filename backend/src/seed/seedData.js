require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const DailySchedule = require('../models/DailySchedule');
const AuditLog = require('../models/AuditLog');

// Exactly 11 factory employees
const initialEmployees = [
  { employeeCode: 'EMP001', name: 'Rajesh Sharma', department: 'Production', designation: 'Senior CNC Operator', phone: '9876543210' },
  { employeeCode: 'EMP002', name: 'Amit Patel', department: 'Production', designation: 'Machine Operator', phone: '9876543211' },
  { employeeCode: 'EMP003', name: 'Suresh Verma', department: 'Production', designation: 'Milling Technician', phone: '9876543212' },
  { employeeCode: 'EMP004', name: 'Vikram Singh', department: 'Production', designation: 'Press Tool Operator', phone: '9876543213' },
  { employeeCode: 'EMP005', name: 'Manoj Kumar', department: 'Production', designation: 'Production Line Lead', phone: '9876543214' },
  { employeeCode: 'EMP006', name: 'Dinesh Yadav', department: 'Assembly', designation: 'Assembly Technician', phone: '9876543215' },
  { employeeCode: 'EMP007', name: 'Sunil Rao', department: 'Assembly', designation: 'Mechanical Assembler', phone: '9876543216' },
  { employeeCode: 'EMP008', name: 'Praveen Nair', department: 'Assembly', designation: 'Fitter & Assembler', phone: '9876543217' },
  { employeeCode: 'EMP009', name: 'Pooja Kulkarni', department: 'Quality Control', designation: 'QA Lead Inspector', phone: '9876543218' },
  { employeeCode: 'EMP010', name: 'Neha Saxena', department: 'Quality Control', designation: 'CMM Inspector', phone: '9876543219' },
  { employeeCode: 'EMP011', name: 'Vijay Chauhan', department: 'Maintenance', designation: 'Maintenance Engineer', phone: '9876543220' }
];

// Configured 3 Shifts: A (7am-3pm), B (3pm-10pm), C (10pm-7am)
const initialShifts = [
  {
    name: 'Shift A',
    code: 'A',
    startTime: '07:00',
    endTime: '15:00',
    breakMinutes: 30,
    minStaffing: 4,
    color: '#2563eb' // Blue
  },
  {
    name: 'Shift B',
    code: 'B',
    startTime: '15:00',
    endTime: '22:00',
    breakMinutes: 30,
    minStaffing: 3,
    color: '#d97706' // Amber
  },
  {
    name: 'Shift C',
    code: 'C',
    startTime: '22:00',
    endTime: '07:00',
    breakMinutes: 30,
    minStaffing: 3,
    color: '#7c3aed' // Purple (Overnight +1d)
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inox_factory_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for database sync...');

    // 1. Admin User
    let admin = await User.findOne({ email: 'admin@inox.com' });
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        name: 'Factory Plant Manager',
        email: 'admin@inox.com',
        passwordHash: hash,
        role: 'admin',
        isActive: true
      });
      console.log('Created Admin User: admin@inox.com / admin123');
    }

    // 2. Reset and configure Shifts A, B, C
    await Shift.deleteMany({});
    const createdShifts = await Shift.insertMany(initialShifts);
    console.log(`Configured ${createdShifts.length} plant shifts:`);
    createdShifts.forEach(s => console.log(` - Shift ${s.code} (${s.name}): ${s.startTime} - ${s.endTime}`));

    // 3. Reset and configure exactly 11 employees
    await Employee.deleteMany({});
    const createdEmployees = await Employee.insertMany(initialEmployees);
    console.log(`Configured exactly ${createdEmployees.length} employees (EMP001 to EMP011).`);

    // 4. Create Today's Roster with 11 employees allocated to A, B, C
    const today = new Date().toISOString().slice(0, 10);
    await DailySchedule.deleteMany({ date: today });

    const shiftA = createdShifts.find(s => s.code === 'A');
    const shiftB = createdShifts.find(s => s.code === 'B');
    const shiftC = createdShifts.find(s => s.code === 'C');

    // Allocation logic for 11 employees:
    // 4 in Shift A (7am - 3pm)
    // 3 in Shift B (3pm - 10pm)
    // 3 in Shift C (10pm - 7am)
    // 1 in Weekly Off
    const assignments = createdEmployees.map((emp, index) => {
      let shiftId = shiftA._id;
      let status = 'assigned';
      let note = '';

      if (index < 4) {
        shiftId = shiftA._id;
        status = 'assigned';
        note = 'Line 1 Production';
      } else if (index < 7) {
        shiftId = shiftB._id;
        status = 'assigned';
        note = 'Line 2 Afternoon';
      } else if (index < 10) {
        shiftId = shiftC._id;
        status = 'assigned';
        note = 'Night Batch Run';
      } else {
        shiftId = null;
        status = 'off';
        note = 'Scheduled Weekly Off';
      }

      return {
        employeeId: emp._id,
        shiftId,
        status,
        note
      };
    });

    const schedule = await DailySchedule.create({
      date: today,
      status: 'draft',
      assignments,
      createdBy: admin._id
    });
    console.log(`Created daily roster for today (${today}) for 11 employees.`);

    // 5. Audit Log
    await AuditLog.create({
      userId: admin._id,
      action: 'SYSTEM_CONFIGURED',
      details: 'Configured plant for 11 employees across Shift A (07:00-15:00), Shift B (15:00-22:00), and Shift C (22:00-07:00)'
    });

    console.log('Sync completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
