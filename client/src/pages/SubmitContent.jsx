import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Send,
  Wand2,
  ShieldCheck,
  Check
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import { DEMO_PRESETS } from '../services/mockData';
import { analyzeContentWithAI, submitNewContent } from '../services/contentService';
import { useOutletContext, useNavigate } from 'react-router-dom';

export default function SubmitContent() {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('Social - Instagram');
  const [department, setDepartment] = useState('Digital Marketing');
  const [campaign, setCampaign] = useState('Summer Vitality 2026');
  const [content, setContent] = useState('');

  // AI Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [appliedCorrections, setAppliedCorrections] = useState({});

  // Preset selector
  const handleSelectPreset = (preset) => {
    setTitle(preset.title);
    setChannel(preset.channel);
    setDepartment(preset.department);
    setCampaign(preset.campaign);
    setContent(preset.content);
    setAuditResult(null);
    setAppliedCorrections({});
    showToast(`Loaded preset: "${preset.title}"`);
  };

  const handleRunAudit = () => {
    if (!content.trim()) {
      alert('Please enter or paste some content to audit.');
      return;
    }

    setIsAuditing(true);
    setAppliedCorrections({});

    // Simulate AI model latency
    setTimeout(() => {
      const result = analyzeContentWithAI(content, { title, channel, department });
      setAuditResult(result);
      setIsAuditing(false);
      showToast(`AI audit complete. Brand compliance score: ${result.score}%`);
    }, 600);
  };

  const handleApplyCorrection = (finding) => {
    if (!finding.offendingText || !finding.suggestion) return;

    // Replace first occurrence of offendingText with suggestion
    const updated = content.replace(finding.offendingText, finding.suggestion);
    setContent(updated);
    setAppliedCorrections((prev) => ({
      ...prev,
      [finding.id]: true
    }));
    showToast(`Applied suggestion for rule ${finding.ruleId}`);
  };

  const handleSubmitForReview = () => {
    if (!content.trim()) {
      alert('Content cannot be empty.');
      return;
    }

    const { submission } = submitNewContent({
      title: title || 'Draft Social Copy',
      channel,
      department,
      campaign,
      content
    });

    showToast(`Submission ${submission.id} dispatched to Reviewer Queue!`);
    window.dispatchEvent(new Event('unifyra-data-updated'));
    navigate('/review');
  };

  const channels = [
    'Social - Instagram',
    'Social - TikTok',
    'Social - LinkedIn',
    'Email Newsletter',
    'In-Store Signage',
    'Digital Ads',
    'Press Release',
    'Website Blog'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Content for AI Audit"
        subtitle={`Validate marketing and corporate copy against FreshBite brand guidelines, legal claims restrictions, and trademark standards before publication.`}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Gemini AI Engine
          </span>
        }
      />

      {/* Preset Quick-Load Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              Interactive Test Presets (Instant Demo)
            </h3>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            Click a preset below to populate realistic test copy:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DEMO_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className="text-left p-3 rounded-xl bg-white border border-emerald-100 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 leading-snug">
                  {p.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {p.content}
                </p>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-2 block">
                Load this copy &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card
            title="Draft Metadata & Content"
            subtitle="Specify campaign context and input content text for scanning"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Content Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Elixir Instagram Blast"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  >
                    {channels.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Campaign
                  </label>
                  <input
                    type="text"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Content Body Copy *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {content.length} characters • {content.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder="Enter or paste promotional text, social captions, newsletters, or signage copy..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-sans leading-relaxed text-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setContent('');
                    setTitle('');
                    setAuditResult(null);
                    setAppliedCorrections({});
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Form
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunAudit}
                    disabled={isAuditing || !content.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-950/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                    <span>{isAuditing ? 'Analyzing Brand Voice...' : 'Run AI Brand Audit'}</span>
                  </button>

                  {auditResult && (
                    <button
                      type="button"
                      onClick={handleSubmitForReview}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit for Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Analysis & Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {!auditResult ? (
            <div className="h-full min-h-[380px] rounded-2xl border border-dashed border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                AI Compliance Inspection
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Enter your copy or choose one of the test presets above, then click <strong>"Run AI Brand Audit"</strong> to inspect tone, legal claims & trademarks.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited against 26 FreshBite guidelines</span>
              </div>
            </div>
          ) : (
            <Card
              title="AI Brand Audit Report"
              subtitle="Evaluation results across governance dimensions"
              badge={<StatusBadge status={auditResult.status} size="sm" />}
            >
              {/* Score breakdown overview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Overall Compliance
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {auditResult.score}%
                    </h3>
                  </div>
                  <ScoreMeter score={auditResult.score} variant="ring" size="md" showLabel={false} />
                </div>

                {/* Sub Scores */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-semibold block">Tone & Voice</span>
                    <span className="text-xs font-bold text-slate-800">{auditResult.toneScore}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-semibold block">Claims & Law</span>
                    <span className="text-xs font-bold text-slate-800">{auditResult.claimsScore}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-semibold block">Trademarks</span>
                    <span className="text-xs font-bold text-slate-800">{auditResult.trademarkScore}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {auditResult.summary}
                </p>
              </div>

              {/* Findings section */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Findings & Recommendations ({auditResult.findings.length})
                  </h4>
                  {auditResult.findings.length === 0 && (
                    <span className="text-xs text-emerald-700 font-semibold">100% Compliant</span>
                  )}
                </div>

                {auditResult.findings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-950">Zero Violations Detected</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Copy adheres strictly to FreshBite brand values and legal restrictions.
                    </p>
                  </div>
                ) : (
                  auditResult.findings.map((f) => {
                    const isApplied = appliedCorrections[f.id];
                    return (
                      <div
                        key={f.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {f.ruleId}
                          </span>
                          <StatusBadge status={f.severity} size="sm" />
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-0.5">
                            Offending snippet:
                          </span>
                          <span className="text-xs font-medium text-rose-900 bg-rose-50 px-2 py-1 rounded inline-block border border-rose-200">
                            "{f.offendingText}"
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-snug">
                          {f.explanation}
                        </p>

                        {f.suggestion && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                                Suggested Correction:
                              </span>
                              <span className="text-xs font-medium text-emerald-950 block truncate">
                                "{f.suggestion}"
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplyCorrection(f)}
                              disabled={isApplied}
                              className={`shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isApplied
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs'
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Applied</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5" />
                                  <span>Apply</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
