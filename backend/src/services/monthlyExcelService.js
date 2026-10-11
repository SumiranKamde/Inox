const ExcelJS = require('exceljs');

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const DAY_ABBR = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Generate formatted Monthly Excel workbook matching INOX Air Products Bhandara layout
 */
async function generateMonthlyExcel(schedule, generalEmployees, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INOX AIR PRODUCTS PVT LTD. BHANDARA';
  workbook.created = new Date();

  const [yearStr, monthStr] = schedule.month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed
  const monthName = MONTH_NAMES[monthIndex];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const sheet = workbook.addWorksheet(`OCTOBER ${year}`, {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
    views: [{ state: 'frozen', xSplit: 4, ySplit: 4 }]
  });

  const totalCols = 4 + daysInMonth; // Sr No, Name, Mobile, Stop + days

  // Row 1: Company Title
  sheet.mergeCells(1, 1, 1, totalCols);
  const title1 = sheet.getCell(1, 1);
  title1.value = 'INOX AIR PRODUCTS PVT LTD. BHANDARA';
  title1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 24;

  // Row 2: Subtitle
  sheet.mergeCells(2, 1, 2, totalCols);
  const title2 = sheet.getCell(2, 1);
  title2.value = `SHIFT SCHEDULE FOR THE MONTH OF '${monthName}' ${year}`;
  title2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 20;

  // Row 3 & 4: Header (Date & Day of Week)
  sheet.getCell(3, 1).value = 'SR.';
  sheet.getCell(4, 1).value = 'NO.';
  sheet.mergeCells(3, 1, 4, 1);

  sheet.getCell(3, 2).value = 'DATE';
  sheet.getCell(4, 2).value = 'DAY';

  sheet.getCell(3, 3).value = 'Mobile No.';
  sheet.getCell(4, 3).value = '';
  sheet.mergeCells(3, 3, 4, 3);

  sheet.getCell(3, 4).value = 'STOP';
  sheet.getCell(4, 4).value = '';
  sheet.mergeCells(3, 4, 4, 4);

  // Set widths for leading columns
  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 24;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 24;

  // Fill Day numbers (1..daysInMonth) and Day of Week (TH, FR, SA...)
  for (let day = 1; day <= daysInMonth; day++) {
    const colIdx = 4 + day;
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeekStr = DAY_ABBR[dateObj.getDay()];

    sheet.getCell(3, colIdx).value = day;
    sheet.getCell(4, colIdx).value = dayOfWeekStr;

    const col = sheet.getColumn(colIdx);
    col.width = 4.5;
  }

  // Style Header Rows (Rows 3 and 4)
  [3, 4].forEach(r => {
    const row = sheet.getRow(r);
    row.height = 20;
    for (let c = 1; c <= totalCols; c++) {
      const cell = sheet.getCell(r, c);
      cell.font = { name: 'Calibri', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' } // Light gray header
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });

  // Data Rows
  let currentRow = 5;
  const assignments = schedule.assignments || [];

  assignments.forEach((item, index) => {
    const emp = item.employeeId || {};
    const row = sheet.getRow(currentRow);
    row.height = 19;

    sheet.getCell(currentRow, 1).value = index + 1;
    sheet.getCell(currentRow, 2).value = emp.name || 'Worker';
    sheet.getCell(currentRow, 3).value = emp.phone || '';
    sheet.getCell(currentRow, 4).value = emp.stopLocation || '';

    // Set day values
    for (let day = 1; day <= daysInMonth; day++) {
      const colIdx = 4 + day;
      const val = (item.days && item.days[day.toString()]) || '';
      const cell = sheet.getCell(currentRow, colIdx);
      cell.value = val;

      // Color coding like the real plant schedule
      if (val === 'A') {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E40AF' } }; // Blue
      } else if (val === 'B') {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB45309' } }; // Amber
      } else if (val === 'C') {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF6B21A8' } }; // Purple
      } else if (val === 'G') {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF047857' } }; // Emerald
      } else if (val === 'W/O') {
        cell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'FF475569' } }; // Gray
      } else if (val === 'L') {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFDC2626' } }; // Red
      } else if (val === 'OD') {
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0284C7' } }; // Light blue
      }
    }

    // Apply borders & alignment for all cells in this data row
    for (let c = 1; c <= totalCols; c++) {
      const cell = sheet.getCell(currentRow, c);
      cell.alignment = { 
        horizontal: c === 2 || c === 4 ? 'left' : 'center', 
        vertical: 'middle' 
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    currentRow++;
  });

  // Space between tables
  currentRow += 2;

  // Bottom Section: GENERAL SHIFT TABLE (Left) and PICK UP TIMINGS (Right)
  const generalStartRow = currentRow;

  // General Shift Header
  sheet.getCell(generalStartRow, 1).value = 'SR.';
  sheet.getCell(generalStartRow, 2).value = 'GENERAL SHIFT';
  sheet.getCell(generalStartRow, 3).value = 'Mobile No.';
  sheet.getCell(generalStartRow, 4).value = 'STOP';

  for (let c = 1; c <= 4; c++) {
    const cell = sheet.getCell(generalStartRow, c);
    cell.font = { name: 'Calibri', size: 10, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { horizontal: c === 2 || c === 4 ? 'left' : 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  }

  // General Shift Staff
  let gRow = generalStartRow + 1;
  const genStaff = generalEmployees || [];
  genStaff.forEach((emp, idx) => {
    sheet.getCell(gRow, 1).value = idx + 1;
    sheet.getCell(gRow, 2).value = emp.name;
    sheet.getCell(gRow, 3).value = emp.phone || '';
    sheet.getCell(gRow, 4).value = emp.stopLocation || '';

    for (let c = 1; c <= 4; c++) {
      const cell = sheet.getCell(gRow, c);
      cell.alignment = { horizontal: c === 2 || c === 4 ? 'left' : 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }
    gRow++;
  });

  // Pick up timings Table (Placed on right side around col 8-12)
  const pickupStartCol = 7;
  const pickupEndCol = 10;
  const pRow = generalStartRow;

  sheet.mergeCells(pRow, pickupStartCol, pRow, pickupEndCol);
  const pTitle = sheet.getCell(pRow, pickupStartCol);
  pTitle.value = 'Pick up timings';
  pTitle.font = { name: 'Calibri', size: 10, bold: true };
  pTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  pTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  const pickupRows = [
    { label: 'A Shift: - 6.30 am' },
    { label: 'B shift: - 2.30 pm' },
    { label: 'C shift: - 9.30 pm' },
    { label: 'G shift: - 8.30 am' }
  ];

  pickupRows.forEach((item, idx) => {
    const curPRow = pRow + 1 + idx;
    sheet.mergeCells(curPRow, pickupStartCol, curPRow, pickupEndCol);
    const cell = sheet.getCell(curPRow, pickupStartCol);
    cell.value = item.label;
    cell.font = { name: 'Calibri', size: 9, bold: true };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Prepare HTTP response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="INOX-Bhandara-Monthly-Roster-${schedule.month}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { generateMonthlyExcel };
