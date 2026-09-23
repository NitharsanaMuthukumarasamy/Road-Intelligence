import React from 'react';

export default function DashboardCard({ title, value, subtitle, icon, color = 'sky', trend }) {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value ?? '-'}</h3>
        </div>
        <div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.sky}`}>
          {icon}
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>{subtitle}</span>
          {trend && <span className="font-semibold text-sky-600">{trend}</span>}
        </div>
      )}
    </div>
  );
}
