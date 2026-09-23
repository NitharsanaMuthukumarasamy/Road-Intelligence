import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function JobStatus({ status, progress, stepMessage }) {
  const statusConfig = {
    queued: {
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />,
      label: 'Queued',
    },
    processing: {
      color: 'bg-sky-50 text-sky-700 border-sky-300',
      icon: <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />,
      label: 'Processing',
    },
    completed: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      label: 'Completed',
    },
    failed: {
      color: 'bg-red-50 text-red-700 border-red-300',
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
      label: 'Failed',
    },
  };

  const conf = statusConfig[status] || statusConfig.queued;
  const pct = Math.round(Number(progress) || (status === 'completed' ? 100 : 0));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.color}`}>
          {conf.icon}
          {conf.label}
        </span>
        {status === 'processing' && (
          <span className="text-xs font-mono text-sky-700 font-bold">{pct}%</span>
        )}
      </div>

      {status === 'processing' && (
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(8, pct)}%` }}
          ></div>
        </div>
      )}

      {stepMessage && (
        <p className="text-[11px] text-slate-500 truncate" title={stepMessage}>
          {stepMessage}
        </p>
      )}
    </div>
  );
}
