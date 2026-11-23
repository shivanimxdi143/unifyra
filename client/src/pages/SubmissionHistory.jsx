import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Download,
  Eye,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  FileText
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import CommentThread from '../components/common/CommentThread';
import {
  getStoredSubmissions,
  getSubmissionWithFindings,
  fetchReviewAuditTrail,
  resubmitSubmission
} from '../services/contentService';
import { getErrorMessage, analyzeSubmission } from '../services/api';
import { useOutletContext, useNavigate } from 'react-router-dom';

export default function SubmissionHistory() {
  const { showToast, currentRole = 'Employee' } = useOutletContext();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Resubmission modal state
  const [resubmittingSub, setResubmittingSub] = useState(null);
  const [resubmitContentText, setResubmitContentText] = useState('');
  const [resubmitContentType, setResubmitContentType] = useState('social_post');
  const [resubmitReviewHistory, setResubmitReviewHistory] = useState([]);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isReauditing, setIsReauditing] = useState(false);
  const [resubmitSuccessMsg, setResubmitSuccessMsg] = useState(null);
  const [freshAuditResult, setFreshAuditResult] = useState(null);

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
      title: sub.title || (sub.content ? sub.content.slice(0, 36) + '...' : 'Draft Marketing Copy'),
      channel: sub.contentType ? sub.contentType.replace(/_/g, ' ').toUpperCase() : (sub.channel || 'Social Media'),
      contentType: sub.contentType || 'social_post',
      status: sub.status || 'pending',
      content: sub.content || '',
      image: sub.image || null,
      document: sub.document || null,
      campaign: sub.campaign || 'Brand Campaign',
      submitter: {
        name: sub.submittedBy || 'Elena Rostova',
        role: 'Content Creator',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      },
      score,
      complianceScore: score,
      findingsCount: findings.length,
      findings: findings.map((f, idx) => ({
        id: f._id || `f-${idx}`,
        ruleId: f.ruleId ? String(f.ruleId).slice(-6) : 'BRAND',
        severity: f.severity || 'medium',
        offendingText: f.offendingText || '',
        explanation: f.explanation || '',
        suggestion: f.suggestedCorrection || f.suggestion || '',
        visualArea: f.visualArea || null
      })),
      submittedAt: sub.createdAt || sub.submittedAt || new Date().toISOString()
    };
  };

  const loadData = useCallback(async () => {
    try {
      const data = await getStoredSubmissions();
      setError(null);
      setSubmissions((data || []).map(normalizeSubmission));
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

  const handleInspect = async (sub) => {
    setSelectedSubmission(sub);
    setSelectedHistory([]);
    try {
      const fullSub = await getSubmissionWithFindings(sub._id);
      setSelectedSubmission(normalizeSubmission(fullSub));
      const history = await fetchReviewAuditTrail(sub._id);
      setSelectedHistory(history);
    } catch {
      // Keep initial sub details
    }
  };

  const handleStartResubmit = async (sub) => {
    setResubmittingSub(sub);
    setResubmitContentText(sub.content || '');
    setResubmitContentType(sub.contentType || 'social_post');
    setResubmitSuccessMsg(null);
    setFreshAuditResult(null);
    setResubmitReviewHistory([]);
    try {
      const history = await fetchReviewAuditTrail(sub._id);
      setResubmitReviewHistory(history);
    } catch {
      // Ignore history fetch error
    }
  };

  const handleExecuteResubmit = async () => {
    if (!resubmitContentText.trim()) {
      alert('Content cannot be empty.');
      return;
    }
    setIsResubmitting(true);
    setResubmitSuccessMsg(null);
    try {
      // 1. Resubmit amended content via HTTP PUT API request
      const resubmitData = await resubmitSubmission(resubmittingSub._id, {
        content: resubmitContentText.trim(),
        contentType: resubmitContentType
      });

      // 2. Ensure fresh AI analysis is run and latest findings are captured
      let finalStatus = resubmitData.status || 'analyzed';
      let finalScore = resubmitData.complianceScore;
      let finalFindings = resubmitData.findings || [];

      if (finalStatus !== 'analyzed') {
        const analysisRes = await analyzeSubmission(resubmittingSub._id);
        const data = analysisRes.data;
        finalStatus = 'analyzed';
        finalScore = data.complianceScore;
        finalFindings = data.findings || [];
      }

      setResubmitSuccessMsg(
        `Submission ${resubmittingSub.id} revised and analyzed successfully (Compliance Score: ${finalScore}%). Status updated to ANALYZED for reviewer approval.`
      );
      showToast(`Submission ${resubmittingSub.id} resubmitted and analyzed (Score: ${finalScore}%).`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
      setResubmittingSub((prev) => ({
        ...prev,
        status: 'analyzed',
        content: resubmitContentText.trim(),
        contentType: resubmitContentType,
        findings: (finalFindings || []).map((f, idx) => ({
          id: f._id || `f-${idx}`,
          ruleId: f.ruleId ? String(f.ruleId).slice(-6) : 'BRAND',
          severity: f.severity || 'medium',
          offendingText: f.offendingText || '',
          explanation: f.explanation || '',
          suggestion: f.suggestedCorrection || f.suggestion || ''
        })),
        findingsCount: (finalFindings || []).length,
        score: finalScore,
        complianceScore: finalScore
      }));
    } catch (err) {
      showToast(`Resubmission failed: ${getErrorMessage(err)}`);
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleExecuteFreshAudit = async () => {
    if (!resubmittingSub?._id) return;
    setIsReauditing(true);
    try {
      const res = await analyzeSubmission(resubmittingSub._id);
      const data = res.data;
      setFreshAuditResult(data);
      showToast(`Fresh AI brand audit complete! Compliance Score: ${data.complianceScore}%.`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
      setResubmittingSub((prev) => ({
        ...prev,
        status: 'analyzed',
        complianceScore: data.complianceScore,
        score: data.complianceScore,
        findings: (data.findings || []).map((f, idx) => ({
          id: f._id || `f-${idx}`,
          ruleId: f.ruleId ? String(f.ruleId).slice(-6) : 'BRAND',
          severity: f.severity || 'medium',
          offendingText: f.offendingText || '',
          explanation: f.explanation || '',
          suggestion: f.suggestedCorrection || f.suggestion || ''
        })),
        findingsCount: (data.findings || []).length
      }));
    } catch (err) {
      showToast(`AI analysis failed: ${getErrorMessage(err)}`);
    } finally {
      setIsReauditing(false);
    }
  };

  const handleOpenInStudio = () => {
    if (!resubmittingSub) return;
    const target = {
      ...resubmittingSub,
      content: resubmitContentText,
      contentType: resubmitContentType
    };
    setResubmittingSub(null);
    navigate('/submit', { state: { resubmitSubmission: target } });
  };

  const channels = [
    'All',
    'SOCIAL POST',
    'EMAIL',
    'AD COPY',
    'BLOG POST',
    'WEBSITE COPY',
    'PRESS RELEASE',
    'OTHER'
  ];

  const statuses = ['All', 'approved', 'analyzed', 'pending', 'changes_requested', 'rejected'];

  const filteredSubmissions = submissions
    .filter((sub) => {
      const matchesStatus = selectedStatus === 'All' || sub.status === selectedStatus;
      const matchesChannel = selectedChannel === 'All' || sub.channel === selectedChannel;
      const matchesQuery =
        searchQuery === '' ||
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.submitter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.content.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesChannel && matchesQuery;
    })
    .sort((a, b) => {
      if (sortField === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
      return sortOrder === 'desc'
        ? new Date(b.submittedAt) - new Date(a.submittedAt)
        : new Date(a.submittedAt) - new Date(b.submittedAt);
    });

  const handleExportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Title,Channel,Submitter,Status,Score,Date,ReviewDecision']
        .concat(
          filteredSubmissions.map(
            (s) =>
              `"${s.id}","${s.title}","${s.channel}","${s.submitter.name}","${s.status}",${s.score},"${s.submittedAt}","${(s.reviewerNotes || '').replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unifyra_audit_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit history to CSV successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submission History"
        subtitle="Track all submitted content, AI compliance scores, and editorial review decisions."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800">
            {filteredSubmissions.length} Submissions
          </span>
        }
        actions={
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input (6 cols) */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, title, submitter or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2 text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Status Dropdown (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Dropdown (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
            >
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch === 'All' ? 'All Channels' : ch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading submission history from backend...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-800 bg-rose-50 border-b border-rose-200">
            <p className="font-bold mb-1">Failed to load submissions</p>
            <p>{error}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No records found"
            description="No submissions matched your search and filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Submission / Campaign</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      setSortField('score');
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Review Decision</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                    onClick={() => {
                      setSortField('submittedAt');
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {sub.id}
                        </span>
                        {sub.document?.hasDocument && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
                            <FileText className="w-2.5 h-2.5" />
                            <span>{sub.document.fileFormat ? sub.document.fileFormat.toUpperCase() : 'DOC'}</span>
                          </span>
                        )}
                        <span
                          onClick={() => handleInspect(sub)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                        >
                          {sub.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-xs">
                        {sub.campaign || 'Regular Marketing'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">{sub.channel}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={sub.submitter.avatar}
                          alt={sub.submitter.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-slate-700 font-medium">{sub.submitter.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {sub.score != null ? (
                        <ScoreMeter score={sub.score} size="sm" showLabel={false} />
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={sub.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {sub.status === 'changes_requested' && (
                          <button
                            type="button"
                            onClick={() => handleStartResubmit(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                            title="Edit content and resubmit for fresh AI audit"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Edit / Resubmit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleInspect(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={selectedSubmission.title}
          subtitle={`Audit Report for ${selectedSubmission.id} • ${selectedSubmission.channel}`}
          footer={
            <div className="flex items-center justify-between w-full">
              {selectedSubmission.status === 'changes_requested' ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedSubmission;
                    setSelectedSubmission(null);
                    handleStartResubmit(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit & Resubmit</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedSubmission.status} />
                <span className="text-xs text-slate-500">
                  By {selectedSubmission.submitter.name}
                </span>
              </div>
              {selectedSubmission.score != null ? (
                <ScoreMeter score={selectedSubmission.score} />
              ) : (
                <span className="text-xs text-slate-400 font-mono font-medium">Pending Audit</span>
              )}
            </div>

            {/* Attached Document Details if present */}
            {selectedSubmission.document?.hasDocument && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-950 truncate">
                      {selectedSubmission.document.originalName || 'Document'}
                    </span>
                  </div>
                  <a
                    href={`/api/submissions/${selectedSubmission._id}/document`}
                    target="_blank"
                    rel="noreferrer"
                    download={selectedSubmission.document.originalName || 'document.pdf'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Document</span>
                  </a>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-indigo-900 font-mono flex-wrap">
                  <span>Format: <strong>{selectedSubmission.document.fileFormat?.toUpperCase() || 'PDF'}</strong></span>
                  <span>•</span>
                  <span>Size: <strong>{((selectedSubmission.document.size || 0) / (1024 * 1024)).toFixed(2)} MB</strong></span>
                  {selectedSubmission.document.wordCount > 0 && (
                    <>
                      <span>•</span>
                      <span>Words: <strong>{selectedSubmission.document.wordCount}</strong></span>
                    </>
                  )}
                  {selectedSubmission.document.pageCount > 0 && (
                    <>
                      <span>•</span>
                      <span>Pages: <strong>{selectedSubmission.document.pageCount}</strong></span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Submitted Text
              </h4>
              <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-sans select-text">
                {selectedSubmission.content}
              </p>
            </div>

            {selectedSubmission.findings && selectedSubmission.findings.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
                  Compliance Violations Logged ({selectedSubmission.findings.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSubmission.findings.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-900">{f.ruleId}</span>
                        <StatusBadge status={f.severity} size="sm" />
                      </div>
                      <p className="text-slate-700">{f.explanation}</p>
                      {f.suggestion && (
                        <p className="text-indigo-900 bg-indigo-50 p-1.5 rounded font-mono text-[11px] border border-indigo-200">
                          Fix: {f.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Decision Audit Trail */}
            {selectedHistory && selectedHistory.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Human Review Decisions ({selectedHistory.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedHistory.map((rev, idx) => (
                    <div key={rev._id || idx} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">{rev.reviewerId}</span>
                        <StatusBadge status={rev.decision} size="sm" />
                      </div>
                      <p className="text-slate-700">{rev.comments}</p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collaboration Comments */}
            <CommentThread
              submissionId={selectedSubmission._id}
              currentRole={currentRole}
              showToast={showToast}
            />
          </div>
        </Modal>
      )}

      {/* Resubmission & Re-Audit Modal */}
      {resubmittingSub && (
        <Modal
          isOpen={!!resubmittingSub}
          onClose={() => setResubmittingSub(null)}
          title={`Edit & Resubmit: ${resubmittingSub.id}`}
          subtitle={`Preserves original ID (${resubmittingSub.id}) and human review history • Ready for fresh AI analysis`}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <button
                type="button"
                onClick={handleOpenInStudio}
                className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Open in Studio Editor</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setResubmittingSub(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={isResubmitting || isReauditing}
                  onClick={handleExecuteResubmit}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResubmitting ? 'animate-spin' : ''}`} />
                  <span>{isResubmitting ? 'Resubmitting...' : 'Save & Resubmit'}</span>
                </button>

                <button
                  type="button"
                  disabled={isResubmitting || isReauditing}
                  onClick={handleExecuteFreshAudit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isReauditing ? 'animate-spin' : ''}`} />
                  <span>{isReauditing ? 'Running AI Audit...' : 'Re-run AI Audit'}</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Review Feedback Banner */}
            {resubmitReviewHistory && resubmitReviewHistory.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Reviewer Feedback ({resubmitReviewHistory[0].reviewerId})
                  </span>
                  <StatusBadge status="changes_requested" size="sm" />
                </div>
                <p className="text-amber-900 font-medium">
                  "{resubmitReviewHistory[0].comments}"
                </p>
                <span className="text-[10px] text-amber-700 block">
                  Logged on {new Date(resubmitReviewHistory[0].createdAt).toLocaleString()}
                </span>
              </div>
            )}

            {/* Success Notification Banner */}
            {resubmitSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resubmitSuccessMsg}</span>
              </div>
            )}

            {/* Submission Status & Details */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Original Submission:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {resubmittingSub.id}
                </span>
                <span className="text-slate-400">•</span>
                <StatusBadge status={resubmittingSub.status} size="sm" />
              </div>
              <div>
                {resubmittingSub.score != null ? (
                  <ScoreMeter score={resubmittingSub.score} />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">Score Pending Audit</span>
                )}
              </div>
            </div>

            {/* Content Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Channel / Content Type
              </label>
              <select
                value={resubmitContentType}
                onChange={(e) => setResubmitContentType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-indigo-500"
              >
                <option value="social_post">Social Post (Instagram, TikTok, LinkedIn)</option>
                <option value="email">Email Newsletter</option>
                <option value="ad_copy">Digital Ad Copy (Meta, Google)</option>
                <option value="blog_post">Blog Article / Story</option>
                <option value="website_copy">Website Landing Page Copy</option>
                <option value="press_release">Corporate Press Release</option>
                <option value="other">In-Store Signage / Menu</option>
              </select>
            </div>

            {/* Editable Content Text Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span>Revised Content Copy</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {resubmitContentText.length} characters
                </span>
              </label>
              <textarea
                rows={5}
                value={resubmitContentText}
                onChange={(e) => setResubmitContentText(e.target.value)}
                placeholder="Enter revised marketing copy addressing reviewer feedback..."
                className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed text-slate-900"
              />
            </div>

            {/* Fresh Audit Findings Display */}
            {freshAuditResult && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Fresh AI Audit Findings ({freshAuditResult.findingsCount || 0})
                  </h4>
                  <span className="text-xs font-bold text-slate-700">
                    Compliance Score: <strong className="text-indigo-600">{freshAuditResult.complianceScore}%</strong>
                  </span>
                </div>

                {freshAuditResult.findingsCount === 0 ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All brand guidelines satisfied! Content is clean and ready for reviewer signoff.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {(freshAuditResult.findings || []).map((f, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900">Rule #{String(f.ruleId || 'BRAND').slice(-6)}</span>
                          <StatusBadge status={f.severity} size="sm" />
                        </div>
                        <p className="text-slate-700 text-[11px]">{f.explanation}</p>
                        {f.suggestedCorrection && (
                          <p className="text-indigo-900 bg-indigo-50 p-1.5 rounded font-mono text-[10px] border border-indigo-200">
                            Fix: {f.suggestedCorrection}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
