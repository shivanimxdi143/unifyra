import * as api from './api';
import { BRAND_GUIDELINES } from './mockData';

/**
 * Seed initial FreshBite brand guidelines into MongoDB if database has no guidelines
 */
export async function ensureDefaultGuidelines() {
  try {
    const existing = await api.getGuidelines();
    if (existing.data && existing.data.length > 0) {
      return existing.data;
    }

    // Seed defaults into MongoDB Atlas
    const seeded = [];
    for (const g of BRAND_GUIDELINES) {
      const created = await api.createGuideline({
        brandName: 'FreshBite',
        title: g.title,
        category: g.category,
        description: g.description,
        createdBy: 'brand-director@freshbite.com',
        rules: [
          {
            ruleText: g.description,
            severity: g.severity,
            examples: [g.doExample, g.dontExample].filter(Boolean)
          }
        ]
      });
      seeded.push(created.data);
    }
    return seeded;
  } catch (err) {
    console.error('Failed to ensure default guidelines in backend:', err);
    return [];
  }
}

/**
 * Guideline CRUD Helpers
 */
export async function getStoredGuidelines(params = {}) {
  try {
    const res = await api.getGuidelines(params);
    if (!res.data || res.data.length === 0) {
      // If DB is empty, auto-seed defaults for seamless developer experience
      return await ensureDefaultGuidelines();
    }
    return res.data;
  } catch (err) {
    console.error('Failed to fetch guidelines from backend API:', err);
    throw err;
  }
}

export async function createNewGuideline(data) {
  return await api.createGuideline({
    brandName: data.brandName || 'FreshBite',
    title: data.title,
    category: data.category || 'General',
    description: data.description || '',
    createdBy: data.createdBy || 'brand-manager@freshbite.com',
    rules: data.rules || [
      {
        ruleText: data.description || data.title,
        severity: data.severity || 'medium',
        examples: [data.doExample, data.dontExample].filter(Boolean)
      }
    ]
  });
}

export async function updateExistingGuideline(id, data) {
  return await api.updateGuideline(id, {
    title: data.title,
    category: data.category,
    description: data.description,
    rules: [
      {
        ruleText: data.description || data.title,
        severity: data.severity || 'medium',
        examples: [data.doExample, data.dontExample].filter(Boolean)
      }
    ]
  });
}

export async function deleteExistingGuideline(id) {
  return await api.deleteGuideline(id);
}

/**
 * Submissions & Analysis Helpers
 */
export async function getStoredSubmissions(params = {}) {
  try {
    const res = await api.getSubmissions(params);
    return res.data || [];
  } catch (err) {
    console.error('Failed to fetch submissions from backend API:', err);
    throw err;
  }
}

export async function getSubmissionWithFindings(id) {
  const res = await api.getSubmissionById(id);
  return res.data;
}

export async function createAndAnalyzeSubmission({
  content,
  contentType = 'social_post',
  submittedBy = 'Elena Rostova (Social Media Lead)'
}) {
  // Step 1: Create submission in backend (status: 'pending')
  const createdRes = await api.createSubmission({
    submittedBy,
    content,
    contentType
  });
  const submission = createdRes.data;

  // Step 2: Run Gemini brand compliance analysis
  const analysisRes = await api.analyzeSubmission(submission._id);
  const analysisData = analysisRes.data;

  return {
    submission: {
      ...submission,
      status: analysisData.status
    },
    findings: analysisData.findings || []
  };
}

export async function resubmitAndReanalyze(submissionId, {
  content,
  contentType = 'social_post'
}) {
  // Step 1: Update content and reset status to 'pending'
  await api.resubmitContent(submissionId, { content, contentType });

  // Step 2: Re-run Gemini AI brand analysis
  const analysisRes = await api.analyzeSubmission(submissionId);
  return analysisRes.data;
}

/**
 * Review Queue Helpers
 */
export async function getSubmissionsAwaitingReview() {
  try {
    const res = await api.getPendingReviews();
    return res.data || [];
  } catch (err) {
    console.error('Failed to fetch pending reviews from backend:', err);
    throw err;
  }
}

export async function recordReviewDecision(submissionId, {
  reviewerId = 'Certified Brand Reviewer',
  decision,
  comments = ''
}) {
  const res = await api.createReview(submissionId, {
    reviewerId,
    decision,
    comments: comments || `Review decision recorded: ${decision}`
  });
  return res.data;
}

export async function fetchReviewAuditTrail(submissionId) {
  const res = await api.getReviewHistory(submissionId);
  return res.data || [];
}

/**
 * Data reset / baseline restoration for demo
 */
export async function resetApplicationData() {
  return await ensureDefaultGuidelines();
}
