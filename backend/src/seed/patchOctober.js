/**
 * One-time patch: update October 2026 schedule in MongoDB
 * to match the exact data from the physical shift chart image.
 *
 * Changes found vs previous seed:
 *   Row 1 (EJAJ SAYYAD)  Day 11: 'B' → 'C'
 *   (all other rows already matched the image)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const MonthlySchedule = require('../models/MonthlySchedule');
const Employee = require('../models/Employee');

// ── EXACT October 2026 data from the physical chart image ──────────────────
// Days: 1  2     3   4   5   6   7   8   9    10  11  12  13  14  15  16    17  18  19  20  21  22    23  24  25  26  27  28  29    30  31
const octoberDataRows = [
  // 1: Mr. EJAJ SAYYAD
  ['A','W/O','L','L','C','B','A','A','W/O','C','C','B','B','B','A','W/O','C','C','B','B','A','W/O','C','C','B','B','A','A','W/O','C','C'],
  // 2: Mr. AJAY GABHANE
  ['B','A','C','W/O','B','C','B','B','A','A','W/O','C','C','L','L','L','L','W/O','C','C','C','B','B','A','W/O','C','C','B','B','A','A'],
  // 3: Mr. K.B. SINGH
  ['C','B','A','L','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','A','W/O','L','L','L','B','A','A','W/O','C','C','B'],
  // 4: Mr. VISHAL GAIDHANE
  ['L','C','B','A','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B'],
  // 5: Mr. SUNIL RAJURKAR
  ['C','B','W/O','C','C','B','B','A','L','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','L','W/O','C','C','B','B','A','A','W/O'],
  // 6: Mr. SURENDER SINGH
  ['B','A','A','B','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','L','B','B','A'],
  // 7: Mr. MAHESH SAHARE
  ['B','B','B','A','G','W/O','C','B','A','B','A','G','W/O','A','C','B','B','A','G','W/O','A','B','A','B','A','B','G','W/O','C','B','C'],
  // 8: Mr. SIDDHARTH M
  ['W/O','C','C','C','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','L','A','W/O','C','C','B','B','A','A','W/O','C','C'],
  // 9: Mr. ANKUR BHURE  (OD for first 14 days, then regular)
  ['OD','OD','OD','OD','OD','OD','OD','OD','OD','OD','OD','OD','OD','OD','A','A','W/O','C','C','B','L','A','A','C','W/O','C','C','B','B','A','W/O'],
  // 10: Mr. GAURAV DHOKE
  ['C','B','B','B','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B'],
  // 11: MR. OMPRAKASH R
  ['A','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A','W/O','C','C','B','B','A','A'],
  // 12: Mr. GAJANAN KAMDE  (mostly General shift, A on days 16 & 23)
  ['G','G','G','W/O','G','G','G','G','G','G','W/O','G','G','G','G','A','G','W/O','G','G','G','G','A','G','W/O','G','G','G','G','G','G'],
  // 13: Mr. MAHIPAL KHOBRAGADE  (A day 1, B day 4, rest General)
  ['A','G','G','B','W/O','G','G','G','G','G','W/O','G','G','G','G','G','G','W/O','G','G','G','G','G','G','W/O','G','G','G','G','G','G'],
];

async function patchOctober() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inox_factory_db';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB...');

  // Fetch employees in the correct serial order
  const shiftEmps = await Employee.find({ category: 'shift', isActive: true }).sort({ serialNo: 1, employeeCode: 1 });
  if (shiftEmps.length === 0) {
    console.error('No shift employees found! Run seedData.js first.');
    process.exit(1);
  }

  console.log(`Found ${shiftEmps.length} shift employees.`);

  // Build the assignments array from the image data
  const assignments = shiftEmps.map((emp, idx) => {
    const row = octoberDataRows[idx] || [];
    const days = {};
    row.forEach((val, i) => { days[String(i + 1)] = val; });
    return { employeeId: emp._id, days };
  });

  // Upsert the October schedule
  const result = await MonthlySchedule.findOneAndUpdate(
    { month: '2026-10' },
    {
      $set: {
        month: '2026-10',
        plantName: 'INOX AIR PRODUCTS PVT LTD. BHANDARA',
        status: 'finalized',
        assignments,
        updatedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  console.log(`✓ October 2026 schedule updated (${assignments.length} employees).`);

  // Verify one row as sanity check
  const check = result.assignments[0];
  const day11 = check?.days?.['11'];
  const day10 = check?.days?.['10'];
  console.log(`  Employee 1 (EJAJ SAYYAD) — Day 10: ${day10}, Day 11: ${day11} (should be C, C)`);

  console.log('\nAll rows updated to match physical chart. Done!');
  process.exit(0);
}

patchOctober().catch(err => {
  console.error('Patch failed:', err);
  process.exit(1);
});
