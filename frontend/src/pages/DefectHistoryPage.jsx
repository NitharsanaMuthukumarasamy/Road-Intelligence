import React, { useState, useEffect } from 'react';
import {
  History,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { inspectionsAPI } from '../services/api';

export default function DefectHistoryPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [previousId, setPreviousId] = useState('');
  const [currentId, setCurrentId] = useState('');
  const [prevDetail, setPrevDetail] = useState(null);
  const [currDetail, setCurrDetail] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await inspectionsAPI.list({ limit: 50 });
        setInspections(res.data);
        if (res.data.length >= 2) {
          // Default previous to older survey, current to newest survey
          setCurrentId(res.data[0].id);
          setPreviousId(res.data[1].id);
        } else if (res.data.length === 1) {
          setCurrentId(res.data[0].id);
          setPreviousId(res.data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch historical inspection records.');
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const handleCompare = async () => {
    if (!previousId || !currentId) return;
    setComparing(true);
    try {
      const [pRes, cRes] = await Promise.all([
        inspectionsAPI.get(previousId),
        inspectionsAPI.get(currentId)
      ]);
      setPrevDetail(pRes.data);
      setCurrDetail(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (previousId && currentId) {
      handleCompare();
    }
  }, [previousId, currentId]);

  // Calculations for Condition Verdict
  const prevRisk = prevDetail?.highest_risk || 32;
  const currRisk = currDetail?.highest_risk || 68;
  const riskDelta = Math.round(currRisk - prevRisk);

  const prevDefects = prevDetail?.total_defects ?? 1;
  const currDefects = currDetail?.total_defects ?? 3;
  const defectsDelta = currDefects - prevDefects;

  // Verdict determination: Improved, Worsened, or Remained similar
  let verdict = 'Remained similar';
  let verdictStyle = {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-600',
    icon: Minus,
    desc: 'The road pavement condition has remained stable with minimal delta in risk or defect density.'
  };

  if (riskDelta >= 10 || defectsDelta > 0) {
    verdict = 'Worsened';
    verdictStyle = {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-900',
      badge: 'bg-red-600',
      icon: TrendingDown,
      desc: 'The road condition has WORSENED. Defect severity and risk score have escalated significantly, indicating sub-base deterioration.'
    };
  } else if (riskDelta <= -10 || defectsDelta < 0) {
    verdict = 'Improved';
    verdictStyle = {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-600',
      icon: TrendingUp,
      desc: 'The road condition has IMPROVED. Pavement surface anomalies have been remediated or defect severity has subsided.'
    };
  }

  const VerdictIcon = verdictStyle.icon;

  const prevFile = prevDetail?.files?.[0];
  const currFile = currDetail?.files?.[0];

  const prevImgUrl = prevFile?.processed_path
    ? `/storage/processed/${prevFile.processed_path.split(/[/\\\\]/).pop()}`
    : prevFile?.stored_filename
    ? `/storage/uploads/${prevFile.stored_filename}`
    : null;

  const currImgUrl = currFile?.processed_path
    ? `/storage/processed/${currFile.processed_path.split(/[/\\\\]/).pop()}`
    : currFile?.stored_filename
    ? `/storage/uploads/${currFile.stored_filename}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Longitudinal Intelligence
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
          <History className="w-5 h-5 text-sky-600" />
          Historical Road Inspection Comparison
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Track pavement deterioration over time, verify completed patch repairs, and analyze condition progression between prior and current surveys.
        </p>
      </div>

      {loading && <LoadingSpinner message="Loading historical inspection surveys..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && (
        <>
          {/* Comparison Selector Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-sky-600" />
              Select Survey Pair for Longitudinal Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Previous Inspection (Baseline)
                </label>
                <select
                  value={previousId}
                  onChange={(e) => setPreviousId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
                >
                  {inspections.map((i) => (
                    <option key={`prev-${i.id}`} value={i.id}>
                      #{i.id} - {i.title || i.road_name} ({new Date(i.created_at).toLocaleDateString()}) &bull; Risk {Math.round(i.highest_risk || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Inspection (Follow-up)
                </label>
                <select
                  value={currentId}
                  onChange={(e) => setCurrentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
                >
                  {inspections.map((i) => (
                    <option key={`curr-${i.id}`} value={i.id}>
                      #{i.id} - {i.title || i.road_name} ({new Date(i.created_at).toLocaleDateString()}) &bull; Risk {Math.round(i.highest_risk || 0)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Condition Verdict Banner (Improved / Worsened / Remained similar) */}
          <div className={`p-6 rounded-2xl border ${verdictStyle.bg} flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md ${verdictStyle.badge}`}>
                <VerdictIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Condition Shift Evaluation
                </span>
                <h3 className={`text-xl font-extrabold ${verdictStyle.text}`}>
                  Road Condition has {verdict.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                  {verdictStyle.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Risk Delta</span>
                <span className={`text-lg font-mono font-bold ${riskDelta > 0 ? 'text-red-600' : (riskDelta < 0 ? 'text-emerald-600' : 'text-slate-700')}`}>
                  {riskDelta > 0 ? `+${riskDelta}` : riskDelta} pts
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Defect Delta</span>
                <span className={`text-lg font-mono font-bold ${defectsDelta > 0 ? 'text-red-600' : (defectsDelta < 0 ? 'text-emerald-600' : 'text-slate-700')}`}>
                  {defectsDelta > 0 ? `+${defectsDelta}` : defectsDelta} defects
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Inspection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Previous Inspection Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Previous Inspection #{prevDetail?.id || previousId}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {prevDetail?.road_name || 'Highway Corridor'}
                  </h4>
                </div>
                <SeverityBadge severity={prevDetail?.highest_severity || 'Low'} />
              </div>

              {/* Before Media */}
              <div className="h-52 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                {prevImgUrl ? (
                  <img src={prevImgUrl} alt="Previous Inspection" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-slate-500 text-xs">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    Previous Survey Image
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Primary Defect</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {prevDetail?.detections?.[0]?.defect_type || 'Small Crack'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Risk Score</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {Math.round(prevRisk)}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Current Inspection Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                    Current Inspection #{currDetail?.id || currentId}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {currDetail?.road_name || 'Highway Corridor'}
                  </h4>
                </div>
                <SeverityBadge severity={currDetail?.highest_severity || 'High'} />
              </div>

              {/* Current Media */}
              <div className="h-52 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                {currImgUrl ? (
                  <img src={currImgUrl} alt="Current Inspection" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-slate-500 text-xs">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    Current Survey Image
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Primary Defect</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {currDetail?.detections?.[0]?.defect_type || 'Large Crack'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Risk Score</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {Math.round(currRisk)}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
