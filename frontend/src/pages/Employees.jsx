import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit3, 
  UserCheck, 
  UserX, 
  Phone, 
  Building, 
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import EmployeeModal from '../components/EmployeeModal';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDept !== 'all') params.department = selectedDept;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;

      const [empRes, deptRes] = await Promise.all([
        api.getEmployees(params),
        api.getDepartments()
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setModalOpen(true);
  };

  const handleSaveEmployee = async (formData) => {
    if (editingEmployee) {
      await api.updateEmployee(editingEmployee._id, formData);
    } else {
      await api.createEmployee(formData);
    }
    fetchEmployees();
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = !emp.isActive;
    const actionText = newStatus ? 'activate' : 'deactivate';
    if (window.confirm(`Are you sure you want to ${actionText} ${emp.name}?`)) {
      try {
        await api.updateEmployee(emp._id, { isActive: newStatus });
        fetchEmployees();
      } catch (err) {
        alert(err.message || 'Status update failed');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Workforce Directory
            </span>
            <span className="text-xs font-bold text-slate-300">
              {employees.length} Total Workers
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white tracking-tight">
            Factory Workers
          </h2>
          <p className="text-xs text-slate-400">
            View worker details, phone numbers, departments, or add new staff
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Worker</span>
        </button>
      </div>

      {/* Simple Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <button
            onClick={fetchEmployees}
            title="Refresh List"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Worker List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading worker list...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No workers found.
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp._id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {emp.employeeCode}
                    </span>
                    <h3 className="font-bold text-white text-base">{emp.name}</h3>
                  </div>
                  {emp.isActive ? (
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                      DEACTIVATED
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-slate-300 font-medium">
                    {emp.designation}
                  </p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{emp.department}</span>
                  </p>
                  {emp.phone && (
                    <p className="text-slate-400 flex items-center gap-1.5 font-mono pt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{emp.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(emp)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                    emp.isActive
                      ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {emp.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
        departments={departments}
      />
    </div>
  );
}
