# Factory Employee Management & Daily Shift Scheduling System

## 1. Project Overview

Build a web-based employee management system for a factory with fewer than 50 employees. A manager can maintain employee records, manually assign daily shifts, review staffing, and export the saved roster to Excel.

**Core principle:** Assign shifts once in the software, then generate the Excel sheet automatically.

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Dashboard and shift planner |
| Styling | Tailwind CSS | Responsive interface |
| Backend | Node.js + Express | Business logic and APIs |
| Database | MongoDB | Employee and schedule records |
| Excel | ExcelJS | Generate formatted `.xlsx` files |
| Authentication | JWT + bcrypt | Secure admin login |

Start with a single-factory, single-admin application. Attendance tracking, payroll, multiple managers, and employee self-service can be added later.

---

## 2. Core Features

### Employee Management
- Add, edit, search, and deactivate employees.
- Store employee ID, name, department, designation, contact details, joining date, and active status.
- Filter employees by department and active status.
- Optionally import employee records from Excel.

### Daily Shift Planner
- Select a date and view the employee roster.
- Manually assign Morning, Evening, Night, Off, or Leave.
- Save the roster as a draft and load it again later.
- Display shift totals and flag unassigned employees.
- Finalize a schedule and require an explicit reopen action for later edits.

### Excel Export
Generate a formatted `.xlsx` workbook containing:
1. Daily Roster
2. Shift Summary
3. Department Summary

### Administration and Validation
- Secure admin login.
- Prevent duplicate employee IDs and duplicate assignments within a day's roster.
- Warn about unassigned employees and understaffed shifts.
- Record important changes in an audit log.

---

## 3. System Architecture

The application follows a three-layer architecture.

```text
React + Vite Frontend
  - Dashboard
  - Employee List
  - Daily Shift Planner
  - Shift Settings
  - Reports and Excel Download
          |
          | REST API (/api)
          v
Node.js + Express Backend
  - Authentication
  - Input validation
  - Employee and shift management
  - Schedule assignment and finalization
  - ExcelJS export service
          |
          v
MongoDB Database
  - Users
  - Employees
  - Shift Types
  - Daily Schedules
  - Audit Logs
```

The browser must not connect directly to MongoDB. All database operations should go through the Express backend.

---

## 4. Database Design

Use five MongoDB collections for the first version.

### 4.1 `users`

Stores authorized factory manager accounts.

```js
{
  _id: ObjectId,
  name: "Factory Admin",
  email: "admin@example.com",
  passwordHash: "...",
  role: "admin",
  isActive: true
}
```

Security: store a password hash, never a plain-text password.

### 4.2 `employees`

Stores employee profiles.

```js
{
  _id: ObjectId,
  employeeCode: "EMP001",
  name: "Rahul Sharma",
  department: "Production",
  designation: "Operator",
  phone: "...",
  joiningDate: ISODate("2026-01-15T00:00:00Z"),
  isActive: true
}
```

Create a unique database index on `employeeCode`. Deactivating an employee should preserve historical schedules.

### 4.3 `shifts`

Stores configurable shift definitions.

```js
{
  _id: ObjectId,
  name: "Morning",
  code: "M",
  startTime: "06:00",
  endTime: "14:00",
  breakMinutes: 30,
  isActive: true
}
```

Example shifts might be Morning, Evening, and Night. Configure the actual shift timings through the settings screen rather than hardcoding them.

### 4.4 `dailySchedules`

Stores the complete roster for a date.

```js
{
  _id: ObjectId,
  date: "2026-10-12",
  status: "draft",
  assignments: [
    {
      employeeId: ObjectId,
      shiftId: ObjectId,
      status: "assigned",
      note: ""
    },
    {
      employeeId: ObjectId,
      shiftId: null,
      status: "off",
      note: "Weekly off"
    }
  ],
  createdBy: ObjectId,
  updatedAt: Date
}
```

Recommended rules:
- Maintain one schedule per factory per date.
- Normalize the schedule date consistently.
- Prevent duplicate employee assignments in one roster through server-side validation.
- Use a unique index on the schedule date for a single-factory deployment.
- Validate that referenced employees and shifts exist and are active when appropriate.

Keep all assignments for one date in one schedule document. With fewer than 50 employees, this is straightforward and allows the roster to be saved as a single unit.

**Date and timezone handling:** Standardize schedule dates to the factory's local calendar date. Interpret shift times in the factory's configured timezone, especially for shifts that cross midnight.

### 4.5 `auditLogs`

Records important changes to schedules.

```js
{
  userId: ObjectId,
  action: "SCHEDULE_UPDATED",
  scheduleId: ObjectId,
  timestamp: Date,
  details: "Updated shift assignment"
}
```

Use audit logs to track who changed a roster and when.

---

## 5. UI Plan

### Screen 1: Dashboard
Display:
- Active employee count
- Number assigned today
- Employees per shift
- Unassigned employees
- Date selector
- Quick actions for managing employees and creating a schedule

Dashboard numbers should be calculated from actual database records, not hardcoded.

### Screen 2: Employee Management
Include:
- Search by employee ID or name
- Department and active-status filters
- Add Employee
- Edit Employee
- Deactivate Employee
- Optional Excel import

Example columns: Employee ID, Name, Department, Designation, Status, Actions.

### Screen 3: Daily Shift Planner
Include:
- Date selector
- Employee list
- Department
- Shift dropdown
- Status options: Assigned, Off, Leave, and any other configured non-working status
- Notes or remarks
- Save Draft
- Finalize Schedule
- Reopen Schedule (authorized manager only)

Each employee should appear at most once in a day's roster.

### Screen 4: Shift Settings
Allow the manager to create and edit:
- Shift name and code
- Start time and end time
- Break duration
- Active status
- Optional minimum staffing requirement

### Screen 5: Reports and Excel Export
Allow the manager to select a date, preview the roster and shift counts, and download the `.xlsx` workbook.

### Screen 6: Audit Log
Show important schedule changes, the user who made them, and timestamps.

### Navigation Menu
- Dashboard
- Employees
- Daily Shift Planner
- Shift Settings
- Reports & Excel Export
- Audit Log
- Logout

---

## 6. Backend API Design

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Admin login |
| `GET` | `/api/employees` | List and filter employees |
| `POST` | `/api/employees` | Add employee |
| `PATCH` | `/api/employees/:id` | Edit employee |
| `GET` | `/api/shifts` | List configured shifts |
| `POST` | `/api/shifts` | Create a shift |
| `GET` | `/api/schedules/:date` | Load a daily roster |
| `PUT` | `/api/schedules/:date` | Save or update the roster |
| `POST` | `/api/schedules/:date/finalize` | Finalize the schedule |
| `POST` | `/api/schedules/:date/reopen` | Reopen a finalized schedule |
| `GET` | `/api/schedules/:date/export` | Download the Excel workbook |

Use `PUT` to submit the complete daily roster. Validate the entire payload on the server before saving it.

### Business Rules
1. An employee can have only one assignment per day.
2. New rosters should include active employees by default.
3. Each assignment must reference a valid shift or a valid non-working status.
4. Warn when employees are unassigned.
5. Allow drafts before finalization.
6. Prevent ordinary edits after finalization; reopening should be authorized and audited.
7. Show staffing counts and warn when a configured minimum is not met.
8. Configure rest-period and overtime checks according to factory policy rather than assuming every unusual pattern is prohibited.

---

## 7. Excel Generation with ExcelJS

Generate a workbook with three worksheets.

### Sheet 1: Daily Roster
Suggested columns:
- Employee ID
- Employee Name
- Department
- Shift
- Start Time
- End Time
- Status
- Remarks

### Sheet 2: Shift Summary
Suggested columns:
- Shift Name
- Shift Timing
- Assigned Employees
- Required Staff
- Staffing Shortage

### Sheet 3: Department Summary
Suggested columns:
- Department
- Active Employees
- Assigned
- Off
- Leave
- Unassigned

### Install Backend Packages

```bash
npm install express mongoose exceljs cors dotenv
```

### Example ExcelJS Service

Create `backend/src/services/excelService.js`.

```js
const ExcelJS = require("exceljs");

async function generateDailyRoster(schedule, res) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Factory Employee Management";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Daily Roster");

  sheet.columns = [
    { header: "Employee ID", key: "code", width: 16 },
    { header: "Employee Name", key: "name", width: 24 },
    { header: "Department", key: "department", width: 20 },
    { header: "Shift", key: "shift", width: 16 },
    { header: "Start Time", key: "start", width: 14 },
    { header: "End Time", key: "end", width: 14 },
    { header: "Status", key: "status", width: 16 },
    { header: "Remarks", key: "note", width: 25 }
  ];

  for (const assignment of schedule.assignments) {
    const employee = assignment.employeeId;
    const shift = assignment.shiftId;

    sheet.addRow({
      code: employee?.employeeCode ?? "",
      name: employee?.name ?? "",
      department: employee?.department ?? "",
      shift: shift?.name ?? "",
      start: shift?.startTime ?? "",
      end: shift?.endTime ?? "",
      status: assignment.status,
      note: assignment.note ?? ""
    });
  }

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: "A1",
    to: "H1"
  };

  // Assumes schedule.date is a valid, consistently normalized date.
  const date = new Date(schedule.date)
    .toISOString()
    .slice(0, 10);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="daily-roster-${date}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { generateDailyRoster };
```

This example assumes employee and shift references have been populated using Mongoose. The export route must authenticate the manager, validate the requested date, load the schedule, and call this function.

Before production use, add error handling, styled headers, summary worksheets, safe date formatting, and clear display of next-day end times for overnight shifts.

---

## 8. Recommended Project Folder Structure

```text
factory-employee-system/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── EmployeeForm.jsx
│       │   ├── ShiftDropdown.jsx
│       │   └── ScheduleTable.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Employees.jsx
│       │   ├── DailyPlanner.jsx
│       │   ├── ShiftSettings.jsx
│       │   └── Reports.jsx
│       ├── services/
│       │   └── api.js
│       └── App.jsx
│
└── backend/
    └── src/
        ├── models/
        │   ├── User.js
        │   ├── Employee.js
        │   ├── Shift.js
        │   ├── DailySchedule.js
        │   └── AuditLog.js
        ├── routes/
        ├── controllers/
        ├── middleware/
        ├── services/
        │   └── excelService.js
        ├── app.js
        └── server.js
```

---

## 9. Implementation Roadmap

These are target durations, not guaranteed completion times.

| Phase | Target | Deliverable |
|---|---|---|
| 1. Project setup | Days 1–2 | React, Express, MongoDB connection, environment variables, base layout |
| 2. Employee management | Days 3–4 | Employee CRUD, search, department filters, deactivation |
| 3. Daily shift planner | Days 5–7 | Date selector, roster, shift dropdowns, Off/Leave options, saving and loading |
| 4. Excel export | Days 8–9 | `.xlsx` download, formatting, filters, shift totals |
| 5. Security and validation | Days 10–12 | Admin login, authorization, duplicate prevention, staffing warnings, audit logs |
| 6. Testing and deployment | Days 13–14 | End-to-end tests, mobile-friendly UI, hosting, database backups |

Allow additional time if learning the technologies while building.

---

## 10. Pre-Launch Testing Checklist

- [ ] Add and edit employees without duplicate employee IDs.
- [ ] Assign shifts and save a daily roster.
- [ ] Show warnings for employees without assignments.
- [ ] Reject duplicate employee assignments in a daily schedule.
- [ ] Reload a saved date and verify all assignments.
- [ ] Download and open the Excel workbook successfully.
- [ ] Verify shift counts, Off/Leave statuses, and overnight shift times.
- [ ] Ensure unauthorized users cannot edit restricted data.
- [ ] Verify finalized schedules cannot be edited without reopening.
- [ ] Confirm tomorrow's roster does not modify today's roster.

---

## 11. Recommended MVP Scope

Build these four features first:

1. **Employee Master:** Add and manage fewer than 50 employees.
2. **Shift Settings:** Configure actual factory shifts and timings.
3. **Daily Planner:** Manually assign shifts, save the roster, and reopen it later.
4. **Excel Export:** Download the saved roster in a clean, printable format.

After these work reliably, add authentication, finalization, audit logs, and staffing reports. AI and automatic shift allocation are not required for the first version.

### Factory-Specific Plant Configuration (Active)

- **Total Workforce:** Exactly 11 Employees (`EMP001` to `EMP011`).
- **Configured Shifts:**
  - **Shift A:** 07:00 – 15:00 (7 AM to 3 PM) • Quota: 4 staff
  - **Shift B:** 15:00 – 22:00 (3 PM to 10 PM) • Quota: 3 staff
  - **Shift C:** 22:00 – 07:00 (10 PM to 7 AM, Overnight +1d) • Quota: 3 staff

