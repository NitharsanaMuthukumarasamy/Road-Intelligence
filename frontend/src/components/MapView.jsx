import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import SeverityBadge from './SeverityBadge';
import RiskBadge from './RiskBadge';

// Create custom SVG markers for Leaflet based on severity
const createCustomIcon = (severity) => {
  const colors = {
    Critical: '#dc2626',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981',
  };
  const color = colors[severity] || '#0284c7';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
  });
};

// Component to dynamically adjust map bounds when points load
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ markers = [], selectedMarker = null, onMarkerClick }) {
  // Default center (Delhi NCR / Urban corridor)
  const defaultCenter = [28.6139, 77.2090];
  const center = markers.length > 0 && markers[0].latitude && markers[0].longitude
    ? [markers[0].latitude, markers[0].longitude]
    : defaultCenter;

  return (
    <div className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={12} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((m, idx) => {
          if (!m.latitude || !m.longitude) return null;
          return (
            <Marker
              key={m.detection_id || idx}
              position={[m.latitude, m.longitude]}
              icon={createCustomIcon(m.severity)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(m),
              }}
            >
              <Popup className="road-marker-popup">
                <div className="p-1 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                    <span className="font-bold text-sm text-slate-900 capitalize">
                      {m.defect_type}
                    </span>
                    <SeverityBadge severity={m.severity} />
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Road Corridor:</span>
                      <span className="font-medium text-slate-800">{m.road_name || 'State Highway'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Segment:</span>
                      <span className="font-medium text-slate-800">{m.road_segment_name || 'Segment A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400">Risk Assessment:</span>
                      <RiskBadge score={m.risk_score} priority={m.priority} />
                    </div>
                    {m.created_at && (
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Detected:</span>
                        <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {m.recommendation && (
                    <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-700 border border-slate-200">
                      <strong className="block text-slate-900 font-semibold mb-0.5">Recommended Action:</strong>
                      {m.recommendation}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
