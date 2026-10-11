import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import MonthlyPlanner from './pages/MonthlyPlanner';
import DailyPlanner from './pages/DailyPlanner';
import Employees from './pages/Employees';
import ShiftSettings from './pages/ShiftSettings';
import Reports from './pages/Reports';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => api.getCurrentUser());
  // Default to 'monthly' so user sees the Bhandara plant monthly schedule immediately
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(() => '2026-10-11');

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('monthly');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-3 sm:px-6 py-6">
        {activeTab === 'monthly' && <MonthlyPlanner />}

        {activeTab === 'planner' && (
          <DailyPlanner
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {activeTab === 'employees' && <Employees />}

        {activeTab === 'shifts' && <ShiftSettings />}

        {activeTab === 'reports' && (
          <Reports
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}
      </main>

      <footer className="py-5 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>INOX AIR PRODUCTS PVT LTD. BHANDARA • Monthly Shift Scheduling System</p>
      </footer>
    </div>
  );
}
