import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  X,
  Zap,
  MousePointerClick,
  BarChart2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Shift cycle order for 1-click toggle: Empty -> A -> B -> C -> G -> W/O -> L -> OD -> Empty
const SHIFT_CYCLE = {
  '': 'A',
  'A': 'B',
  'B': 'C',
  'C': 'G',
  'G': 'W/O',
  'W/O': 'L',
  'L': 'OD',
  'OD': ''
};
import { api } from '../services/api';

// Detect repeating cycle length from a shift array (tries 7, 14, 21, 28)
function detectCycle(arr) {
  for (const len of [7, 14, 21, 28]) {
    if (arr.length < len) continue;
    const isRepeat = arr.every((v, i) => v === arr[i % len]);
    if (isRepeat) return len;
  }
  return arr.length; // fallback: use full array as one cycle
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHIFTS = [
  { code: 'A',   label: 'A  (7:00 AM – 3:00 PM)',    bg: 'bg-blue-600',    text: 'text-white' },
  { code: 'B',   label: 'B  (3:00 PM – 10:00 PM)',   bg: 'bg-amber-500',   text: 'text-white' },
  { code: 'C',   label: 'C  (10:00 PM – 7:00 AM)',   bg: 'bg-purple-600',  text: 'text-white' },
  { code: 'G',   label: 'G  (8:30 AM – 5:00 PM)',    bg: 'bg-emerald-600', text: 'text-white' },
  { code: 'W/O', label: 'W/O  Weekly Off',            bg: 'bg-slate-600',   text: 'text-slate-100' },
  { code: 'L',   label: 'L  Leave',                  bg: 'bg-rose-600',    text: 'text-white' },
  { code: 'OD',  label: 'OD  On Duty / Tour',        bg: 'bg-cyan-600',    text: 'text-white' },
  { code: '',    label: '—  Clear / Empty',           bg: 'bg-slate-800',   text: 'text-slate-400' },
];

function shiftBadge(val) {
  switch (val) {
    case 'A':   return 'bg-blue-600 text-white font-bold shadow-sm';
    case 'B':   return 'bg-amber-500 text-white font-bold shadow-sm';
    case 'C':   return 'bg-purple-600 text-white font-bold shadow-sm';
    case 'G':   return 'bg-emerald-600 text-white font-bold shadow-sm';
    case 'W/O': return 'bg-slate-700 text-slate-200 font-bold';
    case 'L':   return 'bg-rose-600 text-white font-bold shadow-sm';
    case 'OD':  return 'bg-cyan-600 text-white font-bold shadow-sm';
    default:    return 'text-transparent hover:bg-slate-800/40 rounded';
  }
}

export default function MonthlyPlanner() {
  const [month, setMonth] = useState('2026-10');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [toast, setToast]     = useState('');
  const [activeCell, setActiveCell] = useState(null); // { empIndex, day }
  const [activeRow,  setActiveRow]  = useState(null); // empIndex — fill whole row
  const [activeCol,  setActiveCol]  = useState(null); // day string — fill whole column
  const [oneClickMode, setOneClickMode] = useState('cycle'); // 'cycle' | 'A' | 'B' | 'C' | 'W/O' | '' | 'menu'
  const [showTotals, setShowTotals] = useState(false); // Collapsible totals row

  const [yr, mo] = month.split('-').map(Number);
  const daysInMonth  = new Date(yr, mo, 0).getDate();
  const monthLabel   = `${MONTH_NAMES[mo - 1]} ${yr}`;

  // Previous month label (for button text)
  const prevMo = mo === 1 ? 12 : mo - 1;
  const prevYr = mo === 1 ? yr - 1 : yr;
  const prevMonth = `${prevYr}-${String(prevMo).padStart(2, '0')}`;
  const prevMonthLabel = MONTH_NAMES[prevMo - 1];
  const daysInPrevMonth = new Date(prevYr, prevMo, 0).getDate();

  // ── load ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.getMonthlySchedule(month);
        if (res.success) setAssignments(res.data.assignments || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [month]);

  // ── helpers ───────────────────────────────────────────
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const changeMonth = (delta) => {
    let y = yr, m = mo + delta;
    if (m > 12) { y++; m = 1; }
    if (m < 1)  { y--; m = 12; }
    setMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const assignShift = (code) => {
    if (!activeCell) return;
    const { empIndex, day } = activeCell;
    setAssignments(prev => {
      const next = [...prev];
      const item = { ...next[empIndex], days: { ...next[empIndex].days, [day]: code } };
      next[empIndex] = item;
      return next;
    });
    setActiveCell(null);
  };

  // ── 1-CLICK CELL HANDLER ──────────────────────────────
  const handleCellClick = (empIdx, day) => {
    if (oneClickMode === 'menu') {
      setActiveCell({ empIndex: empIdx, day: String(day) });
      return;
    }

    setAssignments(prev => {
      const next = [...prev];
      const item = { ...next[empIdx] };
      const currentVal = item.days?.[String(day)] || '';
      const newVal = oneClickMode === 'cycle'
        ? (SHIFT_CYCLE[currentVal] ?? 'A')
        : oneClickMode;
      next[empIdx] = {
        ...item,
        days: { ...item.days, [String(day)]: newVal }
      };
      return next;
    });
  };

  const handleClearAll = () => {
    if (!window.confirm(`Clear ALL shift assignments for ${monthLabel}? This cannot be undone.`)) return;
    setAssignments(prev =>
      prev.map(item => {
        const days = {};
        for (let d = 1; d <= daysInMonth; d++) days[String(d)] = '';
        return { ...item, days };
      })
    );
    showToast('All fields cleared ✓');
  };

  // ── Predict from previous month ────────────────────────
  const handlePredict = async () => {
    setPredicting(true);
    try {
      const res = await api.getMonthlySchedule(prevMonth);
      if (!res.success || !res.data?.assignments?.length) {
        alert(`No schedule data found for ${prevMonthLabel}. Please save that month first.`);
        return;
      }

      const prevAssignments = res.data.assignments;

      setAssignments(prev => prev.map((item, idx) => {
        // Match employee by ID
        const empId = item.employeeId?._id || item.employeeId;
        const prevItem = prevAssignments.find(p => {
          const pid = p.employeeId?._id || p.employeeId;
          return String(pid) === String(empId);
        }) || prevAssignments[idx];

        if (!prevItem?.days) return item;

        // Build prev month shift array (1-indexed → 0-indexed)
        const prevArr = [];
        for (let d = 1; d <= daysInPrevMonth; d++) {
          prevArr.push(prevItem.days[String(d)] ?? '');
        }

        // ── Find the ONE weekday most frequently used as W/O in prev month ──
        // Count how many times each weekday (0=Sun…6=Sat) had W/O
        const woCount = {}; // { weekday: count }
        for (let d = 1; d <= daysInPrevMonth; d++) {
          if ((prevItem.days[String(d)] ?? '') === 'W/O') {
            const wd = new Date(prevYr, prevMo - 1, d).getDay();
            woCount[wd] = (woCount[wd] || 0) + 1;
          }
        }

        // Pick the single weekday with the highest count (one W/O per week)
        const woWeekday = Object.entries(woCount).length
          ? parseInt(Object.entries(woCount).sort((a, b) => b[1] - a[1])[0][0])
          : -1; // -1 means no W/O pattern found

        // Detect repeating cycle inside prev month data
        const cycleLen = detectCycle(prevArr);
        const cycle = prevArr.slice(0, cycleLen);

        // Fill current month: exactly ONE weekday gets W/O; cycle fills the rest
        const days = {};
        for (let d = 1; d <= daysInMonth; d++) {
          const existingVal = item.days?.[String(d)];
          if (existingVal) {
            // Keep any cell already filled manually
            days[String(d)] = existingVal;
          } else {
            const weekday = new Date(yr, mo - 1, d).getDay();
            if (woWeekday !== -1 && weekday === woWeekday) {
              // This weekday is the employee's fixed W/O day
              days[String(d)] = 'W/O';
            } else {
              // Continue the shift cycle from where prev month ended
              const pos = (daysInPrevMonth + d - 1) % cycleLen;
              const predicted = cycle[pos] ?? '';
              // Never put W/O on a non-W/O day from the cycle continuation
              days[String(d)] = predicted === 'W/O' ? '' : predicted;
            }
          }
        }

        return { ...item, days };
      }));

      showToast(`✓ Predicted from ${prevMonthLabel} — review and save when ready`);
    } catch (e) {
      alert('Failed to load previous month: ' + e.message);
    } finally {
      setPredicting(false);
    }
  };

  // ── Fill entire ROW (one employee, all days) ───────────────
  const handleFillRow = (code) => {
    if (activeRow === null) return;
    setAssignments(prev => {
      const next = [...prev];
      const item = { ...next[activeRow] };
      const days = {};
      for (let d = 1; d <= daysInMonth; d++) {
        // Keep W/O on its weekday if clearing to a shift, else overwrite everything
        days[String(d)] = code;
      }
      next[activeRow] = { ...item, days };
      return next;
    });
    setActiveRow(null);
    showToast(`Row filled with "${code || '—'}" ✓`);
  };

  // ── Fill entire COLUMN (one day, all employees) ──────────────
  const handleFillCol = (code) => {
    if (activeCol === null) return;
    setAssignments(prev =>
      prev.map(item => ({
        ...item,
        days: { ...item.days, [activeCol]: code }
      }))
    );
    setActiveCol(null);
    showToast(`Day ${activeCol} set to "${code || '—'}" for all employees ✓`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.saveMonthlySchedule(month, assignments, 'finalized');
      if (res.success) showToast('Schedule saved ✓');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const dayTotal = (day, code) =>
    assignments.filter(a => (a.days?.[String(day)] || '') === code).length;

  // ── render ────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {/* ── UNIFIED MINIMAL CONTROL BAR ── */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">

        {/* 1. Month Picker & Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-white px-2.5 min-w-[120px] text-center select-none">
              {monthLabel}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden xl:block">
            <h1 className="text-xs font-bold text-white leading-tight">Monthly Schedule</h1>
            <p className="text-[10px] text-slate-400 leading-tight">Bhandara Plant</p>
          </div>
        </div>

        {/* 2. 1-Click Shift Selector (Simple Segmented Control) */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setOneClickMode('cycle')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              oneClickMode === 'cycle'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Clicking any cell cycles: A → B → C → W/O → Clear"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Cycle</span>
          </button>

          {[
            { code: 'A', bg: 'bg-blue-600 text-white' },
            { code: 'B', bg: 'bg-amber-500 text-white' },
            { code: 'C', bg: 'bg-purple-600 text-white' },
            { code: 'G', label: 'G', bg: 'bg-emerald-600 text-white' },
            { code: 'W/O', bg: 'bg-slate-700 text-white' },
            { code: 'L', label: 'L', bg: 'bg-rose-600 text-white' },
            { code: 'OD', label: 'OD', bg: 'bg-cyan-600 text-white' },
            { code: '', label: 'Clear', bg: 'bg-rose-900/70 text-rose-200' },
          ].map(m => (
            <button
              key={m.code || 'clear'}
              onClick={() => setOneClickMode(m.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                oneClickMode === m.code
                  ? `${m.bg} shadow-sm`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={m.label === 'Clear' ? 'Click any cell to clear' : `Click any cell to set "${m.code}"`}
            >
              {m.label || m.code}
            </button>
          ))}
        </div>

        {/* 3. Primary & Secondary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePredict}
            disabled={predicting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-slate-700 hover:border-violet-700 transition-all disabled:opacity-50"
            title={`Fill from ${prevMonthLabel}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fill from</span> {prevMonthLabel}
          </button>

          <a
            href={api.getMonthlyExportUrl(month)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 border border-slate-700 hover:border-emerald-700 transition-all"
            title="Download Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </a>

          <button
            onClick={handleClearAll}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all"
            title="Clear all assignments for this month"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving…' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-auto max-h-[72vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="text-center border-collapse text-xs select-none" style={{ minWidth: 'max-content' }}>

            {/* ── HEADER ── */}
            <thead className="sticky top-0 z-30">
              {/* Row 1 – day numbers */}
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold">
                <th className="sticky left-0 z-40 bg-slate-950 w-9 min-w-[36px] px-1 py-2 border-r border-slate-800 text-slate-500 font-mono">#</th>
                <th className="sticky left-9 z-40 bg-slate-950 w-44 min-w-[176px] px-3 py-2 text-left border-r-2 border-slate-700 text-white">Employee Name</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const isSun = new Date(yr, mo - 1, d).getDay() === 0;
                  return (
                    <th
                      key={d}
                      onClick={() => setActiveCol(String(d))}
                      title={`Fill all employees on Day ${d}`}
                      className={`w-8 min-w-[32px] px-0 py-2 border-r border-slate-800 font-mono cursor-pointer hover:bg-blue-600/30 hover:text-white transition-colors ${isSun ? 'text-rose-400 bg-rose-950/30' : ''}`}
                    >
                      {d}
                    </th>
                  );
                })}
              </tr>

              {/* Row 2 – day abbreviations */}
              <tr className="bg-slate-950 border-b-2 border-slate-700 text-[10px] font-extrabold text-slate-500">
                <th className="sticky left-0 z-40 bg-slate-950 border-r border-slate-800" />
                <th className="sticky left-9 z-40 bg-slate-950 px-3 py-1 text-left border-r-2 border-slate-700 text-blue-400 font-mono text-[11px] uppercase">
                  {monthLabel}
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const isSun = new Date(yr, mo - 1, d).getDay() === 0;
                  return (
                    <th key={d} className={`py-1 border-r border-slate-800 font-mono ${isSun ? 'text-rose-400 bg-rose-950/30' : ''}`}>
                      {DAY_ABBR[new Date(yr, mo - 1, d).getDay()]}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* ── BODY ── */}
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={2 + daysInMonth} className="py-16 text-slate-400 text-sm">
                    Loading {monthLabel}…
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={2 + daysInMonth} className="py-16 text-slate-500 text-sm">
                    No employees found.
                  </td>
                </tr>
              ) : (
                assignments.map((item, empIdx) => {
                  const emp = item.employeeId || {};
                  return (
                    <tr key={emp._id || empIdx} className="hover:bg-slate-800/30 transition-colors">

                      {/* Serial No */}
                      <td className="sticky left-0 z-20 bg-slate-900 w-9 min-w-[36px] px-1 py-1.5 border-r border-slate-800 font-mono text-slate-500">
                        {empIdx + 1}
                      </td>

                      {/* Name — click to fill entire row */}
                      <td
                        onClick={() => setActiveRow(empIdx)}
                        title="Click to fill entire month row"
                        className="sticky left-9 z-20 bg-slate-900 w-44 min-w-[176px] px-3 py-1.5 text-left font-semibold text-white whitespace-nowrap border-r-2 border-slate-700 text-xs cursor-pointer hover:text-blue-300 hover:bg-slate-800/60 transition-colors group"
                      >
                        <span className="flex items-center gap-1.5">
                          {emp.name}
                          <span className="opacity-0 group-hover:opacity-60 text-[9px] text-blue-400 font-normal">▶ fill row</span>
                        </span>
                      </td>

                      {/* Day cells */}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                        const val = item.days?.[String(d)] ?? '';
                        const isSun = new Date(yr, mo - 1, d).getDay() === 0;
                        return (
                          <td
                            key={d}
                            onClick={() => handleCellClick(empIdx, d)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveCell({ empIndex: empIdx, day: String(d) });
                            }}
                            title={`Day ${d}: ${val || 'Empty'} (Click to change · Right-click for menu)`}
                            className={`p-0.5 border-r border-slate-800/60 cursor-pointer hover:scale-110 hover:z-10 transition-transform ${isSun ? 'bg-slate-950/40' : ''}`}
                          >
                            <span className={`inline-flex items-center justify-center w-7 h-6 rounded text-[10px] font-bold font-mono ${shiftBadge(val)}`}>
                              {val || ''}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* ── FOOTER TOTALS (COLLAPSIBLE) ── */}
            {showTotals && !loading && assignments.length > 0 && (
              <tfoot className="bg-slate-950 border-t-2 border-slate-700 text-[10px] font-bold sticky bottom-0 z-20">
                {[
                  { code: 'A',   label: 'Shift A',      color: 'text-blue-400' },
                  { code: 'B',   label: 'Shift B',      color: 'text-amber-400' },
                  { code: 'C',   label: 'Shift C',      color: 'text-purple-400' },
                  { code: 'G',   label: 'General G',    color: 'text-emerald-400' },
                  { code: 'W/O', label: 'Weekly Off',   color: 'text-slate-400' },
                  { code: 'L',   label: 'Leave (L)',    color: 'text-rose-400' },
                  { code: 'OD',  label: 'On Duty (OD)', color: 'text-cyan-400' },
                ].map(({ code, label, color }) => (
                  <tr key={code}>
                    <td colSpan={2} className={`sticky left-0 bg-slate-950 text-right pr-3 py-1.5 ${color} font-black border-r-2 border-slate-700`}>
                      {label}
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                      <td key={d} className={`py-1 border-r border-slate-800 font-mono ${color}`}>
                        {dayTotal(d, code) || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── BOTTOM BAR: TOTALS TOGGLE + MINIMAL LEGEND ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
        <button
          onClick={() => setShowTotals(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
          <span>{showTotals ? 'Hide Daily Shift Counts' : 'Show Daily Shift Counts'}</span>
          {showTotals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Minimal clean legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block shadow-sm" /> A (7-3)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block shadow-sm" /> B (3-10)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block shadow-sm" /> C (10-7)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block shadow-sm" /> G (General)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> W/O (Off)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block shadow-sm" /> L (Leave)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block shadow-sm" /> OD (Duty)</span>
          <span className="text-slate-500 hidden xl:inline">· Click cell to cycle · Right-click for menu</span>
        </div>
      </div>

      {/* ── SHIFT PICKER MODAL ── */}
      {activeCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveCell(null)}
        >
          <div
            className="w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Assign shift for</p>
                <p className="text-sm font-black text-white leading-tight">
                  {assignments[activeCell.empIndex]?.employeeId?.name || 'Worker'}
                </p>
                <p className="text-[11px] text-blue-400 font-mono">
                  Day {activeCell.day} · {monthLabel}
                </p>
              </div>
              <button onClick={() => setActiveCell(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shift buttons */}
            <div className="p-3 grid grid-cols-1 gap-1.5">
              {SHIFTS.map(s => (
                <button
                  key={s.code}
                  onClick={() => assignShift(s.code)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] ${s.bg} ${s.text}`}
                >
                  <span className="font-mono text-base w-8 text-left">{s.code || '—'}</span>
                  <span className="text-xs font-medium">{s.label.split('  ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ROW FILL MODAL (click employee name) ── */}
      {activeRow !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveRow(null)}
        >
          <div
            className="w-72 rounded-2xl bg-slate-900 border border-violet-700 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-violet-900/30">
              <div>
                <p className="text-[10px] font-bold uppercase text-violet-300 tracking-widest">Fill Entire Month Row</p>
                <p className="text-sm font-black text-white leading-tight mt-0.5">
                  {assignments[activeRow]?.employeeId?.name || 'Employee'}
                </p>
                <p className="text-[11px] text-violet-400 font-mono">All {daysInMonth} days → {monthLabel}</p>
              </div>
              <button onClick={() => setActiveRow(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-1 gap-1.5">
              {SHIFTS.map(s => (
                <button
                  key={s.code}
                  onClick={() => handleFillRow(s.code)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] ${s.bg} ${s.text}`}
                >
                  <span className="font-mono text-base w-8 text-left">{s.code || '—'}</span>
                  <span className="text-xs font-medium">{s.label.split('  ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COLUMN FILL MODAL (click day number in header) ── */}
      {activeCol !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveCol(null)}
        >
          <div
            className="w-72 rounded-2xl bg-slate-900 border border-blue-700 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-blue-900/30">
              <div>
                <p className="text-[10px] font-bold uppercase text-blue-300 tracking-widest">Fill Entire Day Column</p>
                <p className="text-sm font-black text-white leading-tight mt-0.5">
                  Day {activeCol} · {DAY_ABBR[new Date(yr, mo - 1, parseInt(activeCol)).getDay()]}
                </p>
                <p className="text-[11px] text-blue-400 font-mono">All {assignments.length} employees → this day</p>
              </div>
              <button onClick={() => setActiveCol(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-1 gap-1.5">
              {SHIFTS.map(s => (
                <button
                  key={s.code}
                  onClick={() => handleFillCol(s.code)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02] ${s.bg} ${s.text}`}
                >
                  <span className="font-mono text-base w-8 text-left">{s.code || '—'}</span>
                  <span className="text-xs font-medium">{s.label.split('  ')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
