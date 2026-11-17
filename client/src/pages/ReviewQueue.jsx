import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  UserCheck
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import EmptyState from '../components/common/EmptyState';
import {
  getStoredSubmissions,
  getSubmissionWithFindings,
  recordReviewDecision,
  fetchReviewAuditTrail
} from '../services/contentService';
import { getErrorMessage } from '../services/api';
import { useOutletContext } from 'react-router-dom';

export default function ReviewQueue() {
  const { showToast, currentRole } = useOutletContext();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [reviewHistory, setReviewHistory] = useState([]);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const normalizeSubmission = (sub) => {
    const findings = sub.findings || [];
    let penalty = 0;
    findings.forEach((f) => {
      if (f.severity === 'critical') penalty += 24;
      else if (f.severity === 'high') penalty += 14;
      else if (f.severity === 'medium') penalty += 8;
      else penalty += 4;
    });
    const score = Math.max(25, Math.min(100, 100 - penalty));

    return {
      _id: sub._id,
      id: sub._id ? `SUB-${sub._id.slice(-4).toUpperCase()}` : (sub.id || 'SUB-000'),
      title: sub.title || (sub.content ? sub.content.slice(0, 36) + '...' : 'Draft Content'),
      channel: sub.contentType ? sub.contentType.replace(/_/g, ' ').toUpperCase() : (sub.channel || 'Social Media'),
      department: sub.department || 'Marketing',
      campaign: sub.campaign || 'Brand Campaign',
      status: sub.status || 'pending',
      content: sub.content || '',
      submitter: {
        name: sub.submittedBy || 'Elena Rostova',
        role: 'Content Creator',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      },
      findings: findings.map((f, idx) => ({
        id: f._id || `f-${idx}`,
        ruleId: f.ruleId ? String(f.ruleId).slice(-6) : 'BRAND',
        severity: f.severity || 'medium',
        offendingText: f.offendingText || '',
        explanation: f.explanation || '',
        suggestion: f.suggestedCorrection || f.suggestion || ''
      })),
      score,
      submittedAt: sub.createdAt || sub.submittedAt || new Date().toISOString()
    };
  };

  const loadData = useCallback(async () => {
    try {
      const subs = await getStoredSubmissions();
      setError(null);
      const normalized = (subs || []).map(normalizeSubmission);
      setSubmissions(normalized);

      // Re-sync selectedSub if open
      setSelectedSub((prev) => {
        if (!prev) return null;
        return normalized.find((s) => s._id === prev._id) || null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
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

  const handleOpenReview = async (sub) => {
    try {
      // Fetch full details with attached findings from backend
      const fullSub = await getSubmissionWithFindings(sub._id);
      const normalized = normalizeSubmission(fullSub);
      setSelectedSub(normalized);
      setReviewerNotes('');

      // Fetch review audit trail
      const history = await fetchReviewAuditTrail(sub._id);
      setReviewHistory(history);
    } catch {
      setSelectedSub(sub);
    }
  };

  const handleDecision = async (newStatus) => {
    if (!selectedSub) return;

    setIsSubmittingDecision(true);
    try {
      await recordReviewDecision(selectedSub._id, {
        reviewerId: currentRole || 'Certified Brand Reviewer',
        decision: newStatus,
        comments: reviewerNotes.trim() || `Decision: ${newStatus.replace('_', ' ')}`
      });

      showToast(`Submission #${selectedSub._id.slice(-6)} marked as "${newStatus.replace('_', ' ').toUpperCase()}".`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();

      // Refresh review history
      const history = await fetchReviewAuditTrail(selectedSub._id);
      setReviewHistory(history);
      setReviewerNotes('');
    } catch (err) {
      showToast(`Review decision error: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && (sub.status === 'analyzed' || sub.status === 'pending')) ||
      (filterStatus === 'changes_requested' && sub.status === 'changes_requested') ||
      (filterStatus === 'completed' && (sub.status === 'approved' || sub.status === 'rejected'));

    const matchesQuery =
      searchQuery === '' ||
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.submitter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.channel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesQuery;
  });

  const pendingCount = submissions.filter((s) => s.status === 'analyzed' || s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Review & Editorial Queue"
        subtitle="Mandatory governance verification. AI evaluates compliance; certified human reviewers make final editorial publishing decisions."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {pendingCount} Pending Action
          </span>
        }
      />

      {/* Reviewer Note Banner (Deep navy with subtle indigo/blue accents) */}
      <div className="bg-[#0b1329] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-950/80 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Human-in-the-Loop Governance Guardrail
              <span className="text-[10px] bg-indigo-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                Zero Auto-Approval
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Reviewer session: <strong>{currentRole}</strong>. Verify AI findings, evaluate offending phrases, and apply editorial decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'pending', label: 'Pending Review', count: pendingCount },
            { id: 'changes_requested', label: 'Changes Requested', count: submissions.filter((s) => s.status === 'changes_requested').length },
            { id: 'completed', label: 'Approved / Completed', count: submissions.filter((s) => s.status === 'approved' || s.status === 'rejected').length },
            { id: 'all', label: 'All Submissions', count: submissions.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterStatus === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search queue by title, submitter, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2 text-slate-900 outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Queue List & Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Queue List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-2xs">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-indigo-600 border-t-transparent mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading review queue...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-xs text-rose-800 shadow-2xs">
              <p className="font-bold mb-1">Failed to load review queue</p>
              <p>{error}</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Queue is currently clear"
              description="No submissions matching this filter require editorial review."
            />
          ) : (
            filteredSubmissions.map((sub) => {
              const isSelected = selectedSub && selectedSub.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleOpenReview(sub)}
                  className={`bg-white rounded-2xl border p-4.5 transition-all cursor-pointer shadow-2xs hover:border-slate-300 ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/15'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {sub.id}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">{sub.channel}</span>
                    </div>
                    <StatusBadge status={sub.status} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {sub.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    "{sub.content}"
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={sub.submitter.avatar}
                        alt={sub.submitter.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <span className="text-xs text-slate-600 truncate font-medium">
                        {sub.submitter.name}
                      </span>
                    </div>

                    <ScoreMeter score={sub.score} size="sm" showLabel={false} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Submission Inspector & Decision Station (7 cols on lg) */}
        <div className="lg:col-span-7">
          {!selectedSub ? (
            <div className="h-full min-h-[440px] rounded-2xl border border-dashed border-slate-200 bg-white p-8 flex flex-col items-center justify-center text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-800">
                Select a Submission to Review
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose any item from the left queue to inspect AI compliance findings, read the draft, and render an editorial decision.
              </p>
            </div>
          ) : (
            <Card
              title={selectedSub.title}
              subtitle={`Channel: ${selectedSub.channel} • Campaign: ${selectedSub.campaign || 'N/A'}`}
              badge={<StatusBadge status={selectedSub.status} size="sm" />}
              actions={<ScoreMeter score={selectedSub.score} />}
            >
              <div className="space-y-5">
                {/* Content Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Submitted Copy
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Submitted {new Date(selectedSub.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans select-text">
                    {selectedSub.content}
                  </div>
                </div>

                {/* AI Findings */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                    <span>AI Governance Flags ({selectedSub.findings?.length || 0})</span>
                    {selectedSub.findings?.length === 0 && (
                      <span className="text-emerald-700 font-semibold normal-case">Clean audit</span>
                    )}
                  </h4>

                  {selectedSub.findings?.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All brand guidelines and trademark rules were fully satisfied.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedSub.findings.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-rose-900">{f.ruleId}</span>
                            <StatusBadge status={f.severity} size="sm" />
                          </div>
                          <div className="text-rose-950 font-medium">
                            Offending text: <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-800">"{f.offendingText}"</code>
                          </div>
                          <p className="text-slate-600">{f.explanation}</p>
                          {f.suggestion && (
                            <div className="p-2 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px]">
                              <strong>Suggested Fix:</strong> {f.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historical Review Audit Trail */}
                {reviewHistory && reviewHistory.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                      Review Audit History ({reviewHistory.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {reviewHistory.map((r, rIdx) => (
                        <div key={r._id || rIdx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800">{r.reviewerId}</span>
                            <StatusBadge status={r.decision} size="sm" />
                          </div>
                          <p className="text-slate-600 text-[11px]">{r.comments}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviewer Notes Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Editorial Reviewer Feedback / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide constructive feedback for the content author or record reasons for approval/rejection..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Review Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    Decision logged by <strong>{currentRole}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={() => handleDecision('rejected')}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-800 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={() => handleDecision('changes_requested')}
                      className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-900 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Request Changes</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingDecision}
                      onClick={() => handleDecision('approved')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmittingDecision ? 'Submitting...' : 'Approve Content'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
