import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function DashboardLayout({ activeTab, setActiveTab, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setActiveTab('upload')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          AI-Powered Road Condition Intelligence & Maintenance Prioritization System &copy; {new Date().getFullYear()} &mdash; State & Municipal Highway Authority
        </footer>
      </div>
    </div>
  );
}
