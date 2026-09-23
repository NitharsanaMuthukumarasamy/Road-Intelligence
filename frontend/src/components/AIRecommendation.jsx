import React from 'react';
import { Sparkles, ShieldAlert, Wrench, CheckSquare, Info } from 'lucide-react';

export default function AIRecommendation({ recommendation }) {
  if (!recommendation) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
        No maintenance recommendation generated yet. Click "Explain with AI" to formulate an advisory dossier.
      </div>
    );
  }

  const {
    source = 'Rule-Based Fallback',
    explanation,
    risk_factors = [],
    maintenance_recommendation,
    urgency = 'Within 7 Days',
    inspection_checklist = [],
    disclaimer
  } = recommendation;

  const isOpenRouter = source.includes('OpenRouter');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-5">
      {/* Header with Source & Urgency */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isOpenRouter ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Engineering Recommendation</h3>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
              isOpenRouter ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Source: {source}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block uppercase font-medium">Recommended Urgency</span>
          <span className={`inline-block font-bold text-sm px-2.5 py-1 rounded-full border ${
            urgency === 'Immediate' ? 'bg-red-50 text-red-700 border-red-200' :
            urgency === 'Within 48 Hours' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {urgency}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-sky-600" />
          Civil Engineering Rationale
        </h4>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          {explanation}
        </p>
      </div>

      {/* Recommended Action */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-emerald-600" />
          Intervention Strategy & Material Specifications
        </h4>
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 font-medium leading-relaxed">
          {maintenance_recommendation}
        </div>
      </div>

      {/* Risk Factors */}
      {risk_factors.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Key Risk Drivers
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {risk_factors.map((rf, i) => (
              <li key={i} className="flex items-start gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                <span>{rf}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inspection Checklist */}
      {inspection_checklist.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-sky-600" />
            Field Verification Protocol
          </h4>
          <div className="space-y-1.5">
            {inspection_checklist.map((item, i) => (
              <label key={i} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                <span className="text-xs text-slate-700">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-400 italic pt-3 border-t border-slate-100">
        {disclaimer || 'Project-defined heuristic evaluation. Not a substitute for certified on-site structural engineering verification.'}
      </p>
    </div>
  );
}
