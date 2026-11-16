import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  BookOpen
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { BRAND_PROFILE } from '../services/mockData';
import { getStoredGuidelines, saveGuidelines } from '../services/contentService';
import { useOutletContext } from 'react-router-dom';

export default function BrandGuidelines() {
  const { showToast } = useOutletContext();
  const [guidelines, setGuidelines] = useState(() => getStoredGuidelines());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding guideline
  const [newRule, setNewRule] = useState({
    title: '',
    category: 'Tone & Voice',
    severity: 'high',
    enforcement: 'Strict',
    description: '',
    doExample: '',
    dontExample: ''
  });

  const loadData = useCallback(() => {
    setGuidelines(getStoredGuidelines());
  }, []);

  useEffect(() => {
    window.addEventListener('unifyra-data-updated', loadData);
    return () => window.removeEventListener('unifyra-data-updated', loadData);
  }, [loadData]);

  const categories = ['All', 'Tone & Voice', 'Health & Claims', 'Trademarks & Naming', 'Promotional Style'];
  const severities = ['All', 'critical', 'high', 'medium', 'low'];

  const filteredGuidelines = guidelines.filter((g) => {
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesSev = selectedSeverity === 'All' || g.severity === selectedSeverity;
    const matchesQuery =
      searchQuery === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.doExample.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSev && matchesQuery;
  });

  const handleAddGuideline = (e) => {
    e.preventDefault();
    if (!newRule.title || !newRule.description) {
      alert('Please fill in both Rule Title and Description.');
      return;
    }

    const nextId = `BG-${Math.floor(100 + Math.random() * 900)}`;
    const created = {
      id: nextId,
      ...newRule,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [created, ...guidelines];
    setGuidelines(updated);
    saveGuidelines(updated);
    setIsAddModalOpen(false);
    setNewRule({
      title: '',
      category: 'Tone & Voice',
      severity: 'high',
      enforcement: 'Strict',
      description: '',
      doExample: '',
      dontExample: ''
    });
    showToast(`Guideline ${nextId} published and loaded into AI audit engine.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Guidelines & Rules"
        subtitle={`Active corporate rules and editorial constraints enforced automatically across all ${BRAND_PROFILE.name} communications.`}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {guidelines.length} Rules Active
          </span>
        }
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Guideline</span>
          </button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
        {/* Top row: Search and Severity */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by rule title, ID (e.g. BG-201), keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {severities.map((sev) => (
                <option key={sev} value={sev}>
                  {sev === 'All' ? 'All Severities' : sev.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0 mr-1">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guidelines Grid */}
      {filteredGuidelines.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No guidelines match your filters"
          description="Try selecting a different category or clearing your search term to see more rules."
          action={
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSeverity('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGuidelines.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {g.id}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {g.category}
                    </span>
                  </div>
                  <StatusBadge status={g.severity} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {g.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {g.description}
                </p>
              </div>

              {/* Do & Don't Examples */}
              <div className="p-5 bg-slate-50/50 space-y-3 flex-1 flex flex-col justify-center">
                {/* Do Example */}
                {g.doExample && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>DO (Approved standard):</span>
                    </div>
                    <p className="text-emerald-950/90 font-medium italic pl-5">
                      "{g.doExample}"
                    </p>
                  </div>
                )}

                {/* Don't Example */}
                {g.dontExample && (
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-900 font-bold mb-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>DON'T (Offending copy):</span>
                    </div>
                    <p className="text-rose-950/90 font-medium italic pl-5">
                      "{g.dontExample}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Enforcement: <strong className="text-slate-700">{g.enforcement || 'Strict'}</strong>
                </span>
                <span>Updated: {g.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Guideline Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Brand Guideline"
        subtitle="Enforce a new editorial or regulatory requirement across FreshBite AI audits."
        footer={
          <>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGuideline}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-sm"
            >
              Save & Enforce Guideline
            </button>
          </>
        }
      >
        <form onSubmit={handleAddGuideline} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Rule Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Mandatory Sodium Disclosures on High-Sodium Bowls"
              value={newRule.title}
              onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
              <select
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                <option value="Tone & Voice">Tone & Voice</option>
                <option value="Health & Claims">Health & Claims</option>
                <option value="Trademarks & Naming">Trademarks & Naming</option>
                <option value="Promotional Style">Promotional Style</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Severity</label>
              <select
                value={newRule.severity}
                onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Enforcement</label>
              <select
                value={newRule.enforcement}
                onChange={(e) => setNewRule({ ...newRule, enforcement: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                <option value="Mandatory">Mandatory</option>
                <option value="Strict">Strict</option>
                <option value="Recommended">Recommended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Description & Rationale *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain why this rule exists and how content creators should comply..."
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                Approved Example (DO)
              </label>
              <textarea
                rows={2}
                placeholder="Example of compliant copy..."
                value={newRule.doExample}
                onChange={(e) => setNewRule({ ...newRule, doExample: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-rose-800 mb-1">
                Disallowed Example (DON'T)
              </label>
              <textarea
                rows={2}
                placeholder="Example of non-compliant copy..."
                value={newRule.dontExample}
                onChange={(e) => setNewRule({ ...newRule, dontExample: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-rose-200 bg-rose-50/30 focus:border-rose-500 outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
