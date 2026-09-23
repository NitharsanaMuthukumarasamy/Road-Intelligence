import React, { useState, useEffect } from 'react';
import {
  Video as VideoIcon,
  Play,
  Film,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import RiskBadge from '../components/RiskBadge';
import AIRecommendation from '../components/AIRecommendation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { inspectionsAPI } from '../services/api';

export default function VideoAnalysisPage({ inspectionId }) {
  const [videoInspections, setVideoInspections] = useState([]);
  const [selectedId, setSelectedId] = useState(inspectionId || null);
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await inspectionsAPI.list({ limit: 30 });
        const vids = res.data.filter((i) => i.media_type === 'video');
        setVideoInspections(vids);
        if (!selectedId && vids.length > 0) {
          setSelectedId(vids[0].id);
        }
      } catch (err) {
        setError('Failed to fetch video inspections.');
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
      try {
        const res = await inspectionsAPI.get(selectedId);
        setInspection(res.data);
      } catch (err) {
        setError('Failed to load video inspection details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  const videoFile = inspection?.files?.[0];
  const videoUrl = videoFile?.processed_path
    ? `/storage/videos/${videoFile.processed_path.split(/[/\\\\]/).pop()}`
    : (videoFile?.stored_filename ? `/storage/videos/${videoFile.stored_filename}` : null);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-sky-600" />
            Video Pavement Survey & Dynamic Tracking
          </h2>
          <p className="text-xs text-slate-500">
            Automated video frame extraction, defect tracking timeline, and annotated video playback.
          </p>
        </div>

        {/* Video Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Survey Video:</label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-xs truncate"
          >
            {videoInspections.map((v) => (
              <option key={v.id} value={v.id}>
                #{v.id} - {v.title} ({v.highest_severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading video stream and defect tracking telemetry..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !inspection && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
          No video inspections found. Upload a video survey via the "Upload Inspection" page to view analysis.
        </div>
      )}

      {!loading && inspection && (
        <>
          {/* Metadata Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Duration & Size</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {videoFile?.duration_seconds ? `${videoFile.duration_seconds}s` : 'Continuous'} &bull;{' '}
                {videoFile?.file_size ? `${(videoFile.file_size / (1024 * 1024)).toFixed(1)} MB` : 'MP4'}
              </p>
              <p className="text-xs text-slate-500">Frame Interval: 3</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Corridor Location</span>
              <p className="text-sm font-bold text-slate-900 mt-1 truncate">{inspection.road_name || 'Corridor'}</p>
              <p className="text-xs text-slate-500">{inspection.district}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Defects Logged</span>
              <p className="text-sm font-bold text-slate-900 mt-1">{inspection.total_defects} Occurrences</p>
              <div className="mt-1">
                <SeverityBadge severity={inspection.highest_severity} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Maximum Hazard Risk</span>
              <div className="mt-1">
                <RiskBadge score={inspection.highest_risk} priority={inspection.priority} />
              </div>
            </div>
          </div>

          {/* Video Player & Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-3 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between pb-2 px-1 text-xs text-slate-400 font-mono">
                <span>AI-ANNOTATED OUTPUT PLAYBACK</span>
                <span className="text-emerald-400 font-bold">&bull; YOLO TRACKING</span>
              </div>
              {videoUrl ? (
                <video
                  controls
                  className="w-full max-h-[440px] rounded-lg bg-black object-contain"
                  src={videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500 text-xs">
                  Video file unavailable or undergoing background encoding.
                </div>
              )}
            </div>

            {/* Event Detection Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-sky-600" />
                Detection Timeline Events
              </h3>
              <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
                {inspection.detections && inspection.detections.length > 0 ? (
                  inspection.detections.map((det, i) => (
                    <div
                      key={det.id || i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-sky-300 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="capitalize text-slate-800 font-bold">{det.defect_type}</span>
                        <span className="font-mono text-slate-500">
                          {det.timestamp_sec ? `${det.timestamp_sec}s` : `Frame ${det.frame_number || i+1}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <SeverityBadge severity={det.severity} />
                        <span className="font-mono text-slate-600">{(det.confidence * 100).toFixed(0)}% Conf</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No defect timestamps recorded in video stream.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="space-y-3">
            <AIRecommendation recommendation={inspection.recommendations?.[0]} />
          </div>
        </>
      )}
    </div>
  );
}
