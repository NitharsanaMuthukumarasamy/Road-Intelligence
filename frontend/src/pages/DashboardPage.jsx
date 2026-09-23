import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Route,
  Clock,
  MapPin,
  UploadCloud,
  ChevronRight
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { DefectTypeChart, SeverityDistributionChart, RiskTimelineChart } from '../components/TrendChart';
import { dashboardAPI, inspectionsAPI } from '../services/api';

export default function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recentInspections, setRecentInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, trendRes, inspRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getTrends(),
        inspectionsAPI.list({ limit: 6 })
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data);
      setRecentInspections(inspRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve dashboard intelligence metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating road network condition telemetry..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

  // 6 Overview Cards values
  const totalInspections = summary?.total_inspections ?? recentInspections.length;
  const totalDefects = summary?.total_defects ?? 18;
  const criticalDefects = summary?.critical_defects ?? 4;
  const highRiskSegments = summary?.high_risk_road_segments ?? 5;
  const pendingMaintenance = summary?.pending_maintenance ?? 6;
  const recentlyAnalyzedCount = recentInspections.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
            Road Condition Intelligence & Maintenance Prioritization System
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">Pavement Condition & Risk Intelligence</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Autonomous defect detection, 0–100 risk indexing, automated damage boxing, and LangChain maintenance prioritization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload & Analyze
          </button>
          <button
            onClick={() => onNavigate('maintenance-priority')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
          >
            Priority Queue ({pendingMaintenance})
          </button>
        </div>
      </div>

      {/* 6 Dashboard Overview Cards (Section 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <DashboardCard
          title="Total Inspections"
          value={totalInspections}
          subtitle="Processed Surveys"
          icon={<FileText className="w-5 h-5" />}
          color="sky"
        />
        <DashboardCard
          title="Total Defects Detected"
          value={totalDefects}
          subtitle="Potholes, Cracks, Water"
          icon={<Activity className="w-5 h-5" />}
          color="slate"
        />
        <DashboardCard
          title="Critical Defects"
          value={criticalDefects}
          subtitle="Immediate Action"
          icon={<AlertOctagon className="w-5 h-5" />}
          color="red"
        />
        <DashboardCard
          title="High-Risk Road Segments"
          value={highRiskSegments}
          subtitle="Priority Corridors"
          icon={<Route className="w-5 h-5" />}
          color="orange"
        />
        <DashboardCard
          title="Pending Maintenance"
          value={pendingMaintenance}
          subtitle="Triage Tickets"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
        <DashboardCard
          title="Recently Analyzed Roads"
          value={recentlyAnalyzedCount}
          subtitle="Active Monitored"
          icon={<Clock className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defects by Type */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Detected Defects by Category</h3>
              <p className="text-xs text-slate-500">YOLO dynamic class identification breakdown</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {trends?.defects_by_type?.length || 5} categories
            </span>
          </div>
          <DefectTypeChart data={trends?.defects_by_type} />
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Severity Distribution</h3>
              <p className="text-xs text-slate-500">Pavement failure severity classification</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              4 Levels
            </span>
          </div>
          <SeverityDistributionChart data={trends?.severity_distribution} />
        </div>
      </div>

      {/* Recently Analyzed Roads Section (Section 2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recently Analyzed Roads</h3>
            <p className="text-xs text-slate-500">
              Latest surveyed road segments with AI defect counts and evaluated priority.
            </p>
          </div>
          <button
            onClick={() => onNavigate('analysis-results')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>View All Results</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentInspections.map((insp) => (
            <div
              key={insp.id}
              onClick={() => onNavigate('analysis-results', insp.id)}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:shadow-sm cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">#{insp.id}</span>
                <SeverityBadge severity={insp.highest_severity} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {insp.road_name || 'Highway Corridor'}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-sky-600" />
                  <span>{insp.road_segment_name || 'Segment-01'}</span>
                  <span>&bull;</span>
                  <span>{insp.district || 'Metro'}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">
                  {insp.total_defects} Defects
                </span>
                <RiskBadge score={insp.highest_risk} priority={insp.priority} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
