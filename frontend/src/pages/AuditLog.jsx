import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, RefreshCw, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(100);
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('FINALIZED')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('REOPENED')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (action.includes('SAVED') || action.includes('COPIED')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
    if (action.includes('EMPLOYEE')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
    return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Security & Compliance
            </span>
            <span className="text-xs text-slate-400">
              Immutable System Events
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-white tracking-tight">
            Plant Operations Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            Chronological audit log tracking roster changes, unlocked schedules, and employee master edits
          </p>
        </div>

        <button
          onClick={fetchLogs}
          title="Refresh Logs"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target Date</th>
                <th className="px-5 py-3.5">Operator</th>
                <th className="px-5 py-3.5">Details & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const user = log.userId || {};
                  const dateStr = new Date(log.createdAt).toLocaleString();
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/20">
                      <td className="px-5 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-blue-400">
                        {log.targetDate || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white">
                        {user.name || 'System Admin'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
