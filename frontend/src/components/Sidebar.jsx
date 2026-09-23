import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Activity,
  MapPin,
  Route,
  History,
  AlertOctagon,
  Sparkles,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const { user, logout, isOfficer, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'upload', label: 'Upload & Analyze', icon: <UploadCloud className="w-5 h-5" /> },
    { id: 'analysis-results', label: 'Analysis Results', icon: <ImageIcon className="w-5 h-5" />, badge: 'AI' },
    { id: 'map', label: 'Road Map', icon: <MapPin className="w-5 h-5" /> },
    { id: 'maintenance-priority', label: 'Maintenance Priority', icon: <AlertOctagon className="w-5 h-5" />, badge: 'Urgent' },
    { id: 'defect-history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];


  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide">RoadGuard AI</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Pavement Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-sky-500 text-white' : 'bg-red-900/60 text-red-300 border border-red-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between px-2 py-2 mb-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Authority User'}</p>
              <p className="text-[10px] text-sky-400 font-medium">{user?.role || 'Citizen'}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
