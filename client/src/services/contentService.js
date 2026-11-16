import {
  BRAND_GUIDELINES,
  SUBMISSION_HISTORY
} from './mockData';

const SUBMISSIONS_STORAGE_KEY = 'unifyra_freshbite_submissions';
const GUIDELINES_STORAGE_KEY = 'unifyra_freshbite_guidelines';

export function getStoredSubmissions() {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse stored submissions, falling back to mock data', err);
  }
  return SUBMISSION_HISTORY;
}

export function saveSubmissions(submissions) {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  } catch (err) {
    console.warn('Failed to save submissions to localStorage', err);
  }
}

export function getStoredGuidelines() {
  try {
    const raw = localStorage.getItem(GUIDELINES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse stored guidelines, falling back to mock data', err);
  }
  return BRAND_GUIDELINES;
}

export function saveGuidelines(guidelines) {
  try {
    localStorage.setItem(GUIDELINES_STORAGE_KEY, JSON.stringify(guidelines));
  } catch (err) {
    console.warn('Failed to save guidelines to localStorage', err);
  }
}

export function updateGuideline(id, updatedData) {
  const guidelines = getStoredGuidelines();
  const index = guidelines.findIndex((g) => g.id === id);
  if (index === -1) return null;

  const updated = {
    ...guidelines[index],
    ...updatedData,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  guidelines[index] = updated;
  saveGuidelines(guidelines);
  return updated;
}

/**
 * Intelligent client-side rule evaluation simulating the Gemini AI Brand Governance model.
 */
export function analyzeContentWithAI(text = '', _metadata = {}) {
  const content = text.trim();
  if (!content) {
    return {
      score: 100,
      status: 'approved',
      toneScore: 100,
      claimsScore: 100,
      trademarkScore: 100,
      summary: 'No content to analyze.',
      findings: []
    };
  }

  const findings = [];
  const lower = content.toLowerCase();

  // Rule BG-201: Unsubstantiated medical claims & detox
  const medicalRegex = /\b(cure|cures|curing|cure-all|miracle|detox|detoxifies|flushes all toxins|eliminates all toxins|chronic inflammation|burn fat|guaranteed to)\b/i;
  const medicalMatch = content.match(medicalRegex);
  if (medicalMatch) {
    findings.push({
      id: `f-${Date.now()}-1`,
      ruleId: 'BG-201',
      ruleTitle: 'Zero Unsubstantiated Medical Claims',
      severity: 'critical',
      offendingText: medicalMatch[0],
      explanation: `Use of medical or miracle promise "${medicalMatch[0]}" violates FreshBite brand standard and FDA guidelines. Food products must not promise medical cures.`,
      suggestion: 'naturally nourishes and supports daily energy with cold-pressed vitamins'
    });
  }

  // Rule BG-102: Corporate jargon
  const jargonRegex = /\b(synergy|synergies|disrupt|disruptive|paradigm-shifting|paradigm shift|leverage|leveraging|monetize|bioperformance|ecosystem)\b/i;
  const jargonMatch = content.match(jargonRegex);
  if (jargonMatch) {
    findings.push({
      id: `f-${Date.now()}-2`,
      ruleId: 'BG-102',
      ruleTitle: 'Banned Corporate Jargon & Fluff',
      severity: 'high',
      offendingText: jargonMatch[0],
      explanation: `Corporate buzzword "${jargonMatch[0]}" contradicts FreshBite's honest, welcoming, community-first voice.`,
      suggestion: 'partner directly with local organic growers'
    });
  }

  // Rule BG-401: Non-hype promotional style
  const hypeRegex = /\b(crazy blowout|blowout sale|stop scrolling|act now|hurry before it's gone|buy now or regret|insane discount)\b/i;
  const hypeMatch = content.match(hypeRegex);
  const excessiveExclamation = (content.match(/!{2,}/g) || []).length > 0;
  if (hypeMatch || excessiveExclamation) {
    findings.push({
      id: `f-${Date.now()}-3`,
      ruleId: 'BG-401',
      ruleTitle: 'Respectful, Non-Hype Promotional Phrasing',
      severity: 'medium',
      offendingText: hypeMatch ? hypeMatch[0] : 'Multiple exclamation points (!!!)',
      explanation: 'Overly aggressive sales tactics and high-pressure urgency dilute brand trust.',
      suggestion: 'Celebrate the weekend with an exclusive seasonal welcome offer.'
    });
  }

  // Rule BG-301: Trademark capitalisation
  const trademarkMissing = [
    { target: 'farm to bowl', correct: 'Farm-to-Bowl™' },
    { target: 'harvest protein bowl', correct: 'Harvest Protein Bowl™' },
    { target: 'green glow elixir', correct: 'Green Glow Elixir™' },
    { target: 'avocado crisp tartine', correct: 'Avocado Crisp Tartine™' },
    { target: 'green miracle elixir', correct: 'Green Glow Elixir™' }
  ];

  trademarkMissing.forEach((item, idx) => {
    if (lower.includes(item.target)) {
      findings.push({
        id: `f-${Date.now()}-tm-${idx}`,
        ruleId: 'BG-301',
        ruleTitle: 'Protected Trademarks & Signature Item Capitalization',
        severity: 'high',
        offendingText: item.target,
        explanation: `Signature item name "${item.target}" must use official title capitalization and trademark symbol.`,
        suggestion: item.correct
      });
    }
  });

  // Rule BG-302: Slogan Integrity
  if (lower.includes('real food pure energy') || lower.includes('real food, pure energy!')) {
    if (!content.includes('Real Food, Pure Energy.')) {
      findings.push({
        id: `f-${Date.now()}-slogan`,
        ruleId: 'BG-302',
        ruleTitle: 'Official Tagline Punctuation & Integrity',
        severity: 'medium',
        offendingText: 'Tagline variation',
        explanation: 'FreshBite brand tagline must strictly be written as "Real Food, Pure Energy." with a comma and period.',
        suggestion: 'Real Food, Pure Energy.'
      });
    }
  }

  // Calculate score deductions
  let penalty = 0;
  let tonePenalty = 0;
  let claimsPenalty = 0;
  let tmPenalty = 0;

  findings.forEach(f => {
    let pts = 0;
    if (f.severity === 'critical') pts = 24;
    else if (f.severity === 'high') pts = 14;
    else if (f.severity === 'medium') pts = 8;
    else pts = 4;

    penalty += pts;

    if (f.ruleId.startsWith('BG-10')) tonePenalty += pts * 1.5;
    if (f.ruleId.startsWith('BG-20')) claimsPenalty += pts * 1.8;
    if (f.ruleId.startsWith('BG-30')) tmPenalty += pts * 1.3;
    if (f.ruleId.startsWith('BG-40')) tonePenalty += pts;
  });

  const overallScore = Math.max(25, Math.min(100, 100 - penalty));
  const toneScore = Math.max(30, Math.min(100, Math.round(100 - tonePenalty)));
  const claimsScore = Math.max(25, Math.min(100, Math.round(100 - claimsPenalty)));
  const trademarkScore = Math.max(35, Math.min(100, Math.round(100 - tmPenalty)));

  let status = 'approved';
  if (overallScore < 75 || findings.some(f => f.severity === 'critical')) {
    status = 'changes_requested';
  } else if (overallScore < 92 || findings.length > 0) {
    status = 'pending';
  }

  let summary = '';
  if (findings.length === 0) {
    summary = 'Outstanding brand alignment. Content complies with FreshBite tone, legal claims, trademark designations, and promotional standards.';
  } else if (findings.some(f => f.severity === 'critical')) {
    summary = 'Critical compliance violations detected. Unsubstantiated claims or high-risk language must be revised before publishing.';
  } else {
    summary = `${findings.length} brand guideline optimization ${findings.length === 1 ? 'item' : 'items'} identified. Review suggestions to improve brand consistency score.`;
  }

  return {
    score: overallScore,
    status,
    toneScore,
    claimsScore,
    trademarkScore,
    summary,
    findings
  };
}

export function submitNewContent({
  title,
  channel,
  department,
  campaign,
  content,
  submitter = { name: 'Elena Rostova', role: 'Social Media Lead' }
}) {
  const analysis = analyzeContentWithAI(content, { title, channel });
  const submissions = getStoredSubmissions();

  const newSubmission = {
    id: `SUB-2026-${String(submissions.length + 90).padStart(3, '0')}`,
    title: title || 'Untitled Draft Content',
    submitter: {
      name: submitter.name || 'Elena Rostova',
      role: submitter.role || 'Content Creator',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    channel: channel || 'Social - Instagram',
    department: department || 'Marketing',
    campaign: campaign || 'General Campaign',
    submittedAt: new Date().toISOString(),
    status: analysis.status === 'approved' ? 'pending' : analysis.status,
    score: analysis.score,
    content,
    findingsCount: analysis.findings.length,
    findings: analysis.findings,
    reviewerNotes: ''
  };

  const updated = [newSubmission, ...submissions];
  saveSubmissions(updated);
  return { submission: newSubmission, analysis };
}

export function updateReviewStatus(submissionId, newStatus, notes = '') {
  const submissions = getStoredSubmissions();
  const index = submissions.findIndex(s => s.id === submissionId);
  if (index === -1) return null;

  const updatedSub = {
    ...submissions[index],
    status: newStatus,
    reviewerNotes: notes,
    reviewedAt: new Date().toISOString()
  };

  submissions[index] = updatedSub;
  saveSubmissions(submissions);
  return updatedSub;
}

export function resetApplicationData() {
  saveSubmissions(SUBMISSION_HISTORY);
  saveGuidelines(BRAND_GUIDELINES);
  return { submissions: SUBMISSION_HISTORY, guidelines: BRAND_GUIDELINES };
}
