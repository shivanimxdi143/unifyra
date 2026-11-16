import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  ChevronDown
} from 'lucide-react';
import { BRAND_PROFILE } from '../../services/mockData';

export default function TopNav({
  onToggleSidebar,
  currentRole = 'Brand Manager',
  onRoleChange,
  onResetData
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    {
      id: 1,
      title: 'New Content Pending Review',
      desc: 'Summer Elixir Instagram Launch requires compliance check.',
      time: '12m ago',
      unread: true,
      type: 'warning'
    },
    {
      id: 2,
      title: 'Guideline BG-201 Enforced',
      desc: 'AI flagged medical claims on Facebook ad draft.',
      time: '1h ago',
      unread: true,
      type: 'info'
    },
    {
      id: 3,
      title: 'Review Complete',
      desc: 'National Press Release approved by Shivani.',
      time: '3h ago',
      unread: false,
      type: 'success'
    }
  ];

  const roles = [
    { id: 'manager', label: 'Brand Manager', desc: 'Manage guidelines & system audits' },
    { id: 'creator', label: 'Content Creator', desc: 'Draft & run AI compliance checks' },
    { id: 'reviewer', label: 'Compliance Reviewer', desc: 'Approve, reject or request revisions' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Brand Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Selector Badge with subtle purple/blue and fresh accents */}
        <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 border border-slate-200/90 text-xs text-slate-800 shadow-2xs">
          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px]">
            <Leaf className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-900">{BRAND_PROFILE.name}</span>
          <span className="text-slate-400 font-mono text-[11px]">• 48 Outlets</span>
          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 font-semibold text-indigo-700 border border-indigo-200/60">
            Active Workspace
          </span>
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guidelines, campaigns, or rules (e.g. BG-201, claims)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-xs rounded-xl pl-9 pr-4 py-2 text-slate-900 placeholder:text-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right controls: Demo Reset, Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Reset Mock Data button */}
        <button
          onClick={onResetData}
          title="Reset Demo Mock Data"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo</span>
        </button>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200/80 transition-colors border border-slate-200 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline text-slate-500 font-normal">Role:</span>
            <span className="text-indigo-700 font-semibold">{currentRole}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-up">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Switch Demo Role</p>
                <p className="text-[11px] text-slate-500">Test different permissions and viewpoints</p>
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    if (onRoleChange) onRoleChange(r.label);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex flex-col cursor-pointer ${
                    currentRole === r.label ? 'bg-indigo-50/70 font-semibold' : ''
                  }`}
                >
                  <span className={currentRole === r.label ? 'text-indigo-800' : 'text-slate-800'}>
                    {r.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">{r.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Governance Alerts</span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  2 unread
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {n.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-500" />}
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar with subtle purple/blue gradient */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-100 shadow-2xs">
            SH
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-bold text-slate-900 block leading-tight">Shivani</span>
            <span className="text-[10px] text-slate-500 block leading-none">CoreSync Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
}
