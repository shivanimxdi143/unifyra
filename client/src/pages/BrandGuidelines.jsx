import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  BookOpen,
  Edit2,
  Sparkles,
  Check,
  X,
  TrendingUp,
  Brain,
  AlertTriangle
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { BRAND_PROFILE } from '../services/mockData';
import {
  getStoredGuidelines,
  createNewGuideline,
  updateExistingGuideline,
  ensureDefaultGuidelines,
  fetchGuidelineSuggestions,
  approveSuggestionAndApplyGuideline,
  dismissSuggestionById,
  requestAIGuidelineSuggestions
} from '../services/contentService';
import { getErrorMessage } from '../services/api';
import { useOutletContext } from 'react-router-dom';

export default function BrandGuidelines() {
  const { showToast } = useOutletContext();
  const [guidelines, setGuidelines] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [processingSuggestionId, setProcessingSuggestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Add & Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Tone & Voice',
    severity: 'high',
    enforcement: 'Strict',
    description: '',
    doExample: '',
    dontExample: ''
  });

  const loadData = useCallback(async () => {
    try {
      const [data, suggs] = await Promise.all([
        getStoredGuidelines(),
        fetchGuidelineSuggestions('pending').catch(() => [])
      ]);
      setError(null);
      const normalized = (data || []).map((g) => ({
        _id: g._id,
        id: g._id ? `BG-${g._id.slice(-4).toUpperCase()}` : (g.id || 'BG-000'),
        brandName: g.brandName || 'FreshBite',
        title: g.title,
        category: g.category || 'Tone & Voice',
        severity: g.rules?.[0]?.severity || g.severity || 'medium',
        enforcement: 'Strict',
        description: g.description || '',
        rules: g.rules || [],
        doExample: g.rules?.[0]?.examples?.[0] || g.doExample || '',
        dontExample: g.rules?.[0]?.examples?.[1] || g.dontExample || '',
        updatedAt: g.updatedAt ? new Date(g.updatedAt).toISOString().split('T')[0] : '2026-11-17'
      }));
      setGuidelines(normalized);
      setSuggestions(suggs || []);
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

  const categories = ['All', 'Tone & Voice', 'Health & Claims', 'Trademarks & Naming', 'Promotional Style', 'Visual Identity'];
  const severities = ['All', 'critical', 'high', 'medium', 'low'];

  const filteredGuidelines = guidelines.filter((g) => {
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesSev = selectedSeverity === 'All' || g.severity === selectedSeverity;
    const matchesQuery =
      searchQuery === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.doExample && g.doExample.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSev && matchesQuery;
  });

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'Tone & Voice',
      severity: 'high',
      enforcement: 'Strict',
      description: '',
      doExample: '',
      dontExample: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (guideline) => {
    setEditingGuideline(guideline);
    setFormData({
      title: guideline.title || '',
      category: guideline.category || 'Tone & Voice',
      severity: guideline.severity || 'high',
      enforcement: guideline.enforcement || 'Strict',
      description: guideline.description || '',
      doExample: guideline.doExample || '',
      dontExample: guideline.dontExample || ''
    });
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert('Please fill in both Rule Title and Description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewGuideline(formData);
      setIsAddModalOpen(false);
      showToast(`Guideline "${formData.title}" created and active in AI audits.`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
    } catch (err) {
      showToast(`Failed to create guideline: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingGuideline) return;
    if (!formData.title || !formData.description) {
      alert('Please fill in both Rule Title and Description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateExistingGuideline(editingGuideline._id, formData);
      setEditingGuideline(null);
      showToast(`Guideline "${formData.title}" successfully updated.`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
    } catch (err) {
      showToast(`Failed to update guideline: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    setIsLoading(true);
    try {
      await ensureDefaultGuidelines();
      showToast('Baseline FreshBite guidelines successfully seeded.');
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
    } catch (err) {
      showToast(`Failed to seed guidelines: ${getErrorMessage(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSuggestion = async (suggestion) => {
    setProcessingSuggestionId(suggestion._id);
    try {
      await approveSuggestionAndApplyGuideline(suggestion._id, 'Brand Manager');
      showToast(`Guideline "${suggestion.title}" approved and active in AI audits!`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
    } catch (err) {
      showToast(`Failed to approve suggestion: ${getErrorMessage(err)}`);
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  const handleDismissSuggestion = async (suggestion) => {
    setProcessingSuggestionId(suggestion._id);
    try {
      await dismissSuggestionById(suggestion._id, 'Brand Manager');
      showToast(`Suggestion "${suggestion.title}" dismissed.`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
    } catch (err) {
      showToast(`Failed to dismiss suggestion: ${getErrorMessage(err)}`);
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const generated = await requestAIGuidelineSuggestions();
      showToast(`Generated ${generated.length} new guideline suggestions from brand drift.`);
      window.dispatchEvent(new Event('unifyra-data-updated'));
      await loadData();
    } catch (err) {
      showToast(`Could not generate suggestions: ${getErrorMessage(err)}`);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Guidelines"
        subtitle={`Active brand rules, tone standards, and compliance policies enforced during AI audits for ${BRAND_PROFILE.name}.`}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {guidelines.length} Rules Active
          </span>
        }
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm shadow-indigo-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guideline</span>
          </button>
        }
      />

      {/* Proposed Guideline Improvements (Brand Drift Intelligence) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-indigo-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">Proposed Guideline Improvements</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                  Brand Drift Intelligence
                </span>
                {suggestions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {suggestions.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                AI analyzes recurring compliance violations across submissions to propose targeted guideline updates for manager approval.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateSuggestions}
            disabled={isGeneratingSuggestions}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold text-indigo-200 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Brain className="w-4 h-4" />
            <span>{isGeneratingSuggestions ? 'Analyzing Drift...' : 'Scan Drift Patterns'}</span>
          </button>
        </div>

        {/* Suggestion Cards */}
        {suggestions.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {suggestions.map((sug) => {
              const isProcessing = processingSuggestionId === sug._id;
              const evidence = sug.supportingEvidence || {};
              return (
                <div
                  key={sug._id}
                  className="bg-slate-900/90 rounded-xl border border-indigo-500/30 p-5 flex flex-col justify-between space-y-4 hover:border-indigo-400/50 transition-all shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          {sug.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-2xs font-bold uppercase ${
                          sug.severity === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          sug.severity === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {sug.severity}
                        </span>
                        {sug.confidence && (
                          <span className="text-2xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {Math.round(sug.confidence * 100)}% Confidence
                          </span>
                        )}
                      </div>
                      {evidence.violationCount && (
                        <span className="text-2xs text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Violated {evidence.violationCount}x
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{sug.title}</h3>
                      <p className="mt-1.5 text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                        <strong className="text-indigo-300">Proposed Rule:</strong> {sug.proposedRuleText}
                      </p>
                    </div>

                    {sug.rationale && (
                      <p className="text-2xs text-slate-400 leading-relaxed">
                        <strong className="text-slate-300">Rationale:</strong> {sug.rationale}
                      </p>
                    )}

                    {evidence.sampleOffendingText && (
                      <div className="text-2xs text-slate-300 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-lg">
                        <span className="font-semibold text-rose-300">Sample Drift Pattern: </span>
                        <span className="italic">"{evidence.sampleOffendingText}"</span>
                      </div>
                    )}

                    {(sug.suggestedDoExample || sug.suggestedDontExample) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                        {sug.suggestedDoExample && (
                          <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                            <strong>Do:</strong> {sug.suggestedDoExample}
                          </div>
                        )}
                        {sug.suggestedDontExample && (
                          <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-200">
                            <strong>Don't:</strong> {sug.suggestedDontExample}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDismissSuggestion(sug)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => handleApproveSuggestion(sug)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'Applying...' : 'Approve & Enforce'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              No pending guideline suggestions. Click <strong className="text-indigo-300">Scan Drift Patterns</strong> above or check back after new submissions are audited.
            </p>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
        {/* Top row: Search and Severity */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rules by title, keyword, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
            >
              {severities.map((sev) => (
                <option key={sev} value={sev}>
                  {sev === 'All' ? 'All Severities' : sev.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills with subtle purple/blue active state */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0 mr-1">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guidelines Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <p className="text-xs font-semibold text-slate-600">Loading brand guidelines from backend...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <p className="text-xs font-bold text-rose-800 mb-2">Error loading guidelines: {error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredGuidelines.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No guidelines match your filters"
          description={guidelines.length === 0 ? "No brand guidelines exist in the database yet. Seed FreshBite baseline rules to get started." : "Try selecting a different category or clearing your search term to see more rules."}
          action={
            guidelines.length === 0 ? (
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm"
              >
                Seed Baseline Guidelines
              </button>
            ) : (
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
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGuidelines.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {g.id}
                    </span>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {g.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={g.severity} size="sm" />
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit this Guideline"
                      aria-label="Edit guideline"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                    <p className="text-emerald-950 font-medium italic pl-5">
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
                    <p className="text-rose-950 font-medium italic pl-5">
                      "{g.dontExample}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Enforcement: <strong className="text-slate-700">{g.enforcement || 'Strict'}</strong>
                </span>
                <div className="flex items-center gap-3">
                  <span>Updated: {g.updatedAt}</span>
                  <button
                    onClick={() => handleOpenEdit(g)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Guideline Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Brand Guideline"
        subtitle="Enforce a new editorial, legal, or voice constraint across FreshBite AI audits."
        footer={
          <>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAdd}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save & Enforce Rule'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Rule Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mandatory Allergen Cross-Contact Disclosure"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="Tone & Voice">Tone & Voice</option>
                <option value="Health & Claims">Health & Claims</option>
                <option value="Trademarks & Naming">Trademarks & Naming</option>
                <option value="Promotional Style">Promotional Style</option>
                <option value="Visual Identity">Visual Identity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
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
                value={formData.enforcement}
                onChange={(e) => setFormData({ ...formData, enforcement: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="Mandatory">Mandatory</option>
                <option value="Strict">Strict</option>
                <option value="Recommended">Recommended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Description & Rational Guidance *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain why this rule exists and how content creators should comply..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
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
                value={formData.doExample}
                onChange={(e) => setFormData({ ...formData, doExample: e.target.value })}
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
                value={formData.dontExample}
                onChange={(e) => setFormData({ ...formData, dontExample: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-rose-200 bg-rose-50/30 focus:border-rose-500 outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Guideline Modal */}
      {editingGuideline && (
        <Modal
          isOpen={!!editingGuideline}
          onClose={() => setEditingGuideline(null)}
          title={`Edit Guideline: ${editingGuideline.id}`}
          subtitle={`Modify rule definition, severity level, or compliance examples for ${editingGuideline.id}.`}
          footer={
            <>
              <button
                onClick={() => setEditingGuideline(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white cursor-pointer shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Rule Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
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
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
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
                  value={formData.enforcement}
                  onChange={(e) => setFormData({ ...formData, enforcement: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                >
                  <option value="Mandatory">Mandatory</option>
                  <option value="Strict">Strict</option>
                  <option value="Recommended">Recommended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Description & Rational Guidance *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Approved Example (DO)
                </label>
                <textarea
                  rows={2}
                  value={formData.doExample}
                  onChange={(e) => setFormData({ ...formData, doExample: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">
                  Disallowed Example (DON'T)
                </label>
                <textarea
                  rows={2}
                  value={formData.dontExample}
                  onChange={(e) => setFormData({ ...formData, dontExample: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-rose-200 bg-rose-50/30 focus:border-rose-500 outline-none"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
