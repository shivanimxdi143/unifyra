import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  PenTool,
  ClipboardCheck,
  History,
  Sparkles,
  Layers,
  Leaf,
  LogOut
} from 'lucide-react';
import { BRAND_PROFILE } from '../../services/mockData';
import { ROLE_CONFIGS } from '../../services/authService';

export default function Sidebar({
  pendingCount = 2,
  isOpen,
  onClose,
  currentRole = 'Brand Manager',
  onLogout
}) {
  const allNavItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      roles: ['Brand Manager', 'Reviewer']
    },
    {
      to: '/guidelines',
      label: 'Brand Guidelines',
      icon: ShieldCheck,
      badge: `${BRAND_PROFILE.rulesEnforced} rules`,
      roles: ['Brand Manager']
    },
    {
      to: '/submit',
      label: 'Submit Content',
      icon: PenTool,
      badge: 'AI Audit',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      roles: ['Employee']
    },
    {
      to: '/review',
      label: 'Review Queue',
      icon: ClipboardCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      roles: ['Reviewer']
    },
    {
      to: '/history',
      label: 'Submission History',
      icon: History,
      badge: null,
      roles: ['Brand Manager', 'Employee', 'Reviewer']
    }
  ];

  // Role-based navigation:
  // Brand Manager: Dashboard, Brand Guidelines, Submission History
  // Employee: Submit Content, Submission History
  // Reviewer: Dashboard, Review Queue, Submission History
  const navItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  const persona = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS['Brand Manager'];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Deep Navy Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0f1d] text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Platform Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#070b16]/70">
          <NavLink to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/60">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  Unifyra
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI SaaS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5 font-medium">
                Brand Intelligence
              </span>
            </div>
          </NavLink>
        </div>

        {/* FreshBite Demo Branding Context Banner */}
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-[#0e162b] border border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 shadow-2xs">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {BRAND_PROFILE.name}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                {BRAND_PROFILE.slogan}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
            {BRAND_PROFILE.complianceScore}%
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-950/60'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-indigo-800/80 text-indigo-100 border-indigo-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom AI Status & User Info */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070b16]/80 space-y-3">
          <div className="p-3 rounded-xl bg-[#0d1424] border border-indigo-950/60 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                AI Governance Engine
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-medium">Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Continuous brand checks enforcing FreshBite tone, legal claims & trademarks.
            </p>
          </div>

          <div className="flex items-center justify-between px-2 pt-0.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {persona.personaInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{persona.personaName}</p>
                <p className="text-[10px] text-indigo-300 font-medium truncate">{persona.name}</p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Exit Demo Session"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                aria-label="Exit Demo"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
