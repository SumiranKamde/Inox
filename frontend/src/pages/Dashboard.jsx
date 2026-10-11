import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarRange, 
  UserCheck, 
  UserX, 
  Coffee, 
  PlaneTakeoff, 
  ArrowUpRight, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';

export default function Dashboard({ setActiveTab, setSelectedDate }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (selectedDate) => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats(selectedDate);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(date);
  }, [date]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (setSelectedDate) setSelectedDate(newDate);
  };

  const handleOpenPlanner = () => {
    if (setSelectedDate) setSelectedDate(date);
    setActiveTab('planner');
  };

  const handleExport = () => {
    window.open(api.getExportUrl(date), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Date Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Operations Control
            </span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase border ${
              stats?.scheduleStatus === 'finalized'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : stats?.scheduleStatus === 'draft'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
            }`}>
              {stats?.scheduleStatus ? `Roster ${stats.scheduleStatus}` : 'No Roster'}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-white tracking-tight">
            Factory Shift Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time daily roster metrics, plant shift quotas, and attendance breakdown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">
            <Calendar className="w-4 h-4 text-blue-400" />
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="bg-transparent text-sm text-white focus:outline-none"
            />
          </div>

          <button
            onClick={handleOpenPlanner}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>Open Planner</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Warnings & Alerts */}
      {stats?.unassignedToday > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="font-semibold text-white">Staffing Notice:</strong> {stats.unassignedToday} active employee(s) have not been assigned a shift or rest status for this date.
            </div>
          </div>
          <button
            onClick={handleOpenPlanner}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition-colors"
          >
            Assign Now
          </button>
        </div>
      )}

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Workforce"
          value={loading ? '...' : stats?.totalActiveEmployees || 0}
          subtitle={`Across ${stats?.totalDepartments || 0} plant departments`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Assigned to Shifts"
          value={loading ? '...' : stats?.assignedToday || 0}
          subtitle={`${stats ? Math.round((stats.assignedToday / (stats.totalActiveEmployees || 1)) * 100) : 0}% scheduled to work`}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Scheduled Off / Leave"
          value={loading ? '...' : (stats?.offToday || 0) + (stats?.leaveToday || 0)}
          subtitle={`${stats?.offToday || 0} Weekly Off • ${stats?.leaveToday || 0} Approved Leave`}
          icon={Coffee}
          color="purple"
        />
        <StatCard
          title="Unassigned Staff"
          value={loading ? '...' : stats?.unassignedToday || 0}
          subtitle={stats?.unassignedToday === 0 ? 'All employees accounted for' : 'Pending shift allocation'}
          icon={UserX}
          color={stats?.unassignedToday > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Shift Breakdown Grid */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Shift Headcount & Staffing Balance</h3>
          </div>
          <button
            onClick={() => setActiveTab('shifts')}
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Configure Shifts
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats?.shiftStats?.map((s) => {
            const diff = s.count - s.minStaffing;
            const isShortage = diff < 0;
            const isOvernight = s.startTime > s.endTime;

            return (
              <div 
                key={s.code} 
                className="p-5 rounded-2xl glass-card border border-slate-800 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: s.color || '#3b82f6' }}
                    />
                    <h4 className="font-bold text-sm text-white">{s.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300">
                    {s.code}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mb-4">
                  {s.startTime} - {s.endTime} {isOvernight && <span className="text-purple-400">(+1d)</span>}
                </p>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Assigned Staff:</span>
                    <span className="text-2xl font-black text-white">{s.count}</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isShortage ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((s.count / (s.minStaffing || 1)) * 100))}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Target: {s.minStaffing}</span>
                    <span className={`font-semibold ${isShortage ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isShortage ? `${diff} Shortage` : `+${diff} OK`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={handleOpenPlanner}
          className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <CalendarRange className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <h4 className="mt-4 font-bold text-white text-sm">Assign Daily Roster</h4>
          <p className="mt-1 text-xs text-slate-400">
            Open the full employee grid for {date} and allocate morning, evening or night shifts.
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('employees')}
          className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Users className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <h4 className="mt-4 font-bold text-white text-sm">Manage Employee Master</h4>
          <p className="mt-1 text-xs text-slate-400">
            Add workers, update departments, manage designations, or deactivate staff records.
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('reports')}
          className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
          <h4 className="mt-4 font-bold text-white text-sm">Export & Print Rosters</h4>
          <p className="mt-1 text-xs text-slate-400">
            Generate 3-sheet Excel spreadsheets formatted for plant noticeboards and management reports.
          </p>
        </div>
      </div>
    </div>
  );
}
