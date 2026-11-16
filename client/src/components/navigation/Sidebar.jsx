import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  PenTool,
  ClipboardCheck,
  History,
  Sparkles,
  Leaf,
  Layers
} from 'lucide-react';
import { BRAND_PROFILE } from '../../services/mockData';

export default function Sidebar({ pendingCount = 2, isOpen, onClose }) {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/guidelines',
      label: 'Brand Guidelines',
      icon: ShieldCheck,
      badge: `${BRAND_PROFILE.rulesEnforced} rules`
    },
    {
      to: '/submit',
      label: 'Submit Content',
      icon: PenTool,
      badge: 'AI Audit'
    },
    {
      to: '/review',
      label: 'Review Queue',
      icon: ClipboardCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      to: '/history',
      label: 'Submission History',
      icon: History,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <NavLink to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Unifyra
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI Gov
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5 font-medium">
                Brand Intelligence
              </span>
            </div>
          </NavLink>
        </div>

        {/* Demo Brand Indicator Banner */}
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {BRAND_PROFILE.name}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-emerald-300/80 font-medium truncate max-w-[120px]">
                {BRAND_PROFILE.slogan}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/60">
            {BRAND_PROFILE.complianceScore}%
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-emerald-700 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700')
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
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                AI Engine
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">v2.4 Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Autonomous checks enforcing FreshBite tone, legal claims & trademarks.
            </p>
          </div>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                SH
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Shivani</p>
                <p className="text-[10px] text-emerald-400 font-medium truncate">Brand Manager (Admin)</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
