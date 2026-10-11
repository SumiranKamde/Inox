import React, { useState, useEffect } from 'react';
import { X, Clock, Save, AlertCircle } from 'lucide-react';

export default function ShiftModal({ isOpen, onClose, onSave, shift }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startTime: '06:00',
    endTime: '14:00',
    breakMinutes: 30,
    minStaffing: 6,
    color: '#2563eb',
    isActive: true
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name || '',
        code: shift.code || '',
        startTime: shift.startTime || '06:00',
        endTime: shift.endTime || '14:00',
        breakMinutes: shift.breakMinutes ?? 30,
        minStaffing: shift.minStaffing ?? 6,
        color: shift.color || '#2563eb',
        isActive: shift.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        startTime: '06:00',
        endTime: '14:00',
        breakMinutes: 30,
        minStaffing: 6,
        color: '#2563eb',
        isActive: true
      });
    }
    setError('');
  }, [shift, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.code.trim()) {
      return setError('Shift Name and Code are required.');
    }

    try {
      setSubmitting(true);
      await onSave({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        breakMinutes: Number(formData.breakMinutes),
        minStaffing: Number(formData.minStaffing)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save shift');
    } finally {
      setSubmitting(false);
    }
  };

  const isOvernight = formData.startTime > formData.endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {shift ? 'Edit Shift Configuration' : 'Configure New Plant Shift'}
              </h3>
              <p className="text-xs text-slate-400">Timings and staffing quota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Shift Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Morning Shift"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="M"
                maxLength={3}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Time (24h)</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End Time (24h)</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {isOvernight && (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-300">
              🌙 <strong>Overnight Shift:</strong> Crosses midnight (+1 calendar day). The export engine will display this tag automatically.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Break Duration (Mins)</label>
              <input
                type="number"
                min="0"
                max="180"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Min Staffing Quota</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.minStaffing}
                onChange={(e) => setFormData({ ...formData, minStaffing: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Badge Color Tag</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-slate-400 font-mono">{formData.color}</span>
            </div>
          </div>

          {shift && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="shiftActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              <label htmlFor="shiftActive" className="text-xs text-slate-300 cursor-pointer">
                Shift is currently active and assignable
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
