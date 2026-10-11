require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const MonthlySchedule = require('../models/MonthlySchedule');
const AuditLog = require('../models/AuditLog');

// 13 Shift Schedule Employees
const shiftEmployees = [
  { serialNo: 1, employeeCode: 'EMP001', name: 'Mr. EJAJ SAYYAD', phone: '8668811871', stopLocation: 'OWN Vehicle', category: 'shift' },
  { serialNo: 2, employeeCode: 'EMP002', name: 'Mr. AJAY GABHANE', phone: '8261062717', stopLocation: 'Petrol pump pragati colony', category: 'shift' },
  { serialNo: 3, employeeCode: 'EMP003', name: 'Mr. K.B. SINGH', phone: '9890587946', stopLocation: 'Satyam talkies', category: 'shift' },
  { serialNo: 4, employeeCode: 'EMP004', name: 'Mr. VISHAL GAIDHANE', phone: '9322090694', stopLocation: 'opp Sarda Banglo', category: 'shift' },
  { serialNo: 5, employeeCode: 'EMP005', name: 'Mr. SUNIL RAJURKAR', phone: '9511876113', stopLocation: 'Petrol pump pragati colony', category: 'shift' },
  { serialNo: 6, employeeCode: 'EMP006', name: 'Mr. SURENDER SINGH', phone: '9518371683', stopLocation: 'opp Sarda Banglo', category: 'shift' },
  { serialNo: 7, employeeCode: 'EMP007', name: 'Mr. MAHESH SAHARE', phone: '8788939598', stopLocation: 'Chole eye hospital, highway', category: 'shift' },
  { serialNo: 8, employeeCode: 'EMP008', name: 'Mr. SIDDHARTH M', phone: '8459236003', stopLocation: 'Satyam talkies', category: 'shift' },
  { serialNo: 9, employeeCode: 'EMP009', name: 'Mr. ANKUR BHURE', phone: '7066785548', stopLocation: 'Chole hospital, highway', category: 'shift' },
  { serialNo: 10, employeeCode: 'EMP010', name: 'Mr. GAURAV DHOKE', phone: '7798081998', stopLocation: 'OWN Vehicle', category: 'shift' },
  { serialNo: 11, employeeCode: 'EMP011', name: 'MR. OMPRAKASH R', phone: '8669624114', stopLocation: 'Sunflag Gate', category: 'shift' },
  { serialNo: 12, employeeCode: 'EMP012', name: 'Mr. GAJANAN KAMDE', phone: '9421072692', stopLocation: 'Petrol pump pragati colony', category: 'shift' },
  { serialNo: 13, employeeCode: 'EMP013', name: 'Mr. MAHIPAL KHOBRAGADE', phone: '9765416629', stopLocation: 'Takiya Ward', category: 'shift' }
];

// General Shift Staff
const generalEmployees = [
  { serialNo: 1, employeeCode: 'GEN001', name: 'Mahipal Khobragade', phone: '9765416629', stopLocation: 'Madar Chowk,', category: 'general' },
  { serialNo: 2, employeeCode: 'GEN002', name: 'Suresh Lanjewar', phone: '9552221761', stopLocation: 'Petrol pump pragati colony', category: 'general' },
  { serialNo: 3, employeeCode: 'GEN003', name: 'S.K. Rana', phone: '9423378975', stopLocation: 'Petrol pump pragati colony', category: 'general' },
  { serialNo: 4, employeeCode: 'GEN004', name: 'Gajanan Kamde', phone: '9421072692', stopLocation: 'Petrol pump pragati colony', category: 'general' },
  { serialNo: 5, employeeCode: 'GEN005', name: 'Khemchand Sahu', phone: '9179413737', stopLocation: 'Petrol pump pragati colony', category: 'general' },
  { serialNo: 6, employeeCode: 'GEN006', name: 'Pranay Nandagawali', phone: '8469405727', stopLocation: 'Satyam talkies', category: 'general' },
  { serialNo: 7, employeeCode: 'GEN007', name: 'Naresh Titirmare', phone: '8830838610', stopLocation: 'Ganesh nagari, warthi road', category: 'general' },
  { serialNo: 8, employeeCode: 'GEN008', name: 'Vikas Gajbhiye', phone: '7719069969', stopLocation: 'Sunflag gate', category: 'general' },
  { serialNo: 9, employeeCode: 'GEN009', name: 'Bhaskar Meshram', phone: '7499760516', stopLocation: 'Sunflag gate', category: 'general' },
  { serialNo: 10, employeeCode: 'GEN010', name: 'Omprakash Rahangadale', phone: '8669624114', stopLocation: 'Sunflag gate', category: 'general' }
];

// Exact October 2026 data arrays for rows 1 to 13
const octoberDataRows = [
  // 1: Mr. EJAJ SAYYAD
  ['A', 'W/O', 'L', 'L', 'C', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C'],
  // 2: Mr. AJAY GABHANE
  ['B', 'A', 'C', 'W/O', 'B', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'L', 'L', 'L', 'L', 'W/O', 'C', 'C', 'C', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A'],
  // 3: Mr. K.B. SINGH
  ['C', 'B', 'A', 'L', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'A', 'W/O', 'L', 'L', 'L', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B'],
  // 4: Mr. VISHAL GAIDHANE
  ['L', 'C', 'B', 'A', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B'],
  // 5: Mr. SUNIL RAJURKAR
  ['C', 'B', 'W/O', 'C', 'C', 'B', 'B', 'A', 'L', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'L', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O'],
  // 6: Mr. SURENDER SINGH
  ['B', 'A', 'A', 'B', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'L', 'B', 'B', 'A'],
  // 7: Mr. MAHESH SAHARE
  ['B', 'B', 'B', 'A', 'G', 'W/O', 'C', 'B', 'A', 'B', 'A', 'G', 'W/O', 'A', 'C', 'B', 'B', 'A', 'G', 'W/O', 'A', 'B', 'A', 'B', 'A', 'B', 'G', 'W/O', 'C', 'B', 'C'],
  // 8: Mr. SIDDHARTH M
  ['W/O', 'C', 'C', 'C', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'L', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C'],
  // 9: Mr. ANKUR BHURE
  ['OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'OD', 'A', 'A', 'W/O', 'C', 'C', 'B', 'L', 'A', 'A', 'C', 'W/O', 'C', 'C', 'B', 'B', 'A', 'W/O'],
  // 10: Mr. GAURAV DHOKE
  ['C', 'B', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B'],
  // 11: MR. OMPRAKASH R
  ['A', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A'],
  // 12: Mr. GAJANAN KAMDE
  ['G', 'G', 'G', 'W/O', 'G', 'G', 'G', 'G', 'G', 'G', 'W/O', 'G', 'G', 'G', 'G', 'A', 'G', 'W/O', 'G', 'G', 'G', 'G', 'A', 'G', 'W/O', 'G', 'G', 'G', 'G', 'G', 'G'],
  // 13: Mr. MAHIPAL KHOBRAGADE
  ['A', 'G', 'G', 'B', 'W/O', 'G', 'G', 'G', 'G', 'G', 'W/O', 'G', 'G', 'G', 'G', 'G', 'G', 'W/O', 'G', 'G', 'G', 'G', 'G', 'G', 'W/O', 'G', 'G', 'G', 'G', 'G', 'G']
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inox_factory_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for real Bhandara plant sync...');

    // 1. Admin
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
    }

    // 2. Shifts
    await Shift.deleteMany({});
    await Shift.insertMany([
      { name: 'Shift A', code: 'A', startTime: '07:00', endTime: '15:00', breakMinutes: 30, minStaffing: 4, color: '#2563eb' },
      { name: 'Shift B', code: 'B', startTime: '15:00', endTime: '22:00', breakMinutes: 30, minStaffing: 3, color: '#d97706' },
      { name: 'Shift C', code: 'C', startTime: '22:00', endTime: '07:00', breakMinutes: 30, minStaffing: 3, color: '#7c3aed' },
      { name: 'General Shift', code: 'G', startTime: '08:30', endTime: '17:00', breakMinutes: 60, minStaffing: 4, color: '#059669' }
    ]);

    // 3. Employees
    await Employee.deleteMany({});
    const createdShiftWorkers = await Employee.insertMany(shiftEmployees);
    const createdGenWorkers = await Employee.insertMany(generalEmployees);
    console.log(`Created ${createdShiftWorkers.length} shift workers and ${createdGenWorkers.length} general workers.`);

    // 4. Monthly Schedule for October 2026 (2026-10)
    await MonthlySchedule.deleteMany({ month: { $in: ['2026-10', '2026-11'] } });

    const assignmentsOct = createdShiftWorkers.map((emp, index) => {
      const dayValues = octoberDataRows[index] || [];
      const days = {};
      for (let d = 1; d <= 31; d++) {
        days[d.toString()] = dayValues[d - 1] || 'A';
      }
      return {
        employeeId: emp._id,
        days
      };
    });

    await MonthlySchedule.create({
      month: '2026-10',
      plantName: 'INOX AIR PRODUCTS PVT LTD. BHANDARA',
      status: 'finalized',
      assignments: assignmentsOct,
      createdBy: admin._id
    });

    // Also seed November 2026 (30 days) with continuous rotating shift pattern
    const assignmentsNov = createdShiftWorkers.map((emp, index) => {
      const dayValues = octoberDataRows[index] || [];
      const days = {};
      for (let d = 1; d <= 30; d++) {
        // Shift pattern continues smoothly
        const sourceIndex = (d + 2) % 31;
        days[d.toString()] = dayValues[sourceIndex] || 'A';
      }
      return {
        employeeId: emp._id,
        days
      };
    });

    await MonthlySchedule.create({
      month: '2026-11',
      plantName: 'INOX AIR PRODUCTS PVT LTD. BHANDARA',
      status: 'finalized',
      assignments: assignmentsNov,
      createdBy: admin._id
    });

    console.log('Successfully seeded October 2026 & November 2026 Monthly Schedules!');
    process.exit(0);
  } catch (err) {
    console.error('Monthly Seeding error:', err);
    process.exit(1);
  }
}

seed();
