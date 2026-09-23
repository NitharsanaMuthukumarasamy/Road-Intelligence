import React from 'react';

export default function SeverityBadge({ severity }) {
  const styles = {
    Critical: 'bg-red-100 text-red-800 border-red-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Medium: 'bg-amber-100 text-amber-800 border-amber-300',
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  const currentStyle = styles[severity] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
        severity === 'Critical' ? 'bg-red-600' :
        severity === 'High' ? 'bg-orange-600' :
        severity === 'Medium' ? 'bg-amber-600' : 'bg-emerald-600'
      }`}></span>
      {severity || 'Unknown'}
    </span>
  );
}
