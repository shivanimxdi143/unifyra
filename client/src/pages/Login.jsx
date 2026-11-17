import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  ShieldCheck,
  PenTool,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Leaf,
  Check
} from 'lucide-react';
import { ROLE_CONFIGS, VALID_ROLES } from '../services/authService';
import { BRAND_PROFILE } from '../services/mockData';

export default function Login({ onSelectRole }) {
  const [selectedRole, setSelectedRole] = useState('Brand Manager');
  const navigate = useNavigate();

  const handleEnterWorkspace = (roleToEnter) => {
    const role = roleToEnter || selectedRole;
    if (onSelectRole) {
      onSelectRole(role);
    }
    navigate('/');
  };

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'Brand Manager':
        return ShieldCheck;
      case 'Employee':
        return PenTool;
      case 'Reviewer':
        return ClipboardCheck;
      default:
        return ShieldCheck;
    }
  };

  const getRoleTheme = (roleName, isSelected) => {
    switch (roleName) {
      case 'Brand Manager':
        return {
          iconBg: 'bg-indigo-600 text-white shadow-indigo-500/25',
          border: isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200/90 hover:border-indigo-300',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        };
      case 'Employee':
        return {
          iconBg: 'bg-emerald-600 text-white shadow-emerald-500/25',
          border: isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200/90 hover:border-emerald-300',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'Reviewer':
        return {
          iconBg: 'bg-amber-600 text-white shadow-amber-500/25',
          border: isSelected ? 'border-amber-600 ring-2 ring-amber-500/30' : 'border-slate-200/90 hover:border-amber-300',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      default:
        return {
          iconBg: 'bg-indigo-600 text-white',
          border: 'border-slate-200',
          badgeBg: 'bg-slate-50 text-slate-700',
          btnBg: 'bg-indigo-600 text-white'
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/30 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-[#0a0f1d]/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/60">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Unifyra</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI SaaS
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium block -mt-0.5">
                Brand Governance & Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e162b] border border-slate-800 text-xs text-slate-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
              <Leaf className="w-2.5 h-2.5" />
            </div>
            <span className="font-semibold text-white">{BRAND_PROFILE.name}</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">Active Demo Workspace</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-7xl w-full mx-auto">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>CodeZen India 2026 Interactive Demo</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            AI-Powered Brand Governance & Intelligence
          </h1>

          {/* Prominent Tagline */}
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-indigo-500/40 hidden sm:block" />
            <p className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-indigo-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              &ldquo;One Brand. One Voice. Everywhere.&rdquo;
            </p>
            <div className="h-px w-8 bg-indigo-500/40 hidden sm:block" />
          </div>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Select a demo role below to enter the interactive workspace. Experience automated brand rule auditing via Google Gemini with strict human review signoff.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Select Demo Role
            </div>
            <div className="text-xs text-indigo-400 font-medium">
              Click to select, then enter workspace
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VALID_ROLES.map((roleName) => {
              const config = ROLE_CONFIGS[roleName];
              const Icon = getRoleIcon(roleName);
              const isSelected = selectedRole === roleName;
              const theme = getRoleTheme(roleName, isSelected);

              return (
                <div
                  key={roleName}
                  onClick={() => setSelectedRole(roleName)}
                  onDoubleClick={() => handleEnterWorkspace(roleName)}
                  className={`relative rounded-2xl bg-white text-slate-900 p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xl ${
                    theme.border
                  } ${
                    isSelected
                      ? 'shadow-indigo-500/10 scale-[1.02]'
                      : 'hover:scale-[1.01] hover:shadow-2xl'
                  }`}
                >
                  {/* Selected Indicator Checkmark */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-md shadow-indigo-600/30">
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div>
                    {/* Header: Icon & Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${theme.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {!isSelected && (
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${theme.badgeBg}`}>
                          {config.badge}
                        </span>
                      )}
                    </div>

                    {/* Role Title & Persona */}
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {config.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600">
                        {config.personaName} • {config.personaSubtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {config.description}
                    </p>

                    {/* Capabilities Checklist */}
                    <div className="pt-3 border-t border-slate-100 mb-6 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Key Responsibilities:
                      </div>
                      {config.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnterWorkspace(roleName);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isSelected
                          ? `${theme.btnBg} shadow-md`
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>Enter as {config.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary CTA Action Area */}
          <div className="mt-8 p-6 rounded-2xl bg-[#0c1322] border border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Ready to launch:
                </span>
                <span className="text-sm font-bold text-white">
                  {selectedRole} Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full access to {ROLE_CONFIGS[selectedRole]?.capabilities.join(', ')}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleEnterWorkspace(selectedRole)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span>Enter Demo Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Demo Notice */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Interactive Hackathon Demo • No passwords or credentials required • Sessions persist in browser session storage
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#070b16] py-5 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Unifyra</span>
            <span>•</span>
            <span>AI Brand Governance & Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>CodeZen India 2026</span>
            <span>Team CoreSync</span>
            <span className="text-indigo-400 font-semibold">FreshBite Workspace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
