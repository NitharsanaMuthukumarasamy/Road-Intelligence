import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Search, ShieldAlert, Layers } from 'lucide-react';
import MapView from '../components/MapView';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { mapAPI } from '../services/api';

export default function RoadMapPage({ onNavigate }) {
  const [markers, setMarkers] = useState([]);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMarker, setActiveMarker] = useState(null);

  const fetchMarkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mapAPI.getDetections();
      setMarkers(res.data);
      setFilteredMarkers(res.data);
      if (res.data.length > 0) {
        setActiveMarker(res.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch geospatial road defect coordinates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...markers];
    if (selectedSeverity !== 'All') {
      result = result.filter((m) => m.severity === selectedSeverity);
    }
    if (selectedType !== 'All') {
      result = result.filter((m) => m.defect_type?.toLowerCase().includes(selectedType.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.road_name?.toLowerCase().includes(q) ||
          m.road_segment_name?.toLowerCase().includes(q) ||
          m.district?.toLowerCase().includes(q) ||
          m.defect_type?.toLowerCase().includes(q)
      );
    }
    setFilteredMarkers(result);
  }, [selectedSeverity, selectedType, searchQuery, markers]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              Interactive Road Hazard & Defect Map
            </h2>
            <p className="text-xs text-slate-500">
              OpenStreetMap GIS view with multi-factor risk categorization and field repair priorities.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Displaying <span className="font-bold text-slate-900">{filteredMarkers.length}</span> of {markers.length} mapped hazards
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search corridor or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Only</option>
              <option value="Medium">Medium Only</option>
              <option value="Low">Low Only</option>
            </select>
          </div>

          {/* Defect Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Defect Types</option>
              <option value="pothole">Potholes</option>
              <option value="crack">Cracks / Fissures</option>
              <option value="water">Water Accumulation</option>
              <option value="damaged">Damaged Surface</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            <button
              onClick={() => {
                setSelectedSeverity('All');
                setSelectedType('All');
                setSearchQuery('');
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner message="Plotting defect coordinate clusters onto GIS map..." />}
      {error && <ErrorMessage message={error} onRetry={fetchMarkers} />}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map View */}
          <div className="lg:col-span-3">
            <MapView
              markers={filteredMarkers}
              selectedMarker={activeMarker}
              onMarkerClick={(m) => setActiveMarker(m)}
            />
          </div>

          {/* Detail Sidebar on Click */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            {activeMarker ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Selected GIS Point</span>
                  <h3 className="text-base font-bold text-slate-900 capitalize mt-0.5">
                    {activeMarker.defect_type}
                  </h3>
                  <p className="text-xs text-slate-500">{activeMarker.road_name || 'Highway Corridor'}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Severity:</span>
                    <SeverityBadge severity={activeMarker.severity} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Risk Score:</span>
                    <RiskBadge score={activeMarker.risk_score} priority={activeMarker.priority} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Coordinates:</span>
                    <span className="font-mono text-slate-700">
                      {activeMarker.latitude?.toFixed(4)}, {activeMarker.longitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Segment:</span>
                    <span className="font-semibold text-slate-800">{activeMarker.road_segment_name || 'Main Segment'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Recommended Intervention:</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                    {activeMarker.recommendation || 'Standard civil engineering pavement patch required.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('image-analysis', activeMarker.inspection_id)}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors text-center"
                >
                  View Inspection Media & Bounding
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs p-4">
                Click any marker on the map to inspect defect telemetry and engineering recommendations.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
