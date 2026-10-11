import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit3, CheckCircle2, Coffee, Users, Sun, Sunset, Moon } from 'lucide-react';
import { api } from '../services/api';
import ShiftModal from '../components/ShiftModal';

export default function ShiftSettings() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await api.getShifts();
      if (res.success) setShifts(res.data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenAdd = () => {
    setEditingShift(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (shift) => {
    setEditingShift(shift);
    setModalOpen(true);
  };

  const handleSaveShift = async (formData) => {
    if (editingShift) {
      await api.updateShift(editingShift._id, formData);
    } else {
      await api.createShift(formData);
    }
    fetchShifts();
  };

  // Convert "07:00" -> "7:00 AM", "15:00" -> "3:00 PM", "22:00" -> "10:00 PM"
  const formatAmPm = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getShiftIcon = (code) => {
    if (code === 'A') return Sun;
    if (code === 'B') return Sunset;
    return Moon;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Plant Shift Timetable
            </span>
            <span className="text-xs font-bold text-slate-300">
              3 Standard Shifts
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white tracking-tight">
            Factory Shift Timings
          </h2>
          <p className="text-xs text-slate-400">
            Current work hours and staffing requirements for Shifts A, B, and C
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Shift</span>
        </button>
      </div>

      {/* Shifts Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            Loading shifts...
          </div>
        ) : (
          shifts.map((s) => {
            const isOvernight = s.startTime > s.endTime;
            const ShiftIcon = getShiftIcon(s.code);

            return (
              <div
                key={s._id}
                className="rounded-3xl bg-slate-900 p-6 border border-slate-800 shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-md text-xl"
                        style={{ backgroundColor: s.color || '#3b82f6' }}
                      >
                        {s.code}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-white">{s.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">Shift Code: {s.code}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Edit shift timings"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Big Friendly Timing Display */}
                  <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                      <ShiftIcon className="w-3.5 h-3.5 text-blue-400" />
                      Working Hours
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {formatAmPm(s.startTime)} – {formatAmPm(s.endTime)}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      ({s.startTime} to {s.endTime} 24h)
                    </p>
                    {isOvernight && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        🌙 Night Shift (Crosses midnight to next day)
                      </span>
                    )}
                  </div>

                  {/* Quota & Break info */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block flex items-center gap-1">
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        Break Time
                      </span>
                      <span className="mt-1 font-bold text-white text-sm block">
                        {s.breakMinutes} Minutes
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        Target Staff
                      </span>
                      <span className="mt-1 font-bold text-white text-sm block">
                        {s.minStaffing} Workers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Active & Available
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ShiftModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveShift}
        shift={editingShift}
      />
    </div>
  );
}
