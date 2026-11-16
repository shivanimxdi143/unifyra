import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Download,
  Eye,
  ArrowUpDown
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { getStoredSubmissions } from '../services/contentService';
import { useOutletContext } from 'react-router-dom';

export default function SubmissionHistory() {
  const { showToast } = useOutletContext();
  const [submissions, setSubmissions] = useState(() => getStoredSubmissions());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = useCallback(() => {
    setSubmissions(getStoredSubmissions());
  }, []);

  useEffect(() => {
    window.addEventListener('unifyra-data-updated', loadData);
    return () => window.removeEventListener('unifyra-data-updated', loadData);
  }, [loadData]);

  const channels = [
    'All',
    'Social - Instagram',
    'Social - TikTok',
    'Email Newsletter',
    'In-Store Signage',
    'Digital Ads',
    'Press Release'
  ];

  const statuses = ['All', 'approved', 'pending', 'changes_requested', 'rejected'];

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
      ['ID,Title,Channel,Submitter,Status,Score,Date']
        .concat(
          filteredSubmissions.map(
            (s) =>
              `"${s.id}","${s.title}","${s.channel}","${s.submitter.name}","${s.status}",${s.score},"${s.submittedAt}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unifyra_freshbite_audit_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs to CSV successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Submission History"
        subtitle="Complete immutable trail of all AI audits, compliance scans, and editorial reviewer sign-offs across FreshBite assets."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800">
            {filteredSubmissions.length} Historical Records
          </span>
        }
        actions={
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV Report</span>
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
              placeholder="Search history by title, submitter name, ID, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2 text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Status Dropdown (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
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
              className="w-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
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
        {filteredSubmissions.length === 0 ? (
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
                  <th className="py-3.5 px-4">Review Status</th>
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
                        <span
                          onClick={() => setSelectedSubmission(sub)}
                          className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
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
                      <ScoreMeter score={sub.score} size="sm" showLabel={false} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={sub.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={selectedSubmission.title}
          subtitle={`Audit Report for ${selectedSubmission.id} • ${selectedSubmission.channel}`}
          footer={
            <button
              onClick={() => setSelectedSubmission(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Close Report
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedSubmission.status} />
                <span className="text-xs text-slate-500">
                  By {selectedSubmission.submitter.name} ({selectedSubmission.submitter.role})
                </span>
              </div>
              <ScoreMeter score={selectedSubmission.score} />
            </div>

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
                <div className="space-y-2">
                  {selectedSubmission.findings.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-900">{f.ruleId}</span>
                        <StatusBadge status={f.severity} size="sm" />
                      </div>
                      <p className="text-slate-700">{f.explanation}</p>
                      {f.suggestion && (
                        <p className="text-emerald-900 bg-emerald-50 p-1.5 rounded font-mono text-[11px] border border-emerald-200">
                          Fix: {f.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSubmission.reviewerNotes && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">Reviewer Notes:</span>
                <p className="text-amber-950">{selectedSubmission.reviewerNotes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
