import React from 'react';
import SeverityBadge from './SeverityBadge';
import RiskBadge from './RiskBadge';
import { Crosshair } from 'lucide-react';

export default function DetectionTable({ detections = [], onSelectDefect }) {
  if (!detections || detections.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No defect anomalies identified. Road pavement appears nominal within detection confidence thresholds.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-4 py-3">#</th>
            <th scope="col" className="px-4 py-3">Defect Type</th>
            <th scope="col" className="px-4 py-3">AI Confidence</th>
            <th scope="col" className="px-4 py-3">Severity</th>
            <th scope="col" className="px-4 py-3">Risk Score</th>
            <th scope="col" className="px-4 py-3">Surface Footprint</th>
            <th scope="col" className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {detections.map((d, idx) => (
            <tr key={d.id || idx} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{idx + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-900 capitalize">
                {d.defect_type}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">
                {(d.confidence * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3">
                <SeverityBadge severity={d.severity} />
              </td>
              <td className="px-4 py-3">
                <RiskBadge score={d.risk_score} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                {d.area_ratio ? `${(d.area_ratio * 100).toFixed(2)}% of frame` : 'N/A'}
              </td>
              <td className="px-4 py-3 text-right">
                {onSelectDefect && (
                  <button
                    onClick={() => onSelectDefect(d)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 px-2 py-1 rounded"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Locate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
