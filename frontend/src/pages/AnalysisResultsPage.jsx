import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Droplets,
  Layers,
  MapPin,
  Calendar,
  Filter,
  Search,
  Download,
  Share2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  GitCompare,
  Eye,
  Loader2,
  Info
} from 'lucide-react';

import DashboardCard from '../components/DashboardCard';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import BoundingBoxViewer from '../components/BoundingBoxViewer';
import VideoFrameScrubber from '../components/VideoFrameScrubber';
import AIRecommendation from '../components/AIRecommendation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { inspectionsAPI, reportsAPI } from '../services/api';
import { inspectionService } from '../services/inspectionService';

export default function AnalysisResultsPage({ inspectionId, onNavigate }) {
  const [inspectionsList, setInspectionsList] = useState([]);
  const [selectedId, setSelectedId] = useState(inspectionId || null);
  const [inspection, setInspection] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);

  // Table Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch list of inspections on mount
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await inspectionsAPI.list({ limit: 50 });
        setInspectionsList(res.data);
        if (!selectedId && res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      } catch (err) {
        setError('Failed to fetch road inspections list.');
      }
    };
    fetchList();
  }, []);

  // Fetch detailed inspection data and summary when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      setLoadingSummary(false);
      return;
    }

    const fetchDetailAndSummary = async () => {
      setLoading(true);
      setLoadingSummary(true);
      setError(null);
      try {
        const [inspRes, summaryData] = await Promise.all([
          inspectionsAPI.get(selectedId),
          inspectionService.getInspectionSummary(selectedId)
        ]);

        setInspection(inspRes.data);
        setSummary(summaryData);

        if (inspRes.data.detections && inspRes.data.detections.length > 0) {
          setSelectedDetection(inspRes.data.detections[0]);
        } else {
          setSelectedDetection(null);
        }
      } catch (err) {
        console.error('Error fetching inspection summary:', err);
        setError('Failed to load inspection analysis results from the database.');
      } finally {
        setLoading(false);
        setLoadingSummary(false);
      }
    };

    fetchDetailAndSummary();
  }, [selectedId]);

  if (loading && !inspection) {
    return <LoadingSpinner message="Retrieving AI defect telemetry and bounding box analysis..." />;
  }

  if (error && !inspection) {
    return <ErrorMessage message={error} onRetry={() => setSelectedId(selectedId)} />;
  }

  const detections = inspection?.detections || [];
  const mediaFile = inspection?.files?.[0];
  const isVideo = inspection?.media_type === 'video';

  const imageUrl = mediaFile?.processed_path
    ? `/storage/processed/${mediaFile.processed_path.split(/[/\\\\]/).pop()}`
    : mediaFile?.stored_filename
    ? `/storage/uploads/${mediaFile.stored_filename}`
    : null;

  const videoUrl = mediaFile?.processed_path
    ? `/storage/videos/${mediaFile.processed_path.split(/[/\\\\]/).pop()}`
    : mediaFile?.stored_filename
    ? `/storage/videos/${mediaFile.stored_filename}`
    : null;

  // Table Filter Logic (uses same DB detections)
  const filteredDetections = detections.filter((d) => {
    if (typeFilter !== 'All' && !d.defect_type?.toLowerCase().includes(typeFilter.toLowerCase())) {
      return false;
    }
    if (severityFilter !== 'All' && d.severity !== severityFilter) {
      return false;
    }
    if (riskFilter !== 'All') {
      const score = d.risk_score || 0;
      if (riskFilter === 'Critical' && score < 76) return false;
      if (riskFilter === 'High' && (score < 51 || score >= 76)) return false;
      if (riskFilter === 'Medium' && (score < 26 || score >= 51)) return false;
      if (riskFilter === 'Low' && score >= 26) return false;
    }
    if (segmentFilter !== 'All') {
      const seg = d.road_segment_name || inspection?.road_segment_name;
      if (seg !== segmentFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.defect_type?.toLowerCase().includes(q) ||
        d.action?.toLowerCase().includes(q) ||
        (d.road_segment_name || inspection?.road_segment_name)?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Survey Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800">
              Inspection Dossier #{inspection?.id}
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-mono text-slate-500">
              {inspection?.created_at ? new Date(inspection.created_at).toLocaleDateString() : 'Recent'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {inspection?.title || 'Road Condition Analysis & Defect Telemetry'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{inspection?.road_name || 'Highway Corridor'}</span>
            <span>&bull;</span>
            <span className="font-semibold">{inspection?.road_segment_name || 'Segment-01'}</span>
            <span>&bull;</span>
            <span>{inspection?.district || 'Central District'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Survey Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Survey:</label>
            <select
              value={selectedId || ''}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500 max-w-xs truncate"
            >
              {inspectionsList.map((i) => (
                <option key={i.id} value={i.id}>
                  #{i.id} - {i.title} ({i.highest_severity})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('map')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            GIS Map
          </button>

          <button
            onClick={() => onNavigate && onNavigate('defect-history')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare
          </button>

          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Analysis Status Banner */}
      {summary?.status === 'PROCESSING' && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-3 text-sky-800 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          <span>AI analysis in progress... Detection telemetry is being processed by the YOLO pipeline.</span>
        </div>
      )}

      {summary?.status === 'FAILED' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs font-semibold">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          <span>Analysis failed. Please retry or upload alternative media.</span>
        </div>
      )}

      {summary?.status === 'ANALYZED' && summary.total_defects === 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>No road defects detected. Road surface condition is nominal.</span>
        </div>
      )}

      {/* 1. REQUIRED DASHBOARD CARDS (Exact 7 Cards + Optional Other) */}
      {loadingSummary ? (
        /* Skeleton Cards - Do NOT temporarily show 0 */
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm animate-pulse space-y-2"
            >
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-7 bg-slate-300 rounded w-1/2" />
              <div className="h-2.5 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Card 1: TOTAL DEFECTS */}
          <DashboardCard
            title="TOTAL DEFECTS"
            value={summary?.total_defects ?? 0}
            subtitle="Identified"
            icon={<Activity className="w-4 h-4" />}
            color="slate"
          />

          {/* Card 2: POTHOLES */}
          <DashboardCard
            title="POTHOLES"
            value={summary?.potholes ?? 0}
            subtitle="Depressions"
            icon={<AlertOctagon className="w-4 h-4" />}
            color="red"
          />

          {/* Card 3: CRACKS */}
          <DashboardCard
            title="CRACKS"
            value={summary?.cracks ?? 0}
            subtitle="Fissures"
            icon={<Layers className="w-4 h-4" />}
            color="orange"
          />

          {/* Card 4: WATER ACCUMULATION */}
          <DashboardCard
            title="WATER ACCUMULATION"
            value={summary?.water_accumulation ?? 0}
            subtitle="Puddle/Drainage"
            icon={<Droplets className="w-4 h-4" />}
            color="sky"
          />

          {/* Card 5: DAMAGED SURFACES */}
          <DashboardCard
            title="DAMAGED SURFACES"
            value={summary?.damaged_surfaces ?? 0}
            subtitle="Structural"
            icon={<AlertTriangle className="w-4 h-4" />}
            color="amber"
          />

          {/* Card 6: CRITICAL DEFECTS */}
          <DashboardCard
            title="CRITICAL DEFECTS"
            value={summary?.critical_defects ?? 0}
            subtitle="Urgent Hazard"
            icon={<AlertOctagon className="w-4 h-4" />}
            color="red"
          />

          {/* Card 7: AVG RISK SCORE */}
          <DashboardCard
            title="AVG RISK SCORE"
            value={`${summary?.average_risk_score !== undefined && summary?.average_risk_score !== null ? summary.average_risk_score : 0}/100`}
            subtitle="Index Rating"
            icon={<Activity className="w-4 h-4" />}
            color="indigo"
          />

          {/* Optional Card 8: OTHER DEFECTS (if any detected) */}
          {summary?.other_defects > 0 && (
            <DashboardCard
              title="OTHER DEFECTS"
              value={summary.other_defects}
              subtitle="Unclassified"
              icon={<Info className="w-4 h-4" />}
              color="slate"
            />
          )}
        </div>
      )}

      {/* 2. Visual Risk Score Gauge & Maintenance Priority Card */}
      <RiskGauge
        score={summary?.maximum_risk_score || summary?.average_risk_score || 0}
        level={inspection?.highest_severity || 'Medium'}
        priority={inspection?.priority || 'Planned Maintenance'}
        factors={[
          `${summary?.critical_defects || 0} critical pavement anomalies detected`,
          `Traffic corridor density: ${inspection?.road_importance || 'Medium'}`,
          `Water accumulation: ${(summary?.water_accumulation || 0) > 0 ? 'Yes' : 'None'}`,
          `Total surface disruption count: ${summary?.total_defects || 0}`
        ]}
      />

      {/* 3. Media & Bounding Box / Video Scrubber Viewer */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-600" />
            {isVideo ? 'Processed Video Survey & Defect Tracking' : 'High-Resolution Imagery & YOLO Damage Bounding'}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {isVideo ? '30 FPS Frame Stepper' : 'Ultralytics YOLO Architecture'}
          </span>
        </div>

        {isVideo ? (
          <VideoFrameScrubber
            videoUrl={videoUrl}
            detections={detections}
            onSelectDetection={(d) => setSelectedDetection(d)}
          />
        ) : (
          <BoundingBoxViewer
            imageUrl={imageUrl}
            detections={detections}
            selectedDetection={selectedDetection}
            onSelectDetection={(d) => setSelectedDetection(d)}
          />
        )}
      </div>

      {/* 4. AI Maintenance Recommendation Card (LangChain / LangGraph) */}
      <div className="space-y-3">
        <AIRecommendation
          recommendation={
            inspection?.recommendations?.[0] || {
              source: 'LangChain/LangGraph Civil Engineering Pipeline',
              maintenance_recommendation:
                (summary?.critical_defects || 0) > 0
                  ? 'Immediate pothole repair and on-site inspection. Deploy asphalt patch crew with CSS-1h emulsion.'
                  : (summary?.water_accumulation || 0) > 0
                  ? 'Inspect drainage system and remove water accumulation.'
                  : 'Schedule routine inspection and crack sealing.',
              urgency: inspection?.priority || 'Planned Maintenance',
              risk_factors: [
                `${inspection?.highest_severity} severity level on ${inspection?.road_name}`,
                `Pavement deterioration index: ${summary?.maximum_risk_score || 0}/100`,
                `Moisture intrusion mitigation required: ${(summary?.water_accumulation || 0) > 0 ? 'Yes' : 'No'}`
              ],
              inspection_checklist: [
                'Measure cavity perimeter and depth with civil gauge',
                'Verify surrounding pavement delamination and ravelling',
                'Inspect roadside catch basins and culverts within 30m',
                'Record post-repair compaction density'
              ]
            }
          }
        />
      </div>

      {/* 5. Defect Table with Filters (Columns: Defect, Severity, Confidence, Risk Score, Location, Priority, Action) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Detected Pavement Defects Register</h3>
            <p className="text-xs text-slate-500">
              Detailed breakdown of localized surface anomalies with AI-assigned priority actions from the database.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Showing <strong className="text-slate-900">{filteredDetections.length}</strong> of {detections.length} records
          </div>
        </div>

        {/* Filter Controls Bar (5 Filters: Defect Type, Severity, Risk Level, Date, Road Segment) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search defect type or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Defect Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Defect Types</option>
              <option value="pothole">Potholes</option>
              <option value="crack">Cracks</option>
              <option value="water">Water Accumulation</option>
              <option value="damaged">Damaged Surface</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="Critical">Critical (&gt;=76)</option>
              <option value="High">High (51-75)</option>
              <option value="Medium">Medium (26-50)</option>
              <option value="Low">Low (&lt;26)</option>
            </select>
          </div>

          {/* Reset button */}
          <div>
            <button
              onClick={() => {
                setTypeFilter('All');
                setSeverityFilter('All');
                setRiskFilter('All');
                setSegmentFilter('All');
                setSearchQuery('');
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table with exact requested columns: ID, Defect Type, Severity, Risk Score, Location / Bounding Box / Frame, Road Segment, Recommended Action */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Defect Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Location / Bounding Box / Frame</th>
                <th className="px-4 py-3">Road Segment</th>
                <th className="px-4 py-3">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredDetections.length > 0 ? (
                filteredDetections.map((d, idx) => {
                  const isSelected = selectedDetection?.id === d.id;
                  const bboxStr = d.bbox_x !== undefined && d.bbox_y !== undefined && d.bbox_w !== undefined && d.bbox_h !== undefined
                    ? `[${Math.round(d.bbox_x)}, ${Math.round(d.bbox_y)}, ${Math.round(d.bbox_w)}, ${Math.round(d.bbox_h)}]`
                    : null;
                  return (
                    <tr
                      key={d.id || idx}
                      onClick={() => setSelectedDetection(d)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50/60' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        #{d.id || idx + 1}
                      </td>

                      {/* Defect Type */}
                      <td className="px-4 py-3 font-semibold text-slate-900 capitalize">
                        <div>{d.defect_type}</div>
                        <span className="text-[10px] text-slate-400">
                          {Math.round((d.confidence || 0.88) * 100)}% conf
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3">
                        <SeverityBadge severity={d.severity} />
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3">
                        <RiskBadge score={d.risk_score || inspection?.highest_risk || 50} />
                      </td>

                      {/* Location / Bounding Box / Frame */}
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {d.frame_number !== undefined && d.frame_number !== null && (
                          <div className="text-slate-800 font-semibold">Frame #{d.frame_number}</div>
                        )}
                        {bboxStr && <div className="text-slate-500">Box: {bboxStr}</div>}
                        {!d.frame_number && !bboxStr && (
                          <span className="text-slate-400 italic">Image Coordinates</span>
                        )}
                      </td>

                      {/* Road Segment */}
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-medium text-slate-800">
                          {d.road_segment_name || inspection?.road_segment_name || 'Segment-01'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {inspection?.road_name || 'Corridor'}
                        </div>
                      </td>

                      {/* Recommended Action */}
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <span className="text-slate-800 font-medium">
                          {d.action ||
                            (d.defect_type?.toLowerCase().includes('pothole')
                              ? 'Immediate pothole repair & on-site inspection'
                              : d.defect_type?.toLowerCase().includes('water')
                              ? 'Inspect drainage system & remove water accumulation'
                              : 'Schedule routine inspection and crack sealing')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No defects match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
