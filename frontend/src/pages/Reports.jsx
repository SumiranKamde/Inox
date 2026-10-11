import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  Layers, 
  Building2,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function Reports({ selectedDate, setSelectedDate }) {
  const [date, setDate] = useState(() => selectedDate || new Date().toISOString().slice(0, 10));
  const [activeSubTab, setActiveSubTab] = useState('roster'); // roster | shifts | depts
  const [schedule, setSchedule] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduleAndShifts = async (targetDate) => {
    try {
      setLoading(true);
      const [schedRes, shiftRes] = await Promise.all([
        api.getSchedule(targetDate),
        api.getShifts()
      ]);
      if (schedRes.success) setSchedule(schedRes.data);
      if (shiftRes.success) setShifts(shiftRes.data);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleAndShifts(date);
    if (setSelectedDate) setSelectedDate(date);
  }, [date]);

  const formatDateFriendly = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const changeDateByDays = (days) => {
    const [y, m, d] = date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() + days);
    setDate(target.toISOString().slice(0, 10));
  };

  const assignments = schedule?.assignments || [];

  const shiftStats = shifts.map((s) => {
    const assignedCount = assignments.filter(
      (a) => a.status === 'assigned' && a.shiftId && (a.shiftId._id || a.shiftId).toString() === s._id.toString()
    ).length;
    const diff = assignedCount - (s.minStaffing || 0);
    return {
      ...s,
      assignedCount,
      diff
    };
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

  const exportUrl = api.getExportUrl(date);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Big Download Button */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Ready to Download
            </span>
            <span className="text-xs text-slate-400 font-mono">
              3 Sheets Included
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white tracking-tight">
            Download Factory Excel Roster
          </h2>
          <p className="text-xs text-slate-400">
            Generate clean, ready-to-print .xlsx workbook for the factory noticeboard or management
          </p>
        </div>

        {/* Big Download Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-950 border border-slate-700 w-full sm:w-auto justify-center">
            <button 
              onClick={() => changeDateByDays(-1)} 
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-white px-2">
              {formatDateFriendly(date)}
            </span>
            <button 
              onClick={() => changeDateByDays(1)} 
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <a
            href={exportUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-102"
          >
            <Download className="w-5 h-5" />
            <span>Download Excel Sheet</span>
          </a>
        </div>
      </div>

      {/* Sheet Preview Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'roster'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sheet 1: Worker Roster ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('shifts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'shifts'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sheet 2: Shift Headcount</span>
        </button>

        <button
          onClick={() => setActiveSubTab('depts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'depts'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Sheet 3: Department Summary</span>
        </button>
      </div>

      {/* Sheet 1: Daily Roster */}
      {activeSubTab === 'roster' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Worker Name</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Assigned Shift</th>
                  <th className="px-5 py-3.5">Hours</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Station Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignments.map((a, i) => {
                  const emp = a.employeeId || {};
                  const shift = a.shiftId || null;
                  return (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-5 py-3 font-mono font-bold text-blue-400">
                        {emp.employeeCode}
                      </td>
                      <td className="px-5 py-3 font-bold text-white">
                        {emp.name}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {emp.department}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {emp.designation}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-200">
                        {shift ? `${shift.name} (${shift.code})` : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {shift ? `${shift.startTime} – ${shift.endTime}` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'assigned'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : a.status === 'off'
                            ? 'bg-slate-700/50 text-slate-300'
                            : a.status === 'leave'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 italic">
                        {a.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sheet 2: Shift Headcount */}
      {activeSubTab === 'shifts' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Shift</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Timings</th>
                  <th className="px-5 py-3.5">Assigned Workers</th>
                  <th className="px-5 py-3.5">Required Target</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shiftStats.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-300">{s.code}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">{s.startTime} – {s.endTime}</td>
                    <td className="px-5 py-3.5 text-base font-black text-white">{s.assignedCount}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold">{s.minStaffing}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-400">
                      ✓ OK ({s.assignedCount} on duty)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sheet 3: Department Summary */}
      {activeSubTab === 'depts' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Total Workers</th>
                  <th className="px-5 py-3.5">On Duty (Shift)</th>
                  <th className="px-5 py-3.5">Weekly Off</th>
                  <th className="px-5 py-3.5">On Leave</th>
                  <th className="px-5 py-3.5">Unassigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(deptStats).map(([dept, stats]) => (
                  <tr key={dept} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-bold text-white">{dept}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-300">{stats.total}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-black">{stats.assigned}</td>
                    <td className="px-5 py-3.5 text-slate-400">{stats.off}</td>
                    <td className="px-5 py-3.5 text-amber-400">{stats.leave}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-500">{stats.unassigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
