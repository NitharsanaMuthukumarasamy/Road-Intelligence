import React from 'react';

export default function RiskBadge({ score, priority }) {
  const numScore = Math.round(Number(score) || 0);

  let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let progressColor = 'bg-emerald-500';

  if (numScore >= 76) {
    badgeColor = 'text-red-700 bg-red-50 border-red-200';
    progressColor = 'bg-red-600';
  } else if (numScore >= 51) {
    badgeColor = 'text-orange-700 bg-orange-50 border-orange-200';
    progressColor = 'bg-orange-500';
  } else if (numScore >= 26) {
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
    progressColor = 'bg-amber-500';
  }

  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className={`inline-flex items-center justify-between px-2 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>
        <span>{numScore}/100</span>
        {priority && <span className="text-[10px] font-medium uppercase tracking-wider ml-1">({priority})</span>}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${Math.min(100, Math.max(5, numScore))}%` }}
        ></div>
      </div>
    </div>
  );
}
