import React, { useState, useEffect } from 'react';
import { Settings, Cpu, Database, Server, RefreshCw, Key, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { healthAPI } from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await healthAPI.check();
      setHealth(res.data);
    } catch (e) {
      setHealth({ backend: 'offline', database: 'offline', redis: 'offline', yolo_model: 'offline' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" />
          System Settings, Infrastructure & Health Monitoring
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Server configurations, YOLO detection weights status, OpenRouter environment settings, and worker concurrency parameters.
        </p>
      </div>

      {/* Health Checks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Live Architecture Health Checks
          </h3>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* FastAPI Server */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-sky-600" />
                FastAPI Server
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-3">
              <span className="text-emerald-700 font-bold capitalize">{health?.backend || 'Healthy'}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">REST API v{health?.version || '1.0.0'}</p>
            </div>
          </div>

          {/* Database */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                PostgreSQL / SQLite
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-3">
              <span className="text-emerald-700 font-bold capitalize">{health?.database || 'Healthy'}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Connection Pool Active</p>
            </div>
          </div>

          {/* Redis & Celery */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                Task Queue Broker
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-3">
              <span className="text-slate-800 font-bold">{health?.redis || 'Healthy'}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Celery + Local Fallback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model & AI Configuration Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3">
          AI & Computer Vision Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">Ultralytics YOLO Architecture</span>
            <p className="text-slate-500">Model File Path: <span className="font-mono text-slate-700 font-semibold">backend/models/road_damage.pt</span></p>
            <p className="text-slate-500">Confidence Threshold: <span className="font-mono text-slate-700 font-semibold">0.25 (Dynamic Class Resolution)</span></p>
            <p className="text-[11px] text-emerald-600 font-medium pt-1">
              &bull; Auto-fallback active: System operates seamlessly with pre-warmed weights or custom road models.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">OpenRouter AI Advisory Engine</span>
            <p className="text-slate-500">Environment Variable: <span className="font-mono text-slate-700 font-semibold">OPENROUTER_API_KEY</span></p>
            <p className="text-slate-500">Model Engine: <span className="font-mono text-slate-700 font-semibold">anthropic/claude-3.5-sonnet</span></p>
            <p className="text-[11px] text-indigo-600 font-medium pt-1">
              &bull; Zero-failure resilience: Expert rule-based civil engineering fallback active whenever key is empty or offline.
            </p>
          </div>
        </div>

        <div className="p-4 bg-sky-50 rounded-lg border border-sky-200 text-sky-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Automated Damage Boxing & Officer Dispatch Protocol</h4>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              Every analyzed image and video automatically renders annotated bounding boxes and creates an urgent <code className="bg-sky-100 px-1 py-0.5 rounded">OfficerDispatch</code> ticket assigned to government and administrative officers for rapid pothole patch deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
