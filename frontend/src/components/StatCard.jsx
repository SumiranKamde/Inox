import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/5'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/5'
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/5'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-5 rounded-2xl glass-card border ${scheme.border} relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-white tracking-tight">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
              {trend && <span className="font-semibold text-emerald-400">{trend}</span>}
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      
      {/* Subtle background glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${scheme.bg} blur-2xl pointer-events-none`} />
    </div>
  );
}
