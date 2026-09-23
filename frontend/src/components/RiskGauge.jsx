import React from 'react';
import { AlertOctagon, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react';

export default function RiskGauge({
  score = 0,
  level = 'Medium',
  priority = 'Planned Maintenance',
  priorityCode = 'PLANNED',
  factors = []
}) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Risk coloring & labels
  const getRiskConfig = (s) => {
    if (s >= 76) {
      return {
        level: 'Critical',
        priority: 'Immediate Action',
        code: 'IMMEDIATE',
        strokeColor: '#dc2626',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
        borderColor: 'border-red-500/30',
        badgeBg: 'bg-red-600',
        icon: AlertOctagon,
      };
    }
    if (s >= 51) {
      return {
        level: 'High',
        priority: 'Urgent Inspection',
        code: 'URGENT',
        strokeColor: '#ea580c',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-500',
        borderColor: 'border-orange-500/30',
        badgeBg: 'bg-orange-600',
        icon: AlertTriangle,
      };
    }
    if (s >= 26) {
      return {
        level: 'Medium',
        priority: 'Planned Maintenance',
        code: 'PLANNED',
        strokeColor: '#eab308',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-500',
        borderColor: 'border-yellow-500/30',
        badgeBg: 'bg-yellow-600',
        icon: TrendingUp,
      };
    }
    return {
      level: 'Low',
      priority: 'Monitor',
      code: 'MONITOR',
      strokeColor: '#10b981',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-600',
      icon: ShieldCheck,
    };
  };

  const config = getRiskConfig(normalizedScore);
  const Icon = config.icon;

  // SVG Radial Gauge Geometry
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Visual Radial Gauge */}
      <div className="flex flex-col items-center text-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-135" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="12"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Value Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={config.strokeColor}
              strokeWidth="12"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Risk Score</span>
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {normalizedScore}<span className="text-sm font-normal text-slate-400">/100</span>
            </span>
            <span className={`text-xs font-bold uppercase mt-0.5 ${config.textColor}`}>
              {config.level} Risk
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 max-w-[160px] -mt-2">
          Calculated via severity, size, frequency, and traffic exposure
        </p>
      </div>

      {/* Maintenance Priority Card */}
      <div className="flex-1 w-full space-y-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Civil Maintenance Priority
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${config.bgColor} ${config.borderColor}`}
            >
              <Icon className={`w-5 h-5 ${config.textColor}`} />
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none">
                  Priority Action
                </span>
                <span className={`text-base font-extrabold tracking-tight ${config.textColor}`}>
                  {config.code}
                </span>
              </div>
            </div>

            <div className="text-xs">
              <span className="font-bold text-slate-900 block">{config.priority}</span>
              <span className="text-slate-500">
                {config.code === 'IMMEDIATE'
                  ? 'Urgent intervention within 24 hours to prevent structural failure.'
                  : config.code === 'URGENT'
                  ? 'Field inspection within 48 hours to arrest pavement degradation.'
                  : config.code === 'PLANNED'
                  ? 'Include in standard municipal 30-day maintenance queue.'
                  : 'Monitor during next routine pavement survey cycle.'}
              </span>
            </div>
          </div>
        </div>

        {/* Factors Breakdown */}
        {factors && factors.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              Key Risk Score Contributing Factors
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              {factors.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
