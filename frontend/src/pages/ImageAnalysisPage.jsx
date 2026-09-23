import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  AlertTriangle,
  Layers,
  MapPin,
  Calendar,
  Share2,
  FileCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import DetectionTable from '../components/DetectionTable';
import AIRecommendation from '../components/AIRecommendation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { inspectionsAPI, aiAPI } from '../services/api';

export default function ImageAnalysisPage({ inspectionId }) {
  const [inspectionsList, setInspectionsList] = useState([]);
  const [selectedId, setSelectedId] = useState(inspectionId || null);
  const [inspection, setInspection] = useState(null);
  const [activeImageTab, setActiveImageTab] = useState('annotated'); // 'annotated' or 'original' or 'side-by-side'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Explain with AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await inspectionsAPI.list({ limit: 30 });
        const imageInsps = res.data.filter((i) => i.media_type === 'image');
        setInspectionsList(imageInsps);
        if (!selectedId && imageInsps.length > 0) {
          setSelectedId(imageInsps[0].id);
        }
      } catch (err) {
        setError('Failed to fetch inspections list.');
      }
    };
    fetchList();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      return;
    }
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      setAiError(null);
      try {
        const res = await inspectionsAPI.get(selectedId);
        setInspection(res.data);
        if (res.data.recommendations && res.data.recommendations.length > 0) {
          setActiveRecommendation(res.data.recommendations[0]);
        } else {
          setActiveRecommendation(null);
        }
      } catch (err) {
        setError('Failed to load inspection analysis details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  const handleExplainWithAI = async () => {
    if (!inspection) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const topDet = inspection.detections && inspection.detections.length > 0
        ? inspection.detections[0]
        : { defect_type: 'Pothole', confidence: 0.9, severity: inspection.highest_severity, risk_score: inspection.highest_risk };

      const res = await aiAPI.explainDefect({
        defect_type: topDet.defect_type,
        severity: inspection.highest_severity || 'Medium',
        risk_score: inspection.highest_risk || 50.0,
        confidence: topDet.confidence || 0.85,
        area_ratio: topDet.area_ratio || 0.05,
        road_importance: 'Medium',
        location_context: `${inspection.road_name || 'Highway'}, ${inspection.district || 'Metro'}`,
      });

      setActiveRecommendation(res.data);
    } catch (err) {
      setAiError(err.response?.data?.detail || 'OpenRouter service call failed; using cached recommendations.');
    } finally {
      setAiLoading(false);
    }
  };

  const originalFile = inspection?.files?.[0];
  const originalUrl = originalFile?.stored_filename ? `/storage/uploads/${originalFile.stored_filename}` : null;
  const annotatedUrl = originalFile?.processed_path ? `/storage/processed/${originalFile.processed_path.split(/[/\\\\]/).pop()}` : null;

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-sky-600" />
            Image Defect Analysis & Damage Boxing
          </h2>
          <p className="text-xs text-slate-500">
            Side-by-side inspection of road surface imagery, YOLO bounding boxes, and AI civil engineering triage.
          </p>
        </div>

        {/* Inspection Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Select Survey:</label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-xs truncate"
          >
            {inspectionsList.map((i) => (
              <option key={i.id} value={i.id}>
                #{i.id} - {i.title} ({i.highest_severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner message="Retrieving high-resolution road imagery and detection boxes..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && inspection && (
        <>
          {/* Metadata Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Corridor</span>
              <p className="text-sm font-bold text-slate-900 truncate">{inspection.road_name || 'State Corridor'}</p>
              <p className="text-xs text-slate-500">{inspection.road_segment_name || 'Segment-01'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Location GPS</span>
              <p className="text-xs font-mono text-slate-800 mt-1">
                {inspection.latitude ? `${inspection.latitude.toFixed(4)}, ${inspection.longitude.toFixed(4)}` : 'Manual Mark'}
              </p>
              <p className="text-xs text-slate-500">{inspection.district}, {inspection.city}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Defect Summary</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {inspection.total_defects} Defect{inspection.total_defects === 1 ? '' : 's'} Identified
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <SeverityBadge severity={inspection.highest_severity} />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Risk Evaluation</span>
              <div className="mt-1">
                <RiskBadge score={inspection.highest_risk} priority={inspection.priority} />
              </div>
            </div>
          </div>

          {/* Visual Display Tabs (Annotated vs Original vs Side-by-Side) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveImageTab('annotated')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeImageTab === 'annotated'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  AI Boxed Damage View
                </button>
                <button
                  onClick={() => setActiveImageTab('original')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeImageTab === 'original'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Original Road Image
                </button>
                <button
                  onClick={() => setActiveImageTab('side-by-side')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeImageTab === 'side-by-side'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Side-by-Side Comparison
                </button>
              </div>

              {/* Explain with AI Action */}
              <button
                onClick={handleExplainWithAI}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Consulting OpenRouter AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Images Container */}
            <div className="rounded-lg overflow-hidden bg-slate-900 border border-slate-800 p-2">
              {activeImageTab === 'side-by-side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 mb-1 px-1 flex items-center justify-between">
                      <span>ORIGINAL SOURCE CAPTURE</span>
                      <span>RAW</span>
                    </div>
                    {originalUrl ? (
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="w-full h-80 object-contain rounded bg-slate-950"
                      />
                    ) : (
                      <div className="h-80 flex items-center justify-center text-slate-500 text-xs">No raw media</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-sky-400 mb-1 px-1 flex items-center justify-between">
                      <span>AI DETECTED & DAMAGE BOXED</span>
                      <span>HIGHLIGHTED</span>
                    </div>
                    {annotatedUrl ? (
                      <img
                        src={annotatedUrl}
                        alt="AI Boxed Damage"
                        className="w-full h-80 object-contain rounded bg-slate-950"
                      />
                    ) : (
                      <div className="h-80 flex items-center justify-center text-slate-500 text-xs">Awaiting processing output</div>
                    )}
                  </div>
                </div>
              ) : activeImageTab === 'annotated' ? (
                <div className="flex flex-col items-center">
                  <div className="w-full text-[11px] font-mono text-sky-400 mb-1 px-2 flex items-center justify-between">
                    <span>AUTOMATIC DAMAGE BOXING & TELEMETRY</span>
                    <span>YOLO OVERLAY</span>
                  </div>
                  {annotatedUrl ? (
                    <img
                      src={annotatedUrl}
                      alt="AI Boxed Damage"
                      className="w-full max-h-[500px] object-contain rounded bg-slate-950"
                    />
                  ) : (
                    <div className="h-96 flex items-center justify-center text-slate-500 text-xs">No annotated image</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-full text-[11px] font-mono text-slate-400 mb-1 px-2 flex items-center justify-between">
                    <span>UNPROCESSED SOURCE IMAGE</span>
                    <span>ORIGINAL</span>
                  </div>
                  {originalUrl ? (
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="w-full max-h-[500px] object-contain rounded bg-slate-950"
                    />
                  ) : (
                    <div className="h-96 flex items-center justify-center text-slate-500 text-xs">No source image</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Detections Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Defect Detection Inventory & Geometries</h3>
            <DetectionTable detections={inspection.detections} />
          </div>

          {/* AI Recommendation Section */}
          <div className="space-y-3">
            {aiError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                {aiError}
              </div>
            )}
            <AIRecommendation recommendation={activeRecommendation} />
          </div>
        </>
      )}
    </div>
  );
}
