const ExcelJS = require('exceljs');

/**
 * Generate formatted 3-worksheet Excel workbook for a daily schedule
 */
async function generateDailyRoster(schedule, shiftsList, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inox Factory Employee Management';
  workbook.lastModifiedBy = 'Factory Shift System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const formattedDate = schedule.date;

  // --- SHEET 1: Daily Roster ---
  const rosterSheet = workbook.addWorksheet('Daily Roster', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  // Title Banner
  rosterSheet.mergeCells('A1:I1');
  const titleCell = rosterSheet.getCell('A1');
  titleCell.value = `FACTORY DAILY SHIFT ROSTER - ${formattedDate} (${schedule.status ? schedule.status.toUpperCase() : 'DRAFT'})`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' } // Slate 800
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  rosterSheet.getRow(1).height = 28;

  rosterSheet.getRow(2).values = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Designation',
    'Shift',
    'Shift Timing',
    'Status',
    'Remarks / Notes'
  ];

  rosterSheet.columns = [
    { key: 'code', width: 16 },
    { key: 'name', width: 26 },
    { key: 'department', width: 22 },
    { key: 'designation', width: 20 },
    { key: 'shift', width: 18 },
    { key: 'timing', width: 20 },
    { key: 'status', width: 16 },
    { key: 'note', width: 30 }
  ];

  const headerRow = rosterSheet.getRow(2);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' } // Slate 700
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  const assignments = schedule.assignments || [];

  assignments.forEach((assignment, idx) => {
    const emp = assignment.employeeId || {};
    const shift = assignment.shiftId || null;

    let timingStr = '-';
    let shiftName = '-';
    if (shift) {
      shiftName = `${shift.name} (${shift.code || ''})`;
      const isOvernight = shift.startTime > shift.endTime;
      timingStr = `${shift.startTime} - ${shift.endTime}${isOvernight ? ' (+1d)' : ''}`;
    }

    const statusDisplay = (assignment.status || 'unassigned').toUpperCase();

    const row = rosterSheet.addRow({
      code: emp.employeeCode || 'N/A',
      name: emp.name || 'Unknown',
      department: emp.department || '-',
      designation: emp.designation || '-',
      shift: shiftName,
      timing: timingStr,
      status: statusDisplay,
      note: assignment.note || ''
    });

    row.height = 20;

    // Alternating row background
    const bg = idx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bg }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber >= 5 ? 'center' : 'left' };
    });

    // Color status cell
    const statusCell = row.getCell(7);
    if (statusDisplay === 'ASSIGNED') {
      statusCell.font = { color: { argb: 'FF15803D' }, bold: true }; // Green
    } else if (statusDisplay === 'OFF') {
      statusCell.font = { color: { argb: 'FF6B7280' }, bold: true }; // Gray
    } else if (statusDisplay === 'LEAVE') {
      statusCell.font = { color: { argb: 'FFB45309' }, bold: true }; // Amber
    } else {
      statusCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red
    }
  });

  rosterSheet.autoFilter = {
    from: 'A2',
    to: 'H2'
  };

  // --- SHEET 2: Shift Summary ---
  const shiftSheet = workbook.addWorksheet('Shift Summary');
  shiftSheet.views = [{ state: 'frozen', ySplit: 2 }];

  shiftSheet.mergeCells('A1:F1');
  const sTitle = shiftSheet.getCell('A1');
  sTitle.value = `DAILY SHIFT STAFFING SUMMARY - ${formattedDate}`;
  sTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  sTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  shiftSheet.getRow(1).height = 26;

  shiftSheet.getRow(2).values = [
    'Shift Name',
    'Shift Code',
    'Timings',
    'Assigned Employees',
    'Minimum Required',
    'Staffing Balance'
  ];

  shiftSheet.columns = [
    { key: 'name', width: 22 },
    { key: 'code', width: 14 },
    { key: 'timings', width: 22 },
    { key: 'assigned', width: 20 },
    { key: 'required', width: 20 },
    { key: 'balance', width: 20 }
  ];

  const sHeaderRow = shiftSheet.getRow(2);
  sHeaderRow.height = 24;
  sHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Blue 600
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF93C5FD' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } }
    };
  });

  // Calculate shift counts
  const shiftCounts = {};
  shiftsList.forEach((s) => {
    shiftCounts[s._id.toString()] = 0;
  });

  let totalAssigned = 0;
  let totalRequired = 0;

  assignments.forEach((a) => {
    if (a.status === 'assigned' && a.shiftId) {
      const sId = (a.shiftId._id || a.shiftId).toString();
      shiftCounts[sId] = (shiftCounts[sId] || 0) + 1;
      totalAssigned++;
    }
  });

  shiftsList.forEach((s) => {
    const sId = s._id.toString();
    const count = shiftCounts[sId] || 0;
    const req = s.minStaffing || 0;
    totalRequired += req;
    const diff = count - req;
    const isOvernight = s.startTime > s.endTime;

    const row = shiftSheet.addRow({
      name: s.name,
      code: s.code,
      timings: `${s.startTime} - ${s.endTime}${isOvernight ? ' (+1d)' : ''}`,
      assigned: count,
      required: req,
      balance: diff >= 0 ? `+${diff} (Surplus/OK)` : `${diff} (Shortage)`
    });

    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.alignment = { vertical: 'middle', horizontal: colNumber >= 4 ? 'center' : 'left' };
    });

    const balanceCell = row.getCell(6);
    if (diff < 0) {
      balanceCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    } else {
      balanceCell.font = { color: { argb: 'FF16A34A' }, bold: true };
    }
  });

  // Summary Row
  const totalRow = shiftSheet.addRow({
    name: 'TOTAL ACROSS SHIFTS',
    code: '',
    timings: '',
    assigned: totalAssigned,
    required: totalRequired,
    balance: totalAssigned - totalRequired >= 0 ? `+${totalAssigned - totalRequired}` : `${totalAssigned - totalRequired}`
  });
  totalRow.height = 22;
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  });

  // --- SHEET 3: Department Summary ---
  const deptSheet = workbook.addWorksheet('Department Summary');
  deptSheet.views = [{ state: 'frozen', ySplit: 2 }];

  deptSheet.mergeCells('A1:F1');
  const dTitle = deptSheet.getCell('A1');
  dTitle.value = `DEPARTMENT DISTRIBUTION - ${formattedDate}`;
  dTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  dTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  deptSheet.getRow(1).height = 26;

  deptSheet.getRow(2).values = [
    'Department',
    'Total Active Staff',
    'Assigned to Shift',
    'Scheduled Off',
    'Approved Leave',
    'Unassigned'
  ];

  deptSheet.columns = [
    { key: 'dept', width: 26 },
    { key: 'total', width: 18 },
    { key: 'assigned', width: 18 },
    { key: 'off', width: 18 },
    { key: 'leave', width: 18 },
    { key: 'unassigned', width: 18 }
  ];

  const dHeaderRow = deptSheet.getRow(2);
  dHeaderRow.height = 24;
  dHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal 600
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const deptStats = {};
  assignments.forEach((a) => {
    const dept = (a.employeeId && a.employeeId.department) ? a.employeeId.department : 'General';
    if (!deptStats[dept]) {
      deptStats[dept] = { total: 0, assigned: 0, off: 0, leave: 0, unassigned: 0 };
    }
    deptStats[dept].total++;
    const st = a.status || 'unassigned';
    if (st === 'assigned') deptStats[dept].assigned++;
    else if (st === 'off') deptStats[dept].off++;
    else if (st === 'leave') deptStats[dept].leave++;
    else deptStats[dept].unassigned++;
  });

  Object.entries(deptStats).forEach(([dept, stats]) => {
    const row = deptSheet.addRow({
      dept,
      total: stats.total,
      assigned: stats.assigned,
      off: stats.off,
      leave: stats.leave,
      unassigned: stats.unassigned
    });
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.alignment = { vertical: 'middle', horizontal: colNumber >= 2 ? 'center' : 'left' };
    });
  });

  // Prepare HTTP response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="factory-roster-${formattedDate}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { generateDailyRoster };
