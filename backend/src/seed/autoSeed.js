const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const MonthlySchedule = require('../models/MonthlySchedule');

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

const octoberDataRows = [
  ['A', 'W/O', 'L', 'L', 'C', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C'],
  ['B', 'A', 'C', 'W/O', 'B', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'L', 'L', 'L', 'L', 'W/O', 'C', 'C', 'C', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A'],
  ['C', 'B', 'A', 'L', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'A', 'W/O', 'L', 'L', 'L', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B'],
  ['L', 'C', 'B', 'A', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B'],
  ['C', 'B', 'W/O', 'C', 'C', 'B', 'B', 'A', 'L', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'L', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O'],
  ['B', 'A', 'A', 'B', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'L', 'B', 'B', 'A'],
  ['B', 'B', 'B', 'A', 'G', 'W/O', 'C', 'B', 'A', 'B', 'A', 'G', 'W/O', 'A', 'C', 'B', 'B', 'A', 'G', 'W/O', 'A', 'B', 'A', 'B', 'A', 'B', 'G', 'W/O', 'C', 'B', 'C'],
  ['W/O', 'C', 'C', 'C', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'L', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C'],
  ['C', 'C', 'C', 'B', 'B', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B', 'B', 'A', 'A', 'W/O', 'C', 'C', 'B'],
  ['A', 'A', 'B', 'C', 'B', 'A', 'W/O', 'A', 'B', 'C', 'B', 'A', 'W/O', 'B', 'A', 'B', 'C', 'B', 'A', 'W/O', 'B', 'A', 'B', 'C', 'B', 'A', 'W/O', 'B', 'A', 'B', 'A'],
  ['A', 'B', 'B', 'W/O', 'A', 'C', 'C', 'B', 'B', 'W/O', 'A', 'C', 'C', 'B', 'B', 'W/O', 'A', 'C', 'C', 'B', 'B', 'W/O', 'A', 'C', 'C', 'B', 'B', 'W/O', 'A', 'C', 'C'],
  ['A', 'A', 'A', 'B', 'C', 'W/O', 'B', 'A', 'A', 'B', 'C', 'W/O', 'B', 'A', 'A', 'B', 'C', 'W/O', 'B', 'A', 'A', 'B', 'C', 'W/O', 'B', 'A', 'A', 'B', 'C', 'W/O', 'A'],
  ['C', 'B', 'A', 'C', 'W/O', 'B', 'A', 'C', 'B', 'A', 'C', 'W/O', 'B', 'A', 'C', 'B', 'A', 'C', 'W/O', 'B', 'A', 'C', 'B', 'A', 'C', 'W/O', 'B', 'A', 'C', 'B', 'A']
];

const initialShifts = [
  { name: 'Shift A', code: 'A', startTime: '07:00', endTime: '15:00', breakMinutes: 30, minStaffing: 4, color: '#2563eb' },
  { name: 'Shift B', code: 'B', startTime: '15:00', endTime: '22:00', breakMinutes: 30, minStaffing: 3, color: '#d97706' },
  { name: 'Shift C', code: 'C', startTime: '22:00', endTime: '07:00', breakMinutes: 30, minStaffing: 3, color: '#7c3aed' },
  { name: 'General', code: 'G', startTime: '08:30', endTime: '17:00', breakMinutes: 45, minStaffing: 1, color: '#059669' }
];

async function ensureSeeded() {
  const count = await Employee.countDocuments();
  if (count > 0) return;

  console.log('Database empty! Auto-seeding Inox Factory data for production deployment...');

  // 1. Admin
  let admin = await User.findOne({ email: 'admin@inox.com' });
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    admin = await User.create({
      name: 'Factory Plant Manager',
      email: 'admin@inox.com',
      passwordHash: hash,
      role: 'admin',
      department: 'Management'
    });
  }

  // 2. Shifts
  for (const s of initialShifts) {
    await Shift.findOneAndUpdate({ code: s.code }, s, { upsert: true, new: true });
  }

  // 3. Shift Employees
  const createdShiftWorkers = [];
  for (const e of shiftEmployees) {
    const emp = await Employee.create(e);
    createdShiftWorkers.push(emp);
  }

  // 4. General Staff
  for (const g of generalEmployees) {
    await Employee.create(g);
  }

  // 5. October 2026 Schedule
  const assignmentsOct = createdShiftWorkers.map((emp, index) => {
    const dayValues = octoberDataRows[index] || [];
    const days = {};
    for (let d = 1; d <= 31; d++) {
      days[d.toString()] = dayValues[d - 1] || 'A';
    }
    return { employeeId: emp._id, days };
  });

  await MonthlySchedule.create({
    month: '2026-10',
    plantName: 'INOX AIR PRODUCTS PVT LTD. BHANDARA',
    status: 'finalized',
    assignments: assignmentsOct,
    createdBy: admin._id
  });

  console.log('Auto-seed completed successfully!');
}

module.exports = { ensureSeeded };
