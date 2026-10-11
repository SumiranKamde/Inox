import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';

export default function EmployeeModal({ isOpen, onClose, onSave, employee, departments }) {
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    department: '',
    designation: '',
    phone: '',
    isActive: true
  });
  const [customDept, setCustomDept] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode || '',
        name: employee.name || '',
        department: employee.department || '',
        designation: employee.designation || '',
        phone: employee.phone || '',
        isActive: employee.isActive ?? true
      });
      setCustomDept('');
    } else {
      setFormData({
        employeeCode: '',
        name: '',
        department: departments?.[0] || 'Production',
        designation: '',
        phone: '',
        isActive: true
      });
      setCustomDept('');
    }
    setError('');
  }, [employee, departments, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalDept = formData.department === '__new__' ? customDept.trim() : formData.department.trim();

    if (!formData.employeeCode.trim()) {
      return setError('Employee ID / Code is required.');
    }
    if (!formData.name.trim()) {
      return setError('Full name is required.');
    }
    if (!finalDept) {
      return setError('Department is required.');
    }
    if (!formData.designation.trim()) {
      return setError('Designation / Role is required.');
    }

    try {
      setSubmitting(true);
      await onSave({
        ...formData,
        employeeCode: formData.employeeCode.trim().toUpperCase(),
        department: finalDept
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {employee ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {employee ? 'Edit Employee Details' : 'Add New Factory Employee'}
              </h3>
              <p className="text-xs text-slate-400">Master employee directory</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Employee ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. EMP035"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="10-digit phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Manoj Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Department <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {departments?.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="__new__">+ Add New Department...</option>
            </select>
            {formData.department === '__new__' && (
              <input
                type="text"
                placeholder="Type new department name"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-blue-500 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Designation / Role <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Machine Operator, QA Inspector"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {employee && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-xs text-slate-300 cursor-pointer">
                Employee is currently active in factory
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
