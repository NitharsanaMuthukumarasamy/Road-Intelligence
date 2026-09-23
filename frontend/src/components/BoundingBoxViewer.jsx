import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

const SEVERITY_COLORS = {
  Critical: { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.25)', text: '#ffffff', badgeBg: '#991b1b' },
  High: { border: '#ea580c', bg: 'rgba(234, 88, 12, 0.25)', text: '#ffffff', badgeBg: '#c2410c' },
  Medium: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.25)', text: '#1e293b', badgeBg: '#ca8a04' },
  Low: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.25)', text: '#ffffff', badgeBg: '#047857' },
};

export default function BoundingBoxViewer({
  imageUrl,
  detections = [],
  selectedDetection = null,
  onSelectDetection,
  imageDimensions = { width: 1280, height: 720 }
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef(null);

  // Default coordinate scale if not provided
  const imgW = imageDimensions.width || 1280;
  const imgH = imageDimensions.height || 720;

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sky-400">YOLO DEFECT BOUNDING</span>
          <span className="text-slate-500">&bull;</span>
          <span className="text-slate-400">{detections.length} Anomaly Zones</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
              showBoxes ? 'bg-sky-600/30 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Boxes {showBoxes ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
              showLabels ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Badges</span>
          </button>

          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1 hover:bg-slate-700 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[10px] text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
              className="p-1 hover:bg-slate-700 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-700 text-slate-300 border-l border-slate-700"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[420px] max-h-[580px] overflow-auto flex items-center justify-center p-4 bg-slate-950 select-none"
      >
        <div
          className="relative inline-block transition-transform duration-150 ease-out"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Road Inspection Defect Analysis"
              className="max-h-[520px] w-auto rounded-lg object-contain block shadow-2xl"
            />
          ) : (
            <div className="w-[640px] h-[380px] bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 font-mono text-xs">
              Road Image Stream Unavailable
            </div>
          )}

          {/* Interactive Bounding Boxes Overlay */}
          {showBoxes &&
            detections.map((det, idx) => {
              const sev = det.severity || 'Medium';
              const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.Medium;
              const isSelected = selectedDetection?.id === det.id || selectedDetection?.detection_id === det.id;
              const isHovered = hoveredIdx === idx;

              // Compute percentage positions if bounding box coordinates are given in pixels
              const x1 = det.x1 ?? (idx === 0 ? 150 : 380);
              const y1 = det.y1 ?? (idx === 0 ? 200 : 260);
              const x2 = det.x2 ?? (idx === 0 ? 360 : 540);
              const y2 = det.y2 ?? (idx === 0 ? 320 : 340);

              const leftPct = (x1 / imgW) * 100;
              const topPct = (y1 / imgH) * 100;
              const widthPct = ((x2 - x1) / imgW) * 100;
              const heightPct = ((y2 - y1) / imgH) * 100;

              return (
                <div
                  key={det.id || idx}
                  onClick={() => onSelectDetection && onSelectDetection(det)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`absolute cursor-pointer transition-all duration-150 ${
                    isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-950 z-30 scale-[1.02]' : 'z-10'
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${Math.max(widthPct, 4)}%`,
                    height: `${Math.max(heightPct, 4)}%`,
                    border: `2.5px solid ${colors.border}`,
                    backgroundColor: isHovered || isSelected ? colors.bg : 'rgba(0,0,0,0.15)',
                    boxShadow: isSelected || isHovered ? `0 0 15px ${colors.border}` : 'none',
                  }}
                >
                  {/* Bounding Box Label Badge */}
                  {showLabels && (
                    <div
                      className="absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap shadow-md flex items-center gap-1.5 pointer-events-none"
                      style={{
                        backgroundColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      <span className="uppercase">{det.defect_type}</span>
                      <span>&bull;</span>
                      <span>{Math.round((det.confidence || 0.9) * 100)}%</span>
                      {det.risk_score && <span>({Math.round(det.risk_score)}/100)</span>}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any damage box to inspect full defect telemetry & engineering recommendation.</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low
          </span>
        </div>
      </div>
    </div>
  );
}
