import React, { useState, useEffect } from 'react';
import { Route, Plus, Filter, AlertTriangle, ShieldCheck, ArrowUpDown } from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { roadSegmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RoadSegmentsPage({ onNavigate }) {
  const { isOfficer } = useAuth();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // New segment form
  const [newSegment, setNewSegment] = useState({
    segment_code: '',
    segment_name: '',
    road_name: '',
    district: 'Central',
    city: 'Metropolitan Metro',
    state: 'Delhi NCR',
    length_km: 2.0,
    road_importance: 'Medium',
  });

  const fetchSegments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roadSegmentsAPI.list();
      setSegments(res.data);
    } catch (err) {
      setError('Failed to load road segment prioritization records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleCreateSegment = async (e) => {
    e.preventDefault();
    try {
      await roadSegmentsAPI.create(newSegment);
      setShowModal(false);
      fetchSegments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add road segment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Route className="w-5 h-5 text-sky-600" />
            Road Segment Condition & Prioritization Register
          </h2>
          <p className="text-xs text-slate-500">
            Segment-level defect aggregation, structural risk scoring, and municipal maintenance ranking.
          </p>
        </div>

        {isOfficer && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Road Segment
          </button>
        )}
      </div>

      {loading && <LoadingSpinner message="Calculating road segment priority indices..." />}
      {error && <ErrorMessage message={error} onRetry={fetchSegments} />}

      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Segment Code</th>
                  <th className="px-4 py-3">Road Segment Name</th>
                  <th className="px-4 py-3">Corridor & District</th>
                  <th className="px-4 py-3">Importance</th>
                  <th className="px-4 py-3 text-center">Defect Breakdown</th>
                  <th className="px-4 py-3">Highest Severity</th>
                  <th className="px-4 py-3">Average Risk</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {segments.length > 0 ? (
                  segments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sky-700">
                        {s.segment_code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {s.segment_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{s.road_name}</div>
                        <div className="text-[11px] text-slate-400">{s.district}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.road_importance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="text-red-700 font-bold" title="Potholes">{s.pothole_count} P</span>
                          <span>&bull;</span>
                          <span className="text-amber-700 font-bold" title="Cracks">{s.crack_count} C</span>
                          <span>&bull;</span>
                          <span className="text-sky-700 font-bold" title="Water">{s.water_count} W</span>
                          <span className="text-slate-400">({s.total_defects} Total)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={s.highest_severity} />
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge score={s.avg_risk} priority={s.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${
                          s.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-300' :
                          s.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                          s.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}>
                          {s.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No road segments cataloged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Road Segment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Road Segment</h3>
            <form onSubmit={handleCreateSegment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Segment Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEG-NH44-02"
                  value={newSegment.segment_code}
                  onChange={(e) => setNewSegment({ ...newSegment, segment_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Segment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-44 Sector 9 Extension"
                  value={newSegment.segment_name}
                  onChange={(e) => setNewSegment({ ...newSegment, segment_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Road Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NH-44"
                    value={newSegment.road_name}
                    onChange={(e) => setNewSegment({ ...newSegment, road_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corridor Priority</label>
                  <select
                    value={newSegment.road_importance}
                    onChange={(e) => setNewSegment({ ...newSegment, road_importance: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="High">High (Expressway/Arterial)</option>
                    <option value="Medium">Medium (Major City Road)</option>
                    <option value="Low">Low (Local Street)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={newSegment.district}
                    onChange={(e) => setNewSegment({ ...newSegment, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Length (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSegment.length_km}
                    onChange={(e) => setNewSegment({ ...newSegment, length_km: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
