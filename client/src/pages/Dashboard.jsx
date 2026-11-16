import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FileCheck2,
  Clock,
  ShieldAlert,
  ArrowRight,
  PenTool,
  Leaf,
  Share2,
  Mail,
  Store,
  Megaphone,
  Eye
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import Modal from '../components/common/Modal';
import {
  BRAND_PROFILE,
  CHANNEL_METRICS,
  RECENT_AUDIT_LOGS
} from '../services/mockData';
import { getStoredSubmissions } from '../services/contentService';

export default function Dashboard() {
  const [submissions, setSubmissions] = useState(() => getStoredSubmissions());
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const loadData = useCallback(() => {
    setSubmissions(getStoredSubmissions());
  }, []);

  useEffect(() => {
    window.addEventListener('unifyra-data-updated', loadData);
    return () => window.removeEventListener('unifyra-data-updated', loadData);
  }, [loadData]);

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const recentSubmissions = submissions.slice(0, 5);

  const channelIcons = {
    'Social Media': Share2,
    'Email Marketing': Mail,
    'In-Store Signage': Store,
    'Digital Ads': Megaphone
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Brand Governance & Intelligence"
        subtitle={`Real-time brand compliance monitoring, automated AI audits, and editorial governance for ${BRAND_PROFILE.name}.`}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Monitoring
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-950/20 cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>Submit for AI Audit</span>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Brand Compliance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {BRAND_PROFILE.complianceScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              +2.8% vs last month
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Weighted across 48 restaurant outlets & channels
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${BRAND_PROFILE.complianceScore}%` }} />
          </div>
        </div>

        {/* Total Assets Scanned */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Assets Audited
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {submissions.length + 330}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              18 this week
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Instagram, TikTok, Packaging & Email
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        {/* Pending Review Queue */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Review Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingSubmissions.length}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Action Required
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pending human verification by reviewer
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <Link to="/review" className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1">
              Open Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Enforced Rules */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enforced Guidelines
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {BRAND_PROFILE.rulesEnforced}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              5 categories
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tone, Claims, Trademarks, Style & Loyalty
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <Link to="/guidelines" className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1">
              View Rules <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Channels & Brand Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Channel Breakdown & Recent Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channel Governance Performance */}
          <Card
            title="Channel Compliance & Health"
            subtitle="Automated audit compliance index segmented by marketing & operational channel"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CHANNEL_METRICS.map((ch) => {
                const IconComponent = channelIcons[ch.channel] || Share2;
                return (
                  <div
                    key={ch.channel}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{ch.channel}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {ch.complianceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${ch.complianceRate}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{ch.count} assets published</span>
                      <span className="text-emerald-700 font-medium">Optimal Status</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Submissions & Governance Activity */}
          <Card
            title="Recent Content Submissions"
            subtitle="Latest drafts undergoing automated AI audit and human verification"
            actions={
              <Link
                to="/history"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View Full Audit Log</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={sub.submitter.avatar}
                      alt={sub.submitter.name}
                      className="w-9 h-9 rounded-full ring-1 ring-slate-200 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 hover:text-emerald-700 cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                          {sub.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.2 bg-slate-100 rounded">
                          {sub.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{sub.channel}</span>
                        <span>•</span>
                        <span>by {sub.submitter.name}</span>
                        <span>•</span>
                        <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <ScoreMeter score={sub.score} size="sm" showLabel={false} />
                    <StatusBadge status={sub.status} size="sm" />
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Inspect Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: FreshBite Brand Quick-Spec & Activity */}
        <div className="space-y-6">
          {/* FreshBite Brand Specification Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{BRAND_PROFILE.name}</h4>
                  <p className="text-[11px] text-emerald-300 font-medium">Core Brand Standards</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Demo
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-emerald-300/80 uppercase font-semibold tracking-wider block">
                  Official Slogan
                </span>
                <p className="font-semibold text-white mt-0.5">
                  "{BRAND_PROFILE.slogan}"
                </p>
              </div>

              <div>
                <span className="text-[11px] text-emerald-300/80 uppercase font-semibold tracking-wider block">
                  Brand Archetype
                </span>
                <p className="text-slate-200 mt-0.5">
                  The Caregiver & Vitalist (Whole foods, joyful energy, local honesty)
                </p>
              </div>

              <div>
                <span className="text-[11px] text-emerald-300/80 uppercase font-semibold tracking-wider block mb-1">
                  Enforced Tone Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_PROFILE.toneKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-[10px] font-medium bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-md"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-rose-300 uppercase font-semibold tracking-wider block mb-1">
                  Strictly Disallowed Buzzwords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_PROFILE.bannedKeywords.slice(0, 5).map((bw) => (
                    <span
                      key={bw}
                      className="text-[10px] font-medium bg-rose-950/70 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-md"
                    >
                      ✕ {bw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-800/70 flex items-center justify-between text-xs">
              <span className="text-emerald-300/70">48 Partner Outlets</span>
              <Link
                to="/guidelines"
                className="text-emerald-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
              >
                Full Rulebook <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Audit Activity Stream */}
          <Card
            title="Governance Audit Stream"
            subtitle="Automated events and reviewer actions"
          >
            <div className="space-y-3.5">
              {RECENT_AUDIT_LOGS.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 leading-snug">
                      {log.action}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {log.target}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{log.user}</span>
                      <span>•</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={selectedSubmission.title}
          subtitle={`Submitted by ${selectedSubmission.submitter.name} • ${selectedSubmission.channel}`}
          footer={
            <button
              onClick={() => setSelectedSubmission(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedSubmission.status} />
                <span className="text-xs text-slate-500 font-mono">{selectedSubmission.id}</span>
              </div>
              <ScoreMeter score={selectedSubmission.score} />
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Content Copy
              </h4>
              <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-sans">
                {selectedSubmission.content}
              </p>
            </div>

            {selectedSubmission.findings && selectedSubmission.findings.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                  AI Governance Flags ({selectedSubmission.findings.length})
                </h4>
                <div className="space-y-2">
                  {selectedSubmission.findings.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-900">{f.ruleId}</span>
                        <StatusBadge status={f.severity} size="sm" />
                      </div>
                      <p className="text-slate-700">{f.explanation}</p>
                      {f.suggestion && (
                        <p className="text-emerald-800 bg-emerald-50 p-1.5 rounded font-mono text-[11px] border border-emerald-200">
                          Recommended: {f.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
