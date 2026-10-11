import React from 'react';
import { 
  Calendar, 
  CalendarRange, 
  Users, 
  Clock, 
  FileSpreadsheet, 
  LogOut, 
  Factory
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const navItems = [
    { id: 'monthly', label: 'Monthly Schedule', subtitle: 'October 2026 Roster', icon: Calendar },
    { id: 'planner', label: 'Daily Planner', subtitle: 'Single Day View', icon: CalendarRange },
    { id: 'employees', label: 'Staff Directory', subtitle: 'Workers & Bus Stops', icon: Users },
    { id: 'shifts', label: 'Shift Timings', subtitle: 'A, B, C, G Hours', icon: Clock },
    { id: 'reports', label: 'Download Excel', subtitle: 'Ready to Print', icon: FileSpreadsheet }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Company Title */}
          <div 
            onClick={() => setActiveTab('monthly')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white group-hover:scale-105 transition-transform">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">INOX AIR PRODUCTS</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  Bhandara Plant
                </span>
              </div>
              <p className="text-xs text-slate-400">Monthly Shift Scheduling System</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <div className="text-left">
                    <p className="leading-none">{item.label}</p>
                    <p className={`text-[10px] mt-0.5 leading-none ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white">{user?.name || 'Plant Supervisor'}</p>
              <p className="text-[11px] text-emerald-400 font-medium">Bhandara Plant</p>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
