import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Film,
  AlertTriangle,
  Clock,
  Scan
} from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import RiskBadge from './RiskBadge';

export default function VideoFrameScrubber({
  videoUrl,
  detections = [],
  onSelectDetection
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);

  // Group detections by frame or timestamp
  const detectedFrames = detections.filter((d) => d.frame_number !== undefined);
  const uniqueFrames = Array.from(new Set(detections.map((d) => d.frame_number || 1))).sort((a, b) => a - b);

  // Active defects on current frame (or nearest second)
  const activeDefects = detections.filter((d) => {
    if (d.frame_number) {
      return Math.abs(d.frame_number - currentFrame) <= 2;
    }
    if (d.timestamp_sec !== undefined) {
      return Math.abs(d.timestamp_sec - currentTime) <= 1.0;
    }
    return true;
  });

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      // Estimate frame at 30 fps
      setCurrentFrame(Math.max(1, Math.round(cur * 30)));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekToFrame = (frameNum) => {
    setCurrentFrame(frameNum);
    if (videoRef.current) {
      const time = frameNum / 30.0;
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const stepFrame = (delta) => {
    const nextFrame = Math.max(1, currentFrame + delta);
    seekToFrame(nextFrame);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col">
      {/* Video Header Strip */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white">Continuous Video Pavement Telemetry</span>
          <span className="text-slate-500">&bull;</span>
          <span className="font-mono text-sky-400">Frame {currentFrame}</span>
        </div>
        <div className="font-mono text-slate-400 text-[11px]">
          {currentTime.toFixed(1)}s / {duration > 0 ? `${duration.toFixed(1)}s` : 'Stream'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Video Player Column */}
        <div className="lg:col-span-2 p-4 bg-black flex flex-col justify-center">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="w-full max-h-[380px] rounded-lg object-contain bg-slate-950"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-mono">
              Video stream loading or simulated survey playback active.
            </div>
          )}

          {/* Controls Bar */}
          <div className="mt-4 space-y-2">
            {/* Scrubber slider */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration || 60}
                step={0.033} // ~30fps
                value={currentTime}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  setCurrentTime(t);
                  setCurrentFrame(Math.max(1, Math.round(t * 30)));
                  if (videoRef.current) videoRef.current.currentTime = t;
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => stepFrame(-1)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Previous Frame"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => stepFrame(1)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Next Frame"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-slate-400 font-mono text-[11px] ml-2">
                  Frame: <strong className="text-white">{currentFrame}</strong>
                </span>
              </div>

              {/* Jump to detected frame */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Detected frames:</span>
                <div className="flex items-center gap-1">
                  {uniqueFrames.slice(0, 6).map((f) => (
                    <button
                      key={f}
                      onClick={() => seekToFrame(f)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        Math.abs(currentFrame - f) <= 2
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      F{f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Frame Defects Sidebar */}
        <div className="p-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-sky-400" />
                Defects in Current Frame ({activeDefects.length})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Frame {currentFrame}
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
              {activeDefects.length > 0 ? (
                activeDefects.map((det, idx) => (
                  <div
                    key={det.id || idx}
                    onClick={() => onSelectDetection && onSelectDetection(det)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white capitalize">{det.defect_type}</span>
                      <SeverityBadge severity={det.severity} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Confidence: {Math.round((det.confidence || 0.85) * 100)}%</span>
                      {det.risk_score && <span>Risk: {Math.round(det.risk_score)}/100</span>}
                    </div>

                    {det.action && (
                      <p className="text-[10px] text-slate-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                        {det.action}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No surface defects detected in frame {currentFrame}. Scrub forward or click a detected frame badge above.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Total logged video anomalies: <strong className="text-white">{detections.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
