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
  Eye,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Compass,
  Layers
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import Modal from '../components/common/Modal';
import { BRAND_PROFILE, RECENT_AUDIT_LOGS } from '../services/mockData';
import {
  getStoredSubmissions,
  getStoredGuidelines,
  fetchDriftAnalytics,
  fetchGuidelineSuggestions,
  requestAIGuidelineSuggestions
} from '../services/contentService';
import { useOutletContext } from 'react-router-dom';

export default function Dashboard() {
  const { showToast, currentRole } = useOutletContext ? useOutletContext() : { showToast: console.log, currentRole: 'Brand Manager' };

  const [submissions, setSubmissions] = useState([]);
  const [activeGuidelinesCount, setActiveGuidelinesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Brand Drift Intelligence State
  const [timeRange, setTimeRange] = useState('30d');
  const [driftData, setDriftData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isDriftLoading, setIsDriftLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [driftError, setDriftError] = useState(null);

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
    setIsDriftLoading(true);
    setDriftError(null);
    try {
      const [subs, guidelines, drift, suggs] = await Promise.all([
        getStoredSubmissions().catch(() => []),
        getStoredGuidelines().catch(() => []),
        fetchDriftAnalytics(timeRange).catch((err) => {
          console.warn('Drift analytics error:', err);
          return null;
        }),
        fetchGuidelineSuggestions('pending').catch(() => [])
      ]);

      setSubmissions((subs || []).map(normalizeSubmission));
      setActiveGuidelinesCount((guidelines || []).length);
      setDriftData(drift);
      setSuggestions(suggs || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setDriftError('Failed to load live brand drift analytics.');
    } finally {
      setIsLoading(false);
      setIsDriftLoading(false);
    }
  }, [timeRange]);

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

  // Generate Guideline Suggestions via Gemini
  const handleTriggerSuggestions = async () => {
    setIsGenerating(true);
    try {
      const res = await requestAIGuidelineSuggestions();
      showToast?.(`Generated ${res.length || 0} actionable guideline suggestions from brand drift analysis!`);
      const updatedSuggs = await fetchGuidelineSuggestions('pending');
      setSuggestions(updatedSuggs || []);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to generate suggestions';
      showToast?.(`AI Suggestion error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Metric Computations (Real backend data)
  const totalSubmissionsCount = driftData?.summary?.totalSubmissions ?? submissions.length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'analyzed' || s.status === 'pending');
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');
  const totalViolationsDetected = driftData?.summary?.totalViolations ?? submissions.reduce(
    (sum, sub) => sum + (sub.findings?.length || sub.findingsCount || 0),
    0
  );
  const avgComplianceScore = driftData?.summary?.averageComplianceScore ?? null;

  const recentSubmissions = submissions.slice(0, 5);

  const channelIcons = {
    social_post: Share2,
    email: Mail,
    other: Store,
    ad_copy: Megaphone,
    website_copy: Compass,
    blog_post: Layers
  };

  const getDriftBadgeColor = (level) => {
    if (level === 'Severe Drift') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (level === 'Moderate Drift') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (level === 'Minor Drift') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Time Window Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Brand Governance & Drift Intelligence"
          subtitle={`Aggregated violation analytics, recurring non-compliance patterns, and automated policy recommendations for ${BRAND_PROFILE.name}.`}
          badge={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              Real-Time Drift Analytics
            </span>
          }
        />

        {/* Time Window Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerSuggestions}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Trigger Gemini to propose guideline improvements based on recurring violations"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing Drift...' : 'AI Guideline Suggestions'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Submissions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Audited Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalSubmissionsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              in window
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Social posts, creatives, newsletters & ad copy
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, totalSubmissionsCount * 10))}%` }}
            />
          </div>
        </div>

        {/* 2. Average Compliance Score with Drift Delta */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Compliance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {avgComplianceScore !== null ? `${avgComplianceScore}%` : 'N/A'}
            </span>
            {driftData?.comparison?.hasComparison && driftData?.comparison?.scoreDelta !== null ? (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  driftData.comparison.scoreDelta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {driftData.comparison.scoreDelta >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(driftData.comparison.scoreDelta)}%
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Baseline
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {driftData?.comparison?.interpretation || 'Audit score across active guidelines'}
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (avgComplianceScore || 0) >= 85 ? 'bg-emerald-500' : (avgComplianceScore || 0) >= 70 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${avgComplianceScore || 0}%` }}
            />
          </div>
        </div>

        {/* 3. Brand Drift Violations Detected */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Flagged Violations
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
              Flags
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {driftData?.severityDistribution
              ? `${driftData.severityDistribution.critical} Critical • ${driftData.severityDistribution.high} High • ${driftData.severityDistribution.medium} Medium`
              : 'Medical claims, buzzwords & trademark issues'}
          </p>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* 4. Recurring Violation Clusters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Drift Clusters
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {driftData?.topRecurringViolations?.length || 0}
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Recurring
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {suggestions.length > 0
              ? `${suggestions.length} AI proposals pending manager review`
              : 'Repeated non-compliance patterns detected'}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <Link to="/guidelines" className="text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1">
              Review Proposed Rules &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Real Drift Analytics & AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Drift Analytics Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Category-Wise Brand Drift Analysis */}
          <Card
            title="Brand Drift by Category"
            subtitle="Violation distribution and drift severity across governance pillars"
            actions={
              <span className="text-xs font-bold text-slate-500">
                Window: {timeRange.toUpperCase()}
              </span>
            }
          >
            {isDriftLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading category drift metrics...</div>
            ) : !driftData || driftData.categoryBreakdown?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No category violations recorded in the selected window. Brand adherence is healthy.
              </div>
            ) : (
              <div className="space-y-3.5">
                {driftData.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cat.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDriftBadgeColor(cat.driftLevel)}`}>
                          {cat.driftLevel}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {cat.violationCount} {cat.violationCount === 1 ? 'violation' : 'violations'} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.driftLevel === 'Severe Drift'
                            ? 'bg-rose-500'
                            : cat.driftLevel === 'Moderate Drift'
                            ? 'bg-amber-500'
                            : cat.driftLevel === 'Minor Drift'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(4, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 2. Top Recurring Brand Violations */}
          <Card
            title="Top Recurring Brand Violations"
            subtitle="Frequent non-compliance patterns grouped by guideline rule"
            actions={
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Root Cause Analysis
              </span>
            }
          >
            {isDriftLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading recurring patterns...</div>
            ) : !driftData || driftData.topRecurringViolations?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Zero recurring violations detected. All submitted content conforms to approved rules.
              </div>
            ) : (
              <div className="space-y-3">
                {driftData.topRecurringViolations.slice(0, 4).map((rv, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{rv.ruleTitle}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {rv.category}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-rose-700 font-mono bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        {rv.violationCount} occurrences
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rv.ruleText}
                    </p>

                    {rv.sampleOffendingText?.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Sample Offending Snippets:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rv.sampleOffendingText.map((snippet, sIdx) => (
                            <code key={sIdx} className="text-[11px] bg-rose-50 text-rose-900 px-2 py-0.5 rounded border border-rose-200">
                              "{snippet}"
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Affected channels: {rv.affectedChannels?.join(', ') || 'General'}</span>
                      <span className="font-semibold text-slate-700">{rv.percentageOfTotal}% of all audit flags</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 3. Compliance by Channel (Real Aggregated Data) */}
          <Card
            title="Channel Compliance Breakdown"
            subtitle="Live compliance pass rates across communication channels"
          >
            {isDriftLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading channel statistics...</div>
            ) : !driftData || driftData.channelBreakdown?.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No submissions recorded across channels yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {driftData.channelBreakdown.map((ch) => {
                  const IconComponent = channelIcons[ch.channel] || Share2;
                  const score = ch.averageScore ?? 100;
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
                          <span className="text-xs font-bold text-slate-900">{ch.label}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {ch.averageScore !== null ? `${ch.averageScore}%` : 'Pending'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{ch.totalSubmissions} {ch.totalSubmissions === 1 ? 'asset' : 'assets'} audited</span>
                        <span className="text-rose-700 font-semibold">{ch.violationsCount} violations</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 4. Violation Trends Over Time */}
          <Card
            title="Violation Trends Over Time"
            subtitle="Temporal audit volume and non-compliance progression"
          >
            {isDriftLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading temporal trends...</div>
            ) : !driftData || !driftData.timelineTrends || driftData.timelineTrends.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No temporal trend data recorded in this window.
              </div>
            ) : driftData.timelineTrends.length < 2 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">Single Timeline Point Recorded ({driftData.timelineTrends[0].date})</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {driftData.timelineTrends[0].submissionsCount} submissions and {driftData.timelineTrends[0].violationsCount} violations logged today. Submit content across multiple days to view progressive trend charts.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2 h-36 pt-4 px-2 border-b border-slate-200">
                  {driftData.timelineTrends.map((point) => {
                    const maxViolations = Math.max(...driftData.timelineTrends.map(p => p.violationsCount), 1);
                    const heightPercent = Math.min(100, Math.max(15, Math.round((point.violationsCount / maxViolations) * 100)));
                    return (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full max-w-[28px] bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all cursor-pointer"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[10px] text-slate-400 truncate w-full text-center">
                          {point.date.slice(5)}
                        </span>
                        {/* Hover Tooltip */}
                        <div className="hidden group-hover:block absolute -top-12 z-10 bg-slate-900 text-white text-[10px] p-1.5 rounded shadow-lg whitespace-nowrap">
                          {point.date}: {point.violationsCount} violations ({point.submissionsCount} subs, avg {point.averageScore}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
                  <span>Start: {driftData.timelineTrends[0]?.date}</span>
                  <span>Latest: {driftData.timelineTrends[driftData.timelineTrends.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): AI Suggestions & Brand Specification */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI-Suggested Guideline Improvements (Drift Intelligence) */}
          <Card
            title="AI Guideline Suggestions"
            subtitle="Automated policy refinements proposed from recurring drift patterns"
            badge={
              suggestions.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {suggestions.length} Pending
                </span>
              ) : null
            }
          >
            <div className="space-y-3.5">
              {suggestions.length === 0 ? (
                <div className="p-5 text-center bg-purple-50/40 rounded-xl border border-dashed border-purple-200 space-y-2">
                  <Sparkles className="w-7 h-7 text-purple-600 mx-auto" />
                  <p className="text-xs font-bold text-purple-950">No Pending Suggestions</p>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Click "Analyze Drift & Propose Rules" above to generate guideline refinements from current violation clusters.
                  </p>
                  <button
                    onClick={handleTriggerSuggestions}
                    disabled={isGenerating}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Analysis Now</span>
                  </button>
                </div>
              ) : (
                suggestions.slice(0, 3).map((sugg) => (
                  <div key={sugg._id} className="p-3.5 rounded-xl border border-purple-200/90 bg-purple-50/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        {sugg.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {sugg.confidence}% Confidence
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {sugg.title}
                    </h4>

                    <p className="text-xs text-slate-700 italic border-l-2 border-purple-400 pl-2">
                      "{sugg.proposedRuleText}"
                    </p>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {sugg.rationale}
                    </p>

                    <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Evidence: {sugg.supportingEvidence?.violationCount || 1} flags
                      </span>
                      <Link
                        to="/guidelines"
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                      >
                        Review & Apply &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}

              {suggestions.length > 3 && (
                <Link
                  to="/guidelines"
                  className="block text-center text-xs font-semibold text-purple-700 hover:underline pt-1"
                >
                  View all {suggestions.length} proposed guidelines &rarr;
                </Link>
              )}
            </div>
          </Card>

          {/* FreshBite Brand Specification Card */}
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
                Official Standards
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
                  Prohibited Buzzwords
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
