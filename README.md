# Factory Employee Management & Daily Shift Scheduling System

An enterprise-ready, web-based employee management and daily shift scheduling system engineered specifically for plant and factory operations.

---

## 🚀 System Architecture

- **Frontend:** React 19 + Vite 8, Tailwind CSS, Lucide Icons (Dark industrial plant dashboard theme).
- **Backend:** Node.js + Express REST API with JWT authorization, validation, and audit logging.
- **Database:** MongoDB (Local or Atlas) storing Users, Employees, Shifts, Daily Schedules, and Audit Logs.
- **Excel Service:** ExcelJS multi-sheet formatted workbook generator (Daily Roster, Shift Headcount Summary, Department Distribution).

---

## 🔑 Default Administrator Credentials

- **Email:** `admin@inox.com`
- **Password:** `admin123`

---

## 📦 Folder Structure

```text
e:\Inox_Emp/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── controllers/     # Auth, Employees, Shifts, Schedules, Audit
│   │   ├── middleware/      # JWT authentication middleware
│   │   ├── models/          # Mongoose models (User, Employee, Shift, DailySchedule, AuditLog)
│   │   ├── routes/          # REST endpoints
│   │   ├── seed/            # Starter database seeder (30 employees, 4 shifts, today's schedule)
│   │   ├── services/        # ExcelJS 3-worksheet generator
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server listener
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, StatCard, EmployeeModal, ShiftModal
│   │   ├── pages/           # Login, Dashboard, Employees, DailyPlanner, ShiftSettings, Reports, AuditLog
│   │   ├── services/        # Frontend API client
│   │   ├── App.jsx          # Main application router & state
│   │   ├── index.css        # Tailwind directives & dark theme styling
│   │   └── main.jsx
│   ├── vite.config.js       # Vite build + backend proxy config
│   ├── tailwind.config.js
│   └── package.json
│
├── data/
│   └── db/                  # Local MongoDB storage
├── start.bat                # One-click startup script for Windows
├── package.json             # Root workspace scripts
└── README.md
```

---

## 🛠️ Quick Start Instructions

### Option 1: One-Click Startup (Windows)
Double-click [`start.bat`](file:///e:/Inox_Emp/start.bat) to launch the MongoDB service, Backend API, and Vite Frontend automatically.

### Option 2: Manual Terminal Startup

1. **Start MongoDB:**
   ```powershell
   & "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "e:\Inox_Emp\data\db" --bind_ip 127.0.0.1 --port 27017
   ```

2. **Start Backend Server (Port 5000):**
   ```powershell
   cd e:\Inox_Emp\backend
   npm start
   ```

3. **Start Frontend Dev Server (Port 5173):**
   ```powershell
   cd e:\Inox_Emp\frontend
   npm run dev
   ```

4. **Access Application:**
   Open browser at [http://localhost:5173](http://localhost:5173).

---

## 📋 Features Overview

1. **Dashboard:** Live workforce headcount, shift balances, shortage alerts, and quick actions.
2. **Employee Master:** Complete CRUD with search, department filtering, phone, designation, and active/deactivated toggling.
3. **Daily Shift Planner:**
   - Date picker for any past or future day.
   - Interactive roster grid with shift allocation (Morning, Evening, Night, General).
   - Non-working statuses (Weekly Off, Approved Leave, Unassigned).
   - Station / machine notes per worker.
   - **One-click "Copy Yesterday"** to duplicate previous day's shift patterns.
   - **Batch department assignment** to assign an entire department to a shift in 1 click.
   - **Draft vs. Finalized** state machine with formal reopen reason logging.
4. **Shift Timings & Quotas:** Configurable shifts with start/end times, midnight crossing handling (+1 day), break durations, minimum staffing targets, and color tags.
5. **Reports & Excel Export:** Real-time preview and instant download of the 3-sheet `.xlsx` workbook formatted with header banners, auto-filters, and frozen panes.
6. **Audit Trail:** Immutable logging of schedule modifications, finalizations, re-openings, and employee updates.
