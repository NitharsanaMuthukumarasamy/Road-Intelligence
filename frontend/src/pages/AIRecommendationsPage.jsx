import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, Sliders, Info, ShieldAlert, CheckSquare } from 'lucide-react';
import AIRecommendation from '../components/AIRecommendation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { aiAPI, inspectionsAPI } from '../services/api';

export default function AIRecommendationsPage() {
  const [inspections, setInspections] = useState([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Custom advisory query fields
  const [defectType, setDefectType] = useState('Pothole');
  const [severity, setSeverity] = useState('High');
  const [riskScore, setRiskScore] = useState(74);
  const [confidence, setConfidence] = useState(0.88);
  const [roadImportance, setRoadImportance] = useState('High');
  const [hasWater, setHasWater] = useState(false);
  const [locationContext, setLocationContext] = useState('Highway Arterial Corridor Near Interchange');

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await inspectionsAPI.list({ limit: 30 });
        setInspections(res.data);
        if (res.data.length > 0) {
          handleSelectInspection(res.data[0]);
        }
      } catch (err) {
        console.warn('Failed to load surveys:', err);
      }
    };
    fetchInspections();
  }, []);

  const handleSelectInspection = async (insp) => {
    setSelectedInspectionId(insp.id);
    setSelectedInspection(insp);
    setDefectType('Pothole');
    setSeverity(insp.highest_severity || 'High');
    setRiskScore(insp.highest_risk || 65);
    setLocationContext(`${insp.road_name || 'Highway'}, ${insp.district || 'City Zone'}`);

    if (insp.recommendations && insp.recommendations.length > 0) {
      setRecommendation(insp.recommendations[0]);
    } else {
      // Trigger AI recommendation
      generateAIAdvisory(insp.highest_severity, insp.highest_risk, `${insp.road_name}, ${insp.district}`);
    }
  };

  const generateAIAdvisory = async (sev = severity, risk = riskScore, loc = locationContext) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiAPI.recommendAction({
        defect_type: defectType,
        severity: sev,
        risk_score: Number(risk),
        confidence: Number(confidence),
        road_importance: roadImportance,
        has_water: hasWater,
        location_context: loc,
      });
      setRecommendation(res.data);
    } catch (err) {
      setError('AI advisory formulation failed. Rule-based recommendations will be served.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              OpenRouter AI Pavement Maintenance Advisory Console
            </h2>
            <p className="text-xs text-slate-500">
              Structured generative intelligence synthesizing pavement condition metrics into certified maintenance actions.
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Defect Parameters & Corridor Context
          </h3>

          {/* Survey Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Existing Survey</label>
            <select
              value={selectedInspectionId}
              onChange={(e) => {
                const found = inspections.find((i) => i.id === Number(e.target.value));
                if (found) handleSelectInspection(found);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {inspections.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.id} - {i.title} ({i.highest_severity})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Type</label>
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Pothole">Pothole (Cavity Depression)</option>
                <option value="Crack">Crack (Longitudinal / Transverse)</option>
                <option value="Alligator Crack">Alligator Fatigue Webbing</option>
                <option value="Water Accumulation">Water Accumulation / Ponding</option>
                <option value="Damaged Surface">Damaged Surface / Rutting</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={riskScore}
                  onChange={(e) => setRiskScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Road Importance</label>
              <select
                value={roadImportance}
                onChange={(e) => setRoadImportance(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="High">High (Expressway / Arterial)</option>
                <option value="Medium">Medium (Major City Road)</option>
                <option value="Low">Low (Local Street)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location Context</label>
              <input
                type="text"
                value={locationContext}
                onChange={(e) => setLocationContext(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasWater}
                onChange={(e) => setHasWater(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Standing water accumulation present</span>
            </label>

            <button
              onClick={() => generateAIAdvisory()}
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Engineering AI Advice...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate AI Recommendation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-800">Formulating Civil Engineering Recommendation...</p>
              <p className="text-xs text-slate-500">Contacting OpenRouter API with prompt constraints and schema validation.</p>
            </div>
          ) : (
            <AIRecommendation recommendation={recommendation} />
          )}
        </div>
      </div>
    </div>
  );
}
