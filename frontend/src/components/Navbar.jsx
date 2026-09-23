import React, { useState, useEffect } from 'react';
import { Menu, Bell, Shield, Cpu, Database, CheckCircle, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { healthAPI } from '../services/api';

export default function Navbar({ onToggleSidebar, onUploadClick }) {
  const { user } = useAuth();
  const [health, setHealth] = useState({ backend: 'healthy', database: 'healthy', redis: 'healthy' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await healthAPI.check();
        setHealth(res.data);
      } catch (e) {
        setHealth({ backend: 'offline', database: 'offline', redis: 'offline' });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-base font-bold text-slate-800">
            Road Condition Intelligence & Maintenance Prioritization
          </h2>
          <p className="text-xs text-slate-500">Autonomous AI Defect Detection, Risk Modeling & Dispatch</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Indicators */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FastAPI Server
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            YOLO CV
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            PostgreSQL/SQLite
          </span>
        </div>

        {/* Quick Upload Action */}
        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Road Inspection</span>
        </button>

        {/* User Role Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            {user?.role || 'Citizen'}
          </span>
        </div>
      </div>
    </header>
  );
}
