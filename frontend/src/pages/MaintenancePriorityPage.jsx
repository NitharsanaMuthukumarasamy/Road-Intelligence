import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  Filter,
  Search,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { roadSegmentsAPI } from '../services/api';

export default function MaintenancePriorityPage({ onNavigate }) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'risk' | 'defects'

  const fetchSegments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roadSegmentsAPI.list();
      setSegments(res.data);
    } catch (err) {
      setError('Failed to retrieve road segments maintenance queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  // Priority ranking mapping
  const priorityWeight = {
    Critical: 4,
    'Immediate Action': 4,
    High: 3,
    'Urgent Inspection': 3,
    Medium: 2,
    'Planned Maintenance': 2,
    Low: 1,
    Monitor: 1
  };

  // Filter & Search
  const filteredSegments = segments.filter((s) => {
    if (priorityFilter !== 'All' && s.priority !== priorityFilter) return false;
    if (severityFilter !== 'All' && s.highest_severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.road_name?.toLowerCase().includes(q) ||
        s.segment_name?.toLowerCase().includes(q) ||
        s.segment_code?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort by urgency (default), risk score, or defect count
  const sortedSegments = [...filteredSegments].sort((a, b) => {
    if (sortBy === 'risk') {
      return (b.avg_risk || 0) - (a.avg_risk || 0);
    }
    if (sortBy === 'defects') {
      return (b.total_defects || 0) - (a.total_defects || 0);
    }
    // Default: urgency / priority
    const pA = priorityWeight[a.priority] || 0;
    const pB = priorityWeight[b.priority] || 0;
    if (pB !== pA) return pB - pA;
    return (b.avg_risk || 0) - (a.avg_risk || 0);
  });

  const getRecommendedAction = (segment) => {
    const p = segment.priority;
    const sev = segment.highest_severity;
    if (p === 'Critical' || sev === 'Critical') {
      return 'Immediate deep patch excavation, CSS-1h tack coat emulsion, and high-density HMA compaction.';
    }
    if (p === 'High' || sev === 'High') {
      return 'Deploy crack sealing lance with ASTM D6690 Type II sealant and inspect roadside drainage catchments.';
    }
    if (p === 'Medium' || sev === 'Medium') {
      return 'Schedule thin-lift micro-surfacing and routine shoulder clearing within regular municipal cycle.';
    }
    return 'Surface nominal. Monitor during next routine quarterly pavement condition survey.';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              Civil Works Triage
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            Maintenance Priority & Road Segment Triage
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Road network corridors sorted by maintenance urgency. Evaluates structural risk indices, peak defect severity, and intervention requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">
            <strong>{sortedSegments.length}</strong> Segments in Queue
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search road name, segment ID, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical (Immediate Action)</option>
              <option value="High">High (Urgent Inspection)</option>
              <option value="Medium">Medium (Planned Maintenance)</option>
              <option value="Low">Low (Monitor)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Only</option>
              <option value="Medium">Medium Only</option>
              <option value="Low">Low Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="urgency">Sort by Urgency</option>
              <option value="risk">Sort by Risk Score</option>
              <option value="defects">Sort by Defect Count</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner message="Evaluating road segment maintenance priorities..." />}
      {error && <ErrorMessage message={error} onRetry={fetchSegments} />}

      {/* Road Segment Cards Grid (Section 14) */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSegments.map((segment) => {
            const isCritical = segment.priority === 'Critical' || segment.highest_severity === 'Critical';
            const isHigh = segment.priority === 'High' || segment.highest_severity === 'High';

            return (
              <div
                key={segment.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isCritical
                    ? 'border-red-300 ring-1 ring-red-200'
                    : isHigh
                    ? 'border-orange-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Header: Road Name & Segment ID */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                      ID: {segment.segment_code || `SEG-0${segment.id}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : isHigh
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {segment.priority === 'Critical'
                        ? 'Immediate Action'
                        : segment.priority === 'High'
                        ? 'Urgent Inspection'
                        : segment.priority === 'Medium'
                        ? 'Planned Maintenance'
                        : 'Monitor'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {segment.road_name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{segment.segment_name}</span>
                    <span>&bull;</span>
                    <span>{segment.district}</span>
                  </p>
                </div>

                {/* Attributes: Defect Count, Highest Severity, Risk Score, Last Inspection */}
                <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Defect Count</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {segment.total_defects} anomalies
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Highest Severity</span>
                    <div className="mt-0.5">
                      <SeverityBadge severity={segment.highest_severity} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Risk Score</span>
                    <div className="mt-0.5">
                      <RiskBadge score={segment.avg_risk || segment.max_risk || 50} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Inspection</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">
                      {segment.updated_at
                        ? new Date(segment.updated_at).toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Recommended Maintenance Action:
                  </span>
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {getRecommendedAction(segment)}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate && onNavigate('map')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    <span>View on GIS Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigate && onNavigate('analysis-results')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
