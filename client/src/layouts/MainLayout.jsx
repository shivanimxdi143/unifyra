import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import TopNav from '../components/navigation/TopNav';
import { resetApplicationData, getStoredSubmissions } from '../services/contentService';

export default function MainLayout({ currentRole, onRoleChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const submissions = getStoredSubmissions();
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleResetData = () => {
    resetApplicationData();
    showToast('Demo data restored to initial FreshBite baseline.');
    window.dispatchEvent(new Event('unifyra-data-updated'));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Deep Navy Sidebar Navigation */}
      <Sidebar
        pendingCount={pendingCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Navigation */}
        <TopNav
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentRole={currentRole}
          onRoleChange={onRoleChange}
          onResetData={handleResetData}
        />

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="px-4 py-3 rounded-xl bg-[#0c1322] text-white text-xs font-semibold shadow-2xl border border-indigo-900/50 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ showToast, currentRole }} />
        </main>

        {/* Enterprise Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Unifyra</span>
              <span>•</span>
              <span>AI Brand Governance & Intelligence SaaS</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>CodeZen India 2026</span>
              <span>Team CoreSync</span>
              <span className="text-indigo-600 font-medium">FreshBite Brand Governance</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
