import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Send,
  Wand2,
  ShieldCheck,
  Check,
  ImageIcon,
  Upload,
  ImagePlus,
  X,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import ScoreMeter from '../components/common/ScoreMeter';
import { DEMO_PRESETS } from '../services/mockData';
import {
  createAndAnalyzeSubmission,
  resubmitAndReanalyze,
  ensureDefaultGuidelines
} from '../services/contentService';
import { getErrorMessage } from '../services/api';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';

export default function SubmitContent() {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('social_post');
  const [department, setDepartment] = useState('Digital Marketing');
  const [campaign, setCampaign] = useState('Summer Vitality 2026');
  const [content, setContent] = useState('');

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageValidationError, setImageValidationError] = useState(null);

  // AI Audit & Submission State
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [appliedCorrections, setAppliedCorrections] = useState({});
  const [auditError, setAuditError] = useState(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle incoming resubmission request from SubmissionHistory
  useEffect(() => {
    if (location.state?.resubmitSubmission) {
      const target = location.state.resubmitSubmission;
      Promise.resolve().then(() => {
        setCurrentSubmission({
          _id: target._id,
          id: target.id,
          status: target.status
        });
        if (target.content) setContent(target.content);
        if (target.contentType) setContentType(target.contentType);
        if (target.title) setTitle(target.title);
        showToast(`Loaded ${target.id || 'submission'} for resubmission. Update content and run fresh audit.`);
      });
    }
  }, [location.state, showToast]);

  const contentTypes = [
    { value: 'social_post', label: 'Social Post (Instagram, TikTok, LinkedIn)' },
    { value: 'email', label: 'Email Newsletter' },
    { value: 'ad_copy', label: 'Digital Ad Copy (Meta, Google)' },
    { value: 'blog_post', label: 'Blog Article / Story' },
    { value: 'website_copy', label: 'Website Landing Page Copy' },
    { value: 'press_release', label: 'Corporate Press Release' },
    { value: 'other', label: 'In-Store Signage / Creative Poster' }
  ];

  // Image File Handling
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageValidationError(null);

    // Validate MIME type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setImageValidationError('Invalid file format. Only PNG, JPG, and JPEG images are supported for visual auditing.');
      return;
    }

    // Validate size (max 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageValidationError(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    showToast(`Creative "${file.name}" attached. Visual audit mode enabled.`);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageValidationError(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Preset selector
  const handleSelectPreset = (preset) => {
    setTitle(preset.title);
    if (preset.channel.includes('Instagram') || preset.channel.includes('Social') || preset.channel.includes('LinkedIn')) {
      setContentType('social_post');
    } else if (preset.channel.includes('Email')) {
      setContentType('email');
    } else if (preset.channel.includes('Ad')) {
      setContentType('ad_copy');
    } else {
      setContentType('social_post');
    }

    setDepartment(preset.department);
    setCampaign(preset.campaign);
    setContent(preset.content);
    handleRemoveImage();
    setCurrentSubmission(null);
    setAuditResult(null);
    setAuditError(null);
    setAppliedCorrections({});
    showToast(`Loaded preset: "${preset.title}"`);
  };

  const handleRunAudit = async () => {
    if (!content.trim() && !selectedImage) {
      alert('Please enter marketing copy or attach an image creative to audit.');
      return;
    }

    setIsAuditing(true);
    setAuditError(null);
    setAppliedCorrections({});

    try {
      // Ensure there are guidelines in DB before running analysis
      await ensureDefaultGuidelines();

      let activeSub = currentSubmission;
      let rawFindings = [];

      if (!activeSub) {
        // Step 1: Create submission & run initial Gemini multimodal analysis
        const result = await createAndAnalyzeSubmission({
          content: content.trim(),
          contentType,
          submittedBy: 'Elena Rostova (Social Media Lead)',
          imageFile: selectedImage
        });
        activeSub = result.submission;
        rawFindings = result.findings;
        setCurrentSubmission(activeSub);
      } else {
        // Resubmit and re-analyze existing submission
        const result = await resubmitAndReanalyze(activeSub._id, {
          content: content.trim(),
          contentType,
          imageFile: selectedImage
        });
        rawFindings = result.findings || [];
        setCurrentSubmission(prev => ({ ...prev, status: result.status || 'analyzed' }));
      }

      // Compute compliance scores from real findings
      let penalty = 0;
      let criticalCount = 0;
      let highCount = 0;
      let mediumCount = 0;

      rawFindings.forEach((f) => {
        if (f.severity === 'critical') {
          penalty += 24;
          criticalCount++;
        } else if (f.severity === 'high') {
          penalty += 14;
          highCount++;
        } else if (f.severity === 'medium') {
          penalty += 8;
          mediumCount++;
        } else {
          penalty += 4;
        }
      });

      const overallScore = Math.max(25, Math.min(100, 100 - penalty));
      const toneScore = Math.max(30, Math.min(100, Math.round(100 - (criticalCount * 20 + highCount * 12 + mediumCount * 6))));
      const claimsScore = Math.max(25, Math.min(100, Math.round(100 - (criticalCount * 30 + highCount * 10))));
      const trademarkScore = Math.max(35, Math.min(100, Math.round(100 - (highCount * 15 + mediumCount * 8))));

      setAuditResult({
        score: overallScore,
        status: 'analyzed', // AI analyzes; never auto-approves
        toneScore,
        claimsScore,
        trademarkScore,
        hasImage: Boolean(selectedImage),
        summary:
          rawFindings.length === 0
            ? selectedImage
              ? 'Outstanding brand alignment. Both your copy and visual creative adhere to FreshBite brand identity, typography, and legal standards.'
              : 'Outstanding brand alignment. Content complies with FreshBite tone, legal claims, trademark designations, and promotional standards.'
            : `${rawFindings.length} brand guideline ${rawFindings.length === 1 ? 'violation' : 'violations'} identified by Gemini AI${selectedImage ? ' (including visual identity auditing)' : ''}. Review recommendations and dispatch to the human review queue.`,
        findings: rawFindings.map((f, idx) => ({
          id: f._id || `f-${idx}`,
          ruleId: f.ruleId ? String(f.ruleId).slice(-6) : 'BRAND',
          ruleTitle: f.ruleId ? `Rule #${String(f.ruleId).slice(-6)}` : 'Brand Governance Rule',
          severity: f.severity,
          offendingText: f.offendingText,
          explanation: f.explanation,
          suggestion: f.suggestedCorrection,
          visualArea: f.visualArea || null
        }))
      });

      showToast(`AI brand audit complete. Ready for human review (Score: ${overallScore}%).`);
    } catch (err) {
      const msg = getErrorMessage(err);
      setAuditError(msg);
      showToast(`Analysis error: ${msg}`);
    } finally {
      setIsAuditing(false);
    }
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

    const subIdDisplay = currentSubmission?._id
      ? `#${currentSubmission._id.slice(-6)}`
      : '';
    showToast(`Submission ${subIdDisplay} dispatched to Reviewer Queue!`);
    window.dispatchEvent(new Event('unifyra-data-updated'));
    navigate('/review');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Content for AI Audit"
        subtitle={`Validate draft marketing copy against FreshBite brand guidelines, claims rules, and trademark standards before release.`}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            AI Audit Engine
          </span>
        }
      />

      {/* Preset Quick-Load Banner */}
      <div className="bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              Try a Sample (Instant Demo)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Select any sample copy below to immediately test the AI compliance audit:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DEMO_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className="text-left p-3 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 leading-snug">
                  {p.label}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {p.content}
                </p>
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold mt-2 block">
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
            title="Draft Content"
            subtitle="Enter your draft copy and select the communication channel"
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
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Content Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Content Type *
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    {contentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Content Body Copy {selectedImage ? '(Optional when image is attached)' : '*'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {content.length} characters • {content.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Enter or paste promotional text, social captions, newsletters, ad slogans, or in-store signage..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed text-slate-900"
                />
              </div>

              {/* Visual Brand Creative Upload Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <label className="text-xs font-bold text-slate-800">
                      Marketing Creative / Image Asset (Optional)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    PNG, JPG, JPEG • Max 5 MB
                  </span>
                </div>

                {imageValidationError && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{imageValidationError}</span>
                  </div>
                )}

                {!selectedImage ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 flex items-center justify-center mb-2 shadow-2xs transition-colors">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">
                      Click to browse or drop marketing creative
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Audits logo presence, brand colors, typography hierarchy, and visual layout
                    </p>
                  </label>
                ) : (
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {imagePreviewUrl && (
                          <img
                            src={imagePreviewUrl}
                            alt="Attached Creative Preview"
                            className="w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {selectedImage.name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatFileSize(selectedImage.size)} • {selectedImage.type || 'Image'}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full mt-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ready for Multimodal Audit
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors shadow-2xs">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          Replace
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-100/60 border border-indigo-200/80 flex items-center gap-2 text-[11px] text-indigo-900 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>
                        <strong>Visual Compliance Engine Active:</strong> Gemini 2.5 Flash will inspect logo clarity, color contrast, and layout hierarchy.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setContent('');
                    setTitle('');
                    handleRemoveImage();
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
                    disabled={isAuditing || (!content.trim() && !selectedImage)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-950/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                    <span>
                      {isAuditing
                        ? selectedImage
                          ? 'Auditing Copy & Image...'
                          : 'Auditing Brand Guidelines...'
                        : selectedImage
                        ? 'Run Multimodal Audit'
                        : 'Run AI Brand Audit'}
                    </span>
                  </button>

                  {auditResult && (
                    <button
                      type="button"
                      onClick={handleSubmitForReview}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send to Review Queue</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Analysis Status Display & Findings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {auditError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-2xs">
              <p className="font-bold mb-1">AI Audit Service Notice</p>
              <p>{auditError}</p>
            </div>
          )}

          {!auditResult ? (
            <div className="h-full min-h-[380px] rounded-2xl border border-dashed border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-2xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                AI Compliance Inspection
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Enter your copy or choose one of the test presets above, then click <strong>"Run AI Brand Audit"</strong> to inspect tone, legal claims, and trademarks.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Audited against 26 FreshBite rules</span>
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {f.ruleId}
                            </span>
                            {f.visualArea && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-purple-600" />
                                <span>Visual: {f.visualArea}</span>
                              </span>
                            )}
                          </div>
                          <StatusBadge status={f.severity} size="sm" />
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-0.5">
                            {f.visualArea ? 'Visual Element Flagged:' : 'Offending snippet:'}
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
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                                Suggested Correction:
                              </span>
                              <span className="text-xs font-medium text-slate-900 block truncate">
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
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
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
