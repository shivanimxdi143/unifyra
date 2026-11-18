import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertOctagon,
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
import { getStoredSubmissions, getStoredGuidelines } from '../services/contentService';

export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [activeGuidelinesCount, setActiveGuidelinesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const normalizeSubmission = (sub) => {
    const findings = sub.findings || [];
    let score = sub.complianceScore;
    if (score === null || score === undefined) {
      if (sub.status === 'pending') {
        score = null;
      } else {
        let penalty = 0;
        findings.forEach((f) => {
          if (f.severity === 'critical') penalty += 24;
          else if (f.severity === 'high') penalty += 14;
          else if (f.severity === 'medium') penalty += 8;
          else penalty += 4;
        });
        score = Math.max(25, Math.min(100, 100 - penalty));
      }
    }

    return {
      _id: sub._id,
      id: sub._id ? `SUB-${sub._id.slice(-4).toUpperCase()}` : (sub.id || 'SUB-000'),
      title: sub.title || (sub.content ? sub.content.slice(0, 36) + '...' : 'Draft Content'),
      channel: sub.contentType ? sub.contentType.replace(/_/g, ' ').toUpperCase() : (sub.channel || 'Social Media'),
      status: sub.status || 'pending',
      content: sub.content || '',
      submitter: {
        name: sub.submittedBy || 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      },
      score,
      findings,
      findingsCount: findings.length || sub.findingsCount || 0,
      submittedAt: sub.createdAt || sub.submittedAt || new Date().toISOString()
    };
  };

  const loadData = useCallback(async () => {
    try {
      const [subs, guidelines] = await Promise.all([
        getStoredSubmissions().catch(() => []),
        getStoredGuidelines().catch(() => [])
      ]);
      setSubmissions((subs || []).map(normalizeSubmission));
      setActiveGuidelinesCount((guidelines || []).length);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) loadData();
    });

    const handleUpdate = () => {
      if (isMounted) loadData();
    };

    window.addEventListener('unifyra-data-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('unifyra-data-updated', handleUpdate);
    };
  }, [loadData]);

  // Metric Computations (Real backend data + baseline demo stats labeled per Task 10)
  const totalSubmissionsCount = submissions.length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'analyzed' || s.status === 'pending');
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');

  const totalViolationsDetected = submissions.reduce(
    (sum, sub) => sum + (sub.findings?.length || sub.findingsCount || 0),
    0
  );

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
        title="Brand Compliance Dashboard"
        subtitle={`Monitor content quality, check live AI audit results, and track approvals for ${BRAND_PROFILE.name}.`}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Live Monitoring
          </span>
        }
        actions={
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm shadow-indigo-950/20 cursor-pointer"
          >
            <PenTool className="w-4 h-4" />
            <span>New Submission</span>
          </Link>
        }
      />

      {/* KPI Stats Grid: Total Submissions, Pending Reviews, Approved Content, Brand Violations Detected */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Submissions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalSubmissionsCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              Live
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Social posts, newsletters & ad copy
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalSubmissionsCount || 1) * 20)}%` }} />
          </div>
        </div>

        {/* 2. Pending Reviews */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Reviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingSubmissions.length}
            </span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Needs Review
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Awaiting editorial sign-off
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <Link to="/review" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
              Open Review Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 3. Approved Content */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {approvedSubmissions.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              Verified
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cleared for public distribution
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (approvedSubmissions.length || 1) * 25)}%` }} />
          </div>
        </div>

        {/* 4. Brand Violations Detected */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Flagged by AI
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalViolationsDetected}
            </span>
            <span className="text-xs font-semibold text-rose-600">
              Violations
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Medical claims, buzzwords & trademark issues
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Compliance Overview, Channels & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Compliance Overview & Channel Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Overview Card */}
          <Card
            title="Compliance by Channel"
            subtitle="Audit pass rates across communication channels"
            actions={
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  95.0% Benchmark
                </span>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHANNEL_METRICS.map((ch) => {
                const IconComponent = channelIcons[ch.channel] || Share2;
                return (
                  <div
                    key={ch.channel}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
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
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${ch.complianceRate}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{ch.count} assets audited</span>
                      <span className="text-indigo-700 font-semibold">Active Monitoring</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Tone Alignment
                </span>
                <span className="text-base font-extrabold text-slate-900">96.8%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Claims Accuracy
                </span>
                <span className="text-base font-extrabold text-slate-900">92.4%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Trademark Protection
                </span>
                <span className="text-base font-extrabold text-slate-900">98.1%</span>
              </div>
            </div>
          </Card>

          {/* Recent Submissions List */}
          <Card
            title="Recent Submissions"
            subtitle="Latest content assets and their AI audit status"
            actions={
              <Link
                to="/history"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Loading live submissions...</p>
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No submissions yet.</p>
                  <Link
                    to="/submit"
                    className="text-xs text-indigo-600 font-semibold hover:underline mt-1.5 inline-block"
                  >
                    Submit draft copy to start your first audit &rarr;
                  </Link>
                </div>
              ) : (
                recentSubmissions.map((sub) => (
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
                        <span
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                          onClick={() => setSelectedSubmission(sub)}
                        >
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
              ))
            )}
            </div>
          </Card>
        </div>

        {/* Right Col: FreshBite Brand Specification Card & Activity Feed */}
        <div className="space-y-6">
          {/* FreshBite Brand Specification Card (Deep Navy with subtle purple/blue and emerald accents) */}
          <div className="bg-[#0b1329] text-white rounded-2xl p-5 border border-indigo-950/80 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{BRAND_PROFILE.name}</h4>
                  <p className="text-[11px] text-indigo-300 font-medium">
                    {activeGuidelinesCount > 0 ? `${activeGuidelinesCount} Active Brand Guidelines` : 'Core Brand Standards'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official Demo
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Official Slogan
                </span>
                <p className="font-semibold text-white mt-0.5">
                  "{BRAND_PROFILE.slogan}"
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Brand Archetype
                </span>
                <p className="text-slate-300 mt-0.5">
                  The Caregiver & Vitalist (Whole foods, joyful energy, local honesty)
                </p>
              </div>

              <div>
                <span className="text-[11px] text-indigo-300 uppercase font-semibold tracking-wider block mb-1">
                  Enforced Tone Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_PROFILE.toneKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-[10px] font-medium bg-[#141d36] text-indigo-200 border border-indigo-800/40 px-2 py-0.5 rounded-md"
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

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">48 Partner Outlets</span>
              <Link
                to="/guidelines"
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Full Rulebook <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Audit Activity Stream */}
          <Card
            title="Governance Audit Stream"
            subtitle="Automated checks and editorial decisions"
          >
            <div className="space-y-3.5">
              {RECENT_AUDIT_LOGS.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
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

      {/* Detail Inspection Modal */}
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
                        <p className="text-indigo-900 bg-indigo-50 p-1.5 rounded font-mono text-[11px] border border-indigo-200">
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
