import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Lock, 
  Unlock, 
  Copy, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Moon,
  Sun,
  Sunset
} from 'lucide-react';
import { api } from '../services/api';

export default function DailyPlanner({ selectedDate, setSelectedDate }) {
  const [date, setDate] = useState(() => selectedDate || new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Friendly date formatting: e.g. "Sunday, 11 October 2026"
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

  const isToday = date === new Date().toISOString().slice(0, 10);

  // Quick Prev/Next day buttons
  const changeDateByDays = (days) => {
    const [y, m, d] = date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() + days);
    const formatted = target.toISOString().slice(0, 10);
    setDate(formatted);
  };

  const goToToday = () => {
    setDate(new Date().toISOString().slice(0, 10));
  };

  // Load shifts once
  useEffect(() => {
    const loadShifts = async () => {
      try {
        const res = await api.getShifts();
        if (res.success) setShifts(res.data.filter((s) => s.isActive));
      } catch (err) {
        console.error('Failed to load shifts:', err);
      }
    };
    loadShifts();
  }, []);

  // Load schedule for date
  const loadSchedule = async (targetDate) => {
    try {
      setLoading(true);
      const res = await api.getSchedule(targetDate);
      if (res.success) {
        setSchedule(res.data);
        setAssignments(res.data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule(date);
    if (setSelectedDate) setSelectedDate(date);
  }, [date]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1-Click quick assignment handler
  const handleQuickAssign = (employeeId, type, shiftObj = null) => {
    if (schedule?.status === 'finalized') {
      alert('This schedule is locked. Click "Unlock to Edit" above if you need to make changes.');
      return;
    }

    setAssignments((prev) =>
      prev.map((item) => {
        const id = item.employeeId?._id || item.employeeId;
        if (id.toString() === employeeId.toString()) {
          if (type === 'shift' && shiftObj) {
            return {
              ...item,
              shiftId: shiftObj,
              status: 'assigned'
            };
          } else if (type === 'off') {
            return {
              ...item,
              shiftId: null,
              status: 'off'
            };
          } else if (type === 'leave') {
            return {
              ...item,
              shiftId: null,
              status: 'leave'
            };
          } else if (type === 'unassigned') {
            return {
              ...item,
              shiftId: null,
              status: 'unassigned'
            };
          }
        }
        return item;
      })
    );
  };

  const handleNoteChange = (employeeId, note) => {
    if (schedule?.status === 'finalized') return;
    setAssignments((prev) =>
      prev.map((item) => {
        const id = item.employeeId?._id || item.employeeId;
        if (id.toString() === employeeId.toString()) {
          return { ...item, note };
        }
        return item;
      })
    );
  };

  // Save changes
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const payload = assignments.map((a) => ({
        employeeId: a.employeeId?._id || a.employeeId,
        shiftId: a.shiftId?._id || a.shiftId || null,
        status: a.status || 'unassigned',
        note: a.note || ''
      }));

      const res = await api.saveSchedule(date, payload);
      if (res.success) {
        setSchedule(res.data);
        setAssignments(res.data.assignments || []);
        showToast('✓ Saved! Changes are saved to database.');
      }
    } catch (err) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Lock / Finalize
  const handleFinalize = async () => {
    const unassignedCount = assignments.filter((a) => a.status === 'unassigned').length;
    if (unassignedCount > 0) {
      const ok = window.confirm(
        `Note: ${unassignedCount} worker(s) have no shift or off assigned yet. Do you still want to lock the schedule?`
      );
      if (!ok) return;
    }

    try {
      setSaving(true);
      const payload = assignments.map((a) => ({
        employeeId: a.employeeId?._id || a.employeeId,
        shiftId: a.shiftId?._id || a.shiftId || null,
        status: a.status || 'unassigned',
        note: a.note || ''
      }));
      await api.saveSchedule(date, payload);

      const res = await api.finalizeSchedule(date);
      if (res.success) {
        setSchedule(res.data);
        showToast('🔒 Schedule is now Locked for this day!');
      }
    } catch (err) {
      alert(err.message || 'Could not lock schedule');
    } finally {
      setSaving(false);
    }
  };

  // Reopen
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.reopenSchedule(date, reopenReason);
      if (res.success) {
        setShowReopenModal(false);
        setReopenReason('');
        await loadSchedule(date);
        showToast('🔓 Schedule unlocked. You can edit shifts now.');
      }
    } catch (err) {
      alert(err.message || 'Unlock failed');
    } finally {
      setSaving(false);
    }
  };

  // Copy yesterday
  const handleCopyYesterday = async () => {
    const [y, m, d] = date.split('-').map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() - 1);
    const prevDate = prev.toISOString().slice(0, 10);

    if (window.confirm(`Copy all shifts from yesterday (${formatDateFriendly(prevDate)}) to this date?`)) {
      try {
        setSaving(true);
        const res = await api.copySchedule(date, prevDate);
        if (res.success) {
          setSchedule(res.data);
          setAssignments(res.data.assignments || []);
          showToast('✓ Successfully copied yesterday\'s shift roster!');
        }
      } catch (err) {
        alert(err.message || 'Could not copy yesterday\'s shifts');
      } finally {
        setSaving(false);
      }
    }
  };

  // Live count per shift
  const shiftACount = assignments.filter((a) => a.status === 'assigned' && (a.shiftId?.code === 'A' || a.shiftId === shifts.find(s=>s.code==='A')?._id)).length;
  const shiftBCount = assignments.filter((a) => a.status === 'assigned' && (a.shiftId?.code === 'B' || a.shiftId === shifts.find(s=>s.code==='B')?._id)).length;
  const shiftCCount = assignments.filter((a) => a.status === 'assigned' && (a.shiftId?.code === 'C' || a.shiftId === shifts.find(s=>s.code==='C')?._id)).length;
  const offCount = assignments.filter((a) => a.status === 'off').length;
  const leaveCount = assignments.filter((a) => a.status === 'leave').length;
  const unassignedCount = assignments.filter((a) => a.status === 'unassigned').length;

  const isLocked = schedule?.status === 'finalized';

  const shiftA = shifts.find((s) => s.code === 'A');
  const shiftB = shifts.find((s) => s.code === 'B');
  const shiftC = shifts.find((s) => s.code === 'C');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. BIG FRIENDLY DATE SELECTOR BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date stepper */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => changeDateByDays(-1)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Yesterday</span>
          </button>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm sm:text-base font-extrabold text-white">
              {formatDateFriendly(date)}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-6 opacity-0 absolute cursor-pointer"
              title="Click to pick custom date"
            />
          </div>

          <button
            onClick={() => changeDateByDays(1)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <span className="hidden sm:inline">Tomorrow</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={goToToday}
              className="px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all border border-blue-500/30"
            >
              Today
            </button>
          )}
        </div>

        {/* Lock status indicator & main action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleCopyYesterday}
            disabled={isLocked || saving}
            title="Duplicate yesterday's shifts"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Copy className="w-4 h-4 text-blue-400" />
            <span>Copy Yesterday</span>
          </button>

          {!isLocked ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-102"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Plan'}</span>
              </button>

              <button
                onClick={handleFinalize}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title="Lock roster when completed"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Lock Schedule</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowReopenModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock to Edit</span>
            </button>
          )}

          <a
            href={api.getExportUrl(date)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-102"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel</span>
          </a>
        </div>
      </div>

      {/* 2. SIMPLE REAL-TIME HEADCOUNT COUNTER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Shift A */}
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-blue-300">Shift A</p>
              <p className="text-[11px] text-slate-400">7:00 AM – 3:00 PM</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-white">{shiftACount}</span>
            <span className="text-[11px] text-slate-400"> workers</span>
          </div>
        </div>

        {/* Shift B */}
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white">
              <Sunset className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-amber-300">Shift B</p>
              <p className="text-[11px] text-slate-400">3:00 PM – 10:00 PM</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-white">{shiftBCount}</span>
            <span className="text-[11px] text-slate-400"> workers</span>
          </div>
        </div>

        {/* Shift C */}
        <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-purple-300">Shift C (Night)</p>
              <p className="text-[11px] text-slate-400">10:00 PM – 7:00 AM</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-white">{shiftCCount}</span>
            <span className="text-[11px] text-slate-400"> workers</span>
          </div>
        </div>

        {/* Off & Leave */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-300">Rest & Off</p>
            <p className="text-[11px] text-slate-400">Weekly Off or Leave</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-slate-200">{offCount + leaveCount}</span>
            <span className="text-[11px] text-slate-400"> workers</span>
          </div>
        </div>
      </div>

      {/* Notice if unassigned */}
      {unassignedCount > 0 ? (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Attention:</strong> {unassignedCount} worker(s) do not have a shift or off-day assigned yet. Click a shift button below for each worker.
          </span>
        </div>
      ) : (
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All 11 workers are scheduled for this date! Click <strong>"Save Plan"</strong> or <strong>"Download Excel"</strong> whenever ready.</span>
        </div>
      )}

      {/* 3. SUPER SIMPLE 1-CLICK WORKER ROSTER */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-white text-sm sm:text-base">
              Factory Workers Schedule ({assignments.length} Total)
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">• Click any shift button to assign</span>
          </div>
          {isLocked && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Locked Schedule
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading workers for {formatDateFriendly(date)}...
            </div>
          ) : (
            assignments.map((assignment, index) => {
              const emp = assignment.employeeId || {};
              const empId = emp._id || assignment.employeeId;
              const currentShiftCode = assignment.status === 'assigned' && assignment.shiftId ? assignment.shiftId.code : null;
              const currentStatus = assignment.status;

              return (
                <div
                  key={empId}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  {/* Worker Name & Role */}
                  <div className="flex items-center gap-3 min-w-[260px]">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 border border-slate-700 shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm sm:text-base">{emp.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {emp.employeeCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {emp.designation} • <span className="text-slate-300">{emp.department}</span>
                      </p>
                    </div>
                  </div>

                  {/* 1-CLICK SHIFT SELECTOR BUTTONS */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Shift A Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleQuickAssign(empId, 'shift', shiftA)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentShiftCode === 'A'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-300/40 scale-102'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Shift A (7am-3pm)</span>
                    </button>

                    {/* Shift B Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleQuickAssign(empId, 'shift', shiftB)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentShiftCode === 'B'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-300/40 scale-102'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      <Sunset className="w-3.5 h-3.5" />
                      <span>Shift B (3pm-10pm)</span>
                    </button>

                    {/* Shift C Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleQuickAssign(empId, 'shift', shiftC)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentShiftCode === 'C'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300/40 scale-102'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Shift C (10pm-7am)</span>
                    </button>

                    {/* Off Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleQuickAssign(empId, 'off')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'off'
                          ? 'bg-slate-600 text-white ring-2 ring-slate-400'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                      }`}
                    >
                      Weekly Off
                    </button>

                    {/* Leave Button */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleQuickAssign(empId, 'leave')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'leave'
                          ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-amber-300 border border-slate-700/50'
                      }`}
                    >
                      On Leave
                    </button>
                  </div>

                  {/* Station / Machine Note Input */}
                  <div className="w-full lg:w-48">
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="Note: e.g. Machine 2"
                      value={assignment.note || ''}
                      onChange={(e) => handleNoteChange(empId, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Save Reminder Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>
            <strong>Simple Tip:</strong> Click the shift buttons above to assign workers, then click <strong>"Save Plan"</strong> to record.
          </span>
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={saving || isLocked}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save Plan Now'}
        </button>
      </div>

      {/* Unlock / Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 p-6 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-400" />
              Unlock Schedule to Edit
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Please enter a brief note explaining why the schedule is being edited (e.g. "Worker sick leave change"):
            </p>

            <form onSubmit={handleReopenSubmit} className="mt-4 space-y-4">
              <input
                type="text"
                placeholder="Reason for change..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                required
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                >
                  {saving ? 'Unlocking...' : 'Unlock Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
