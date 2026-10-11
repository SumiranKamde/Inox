const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const monthlyScheduleRoutes = require('./routes/monthlyScheduleRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/monthly-schedules', monthlyScheduleRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Factory Shift Scheduling API', timestamp: new Date() });
});

// Serve built frontend assets if dist folder exists
const path = require('path');
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
