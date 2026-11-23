const { GoogleGenAI } = require('@google/genai');
const { buildAnalysisPrompt } = require('../ai/brandAnalysisPrompt');
const { buildDriftIntelligencePrompt } = require('../ai/driftIntelligencePrompt');
const { validateFindings } = require('../ai/analysisSchema');

// Fallback models in case of temporary 503 high-demand spikes
const DEFAULT_MODELS = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

/**
 * Perform brand compliance analysis on submitted content and optional image creative using Gemini
 *
 * @param {Object} params
 * @param {string} params.content - Text content to analyze
 * @param {string} params.contentType - Type of content (e.g., 'social_post')
 * @param {Array} params.guidelines - Applicable Guideline documents from MongoDB
 * @param {Object|null} params.image - Optional image creative data { buffer, mimeType }
 * @returns {Promise<Array>} List of validated Finding objects
 */
const analyzeContentWithGemini = async ({ content, contentType = 'social_post', guidelines = [], image = null }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const hasImage = Boolean(image && image.buffer && image.mimeType);
  const prompt = buildAnalysisPrompt({ content: content || '', contentType, guidelines, hasImage });

  // Build multimodal content payload if image is attached
  let contents = prompt;
  if (hasImage) {
    contents = [
      prompt,
      {
        inlineData: {
          data: image.buffer.toString('base64'),
          mimeType: image.mimeType
        }
      }
    ];
  }

  // Determine candidate models
  const configuredModel = process.env.GEMINI_MODEL;
  const candidateModels = configuredModel
    ? [configuredModel, ...DEFAULT_MODELS.filter(m => m !== configuredModel)]
    : DEFAULT_MODELS;

  let rawResponseText = null;
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1 // Low temperature for deterministic audit findings
        }
      });

      if (response && response.text) {
        rawResponseText = response.text.trim();
        break;
      }
    } catch (err) {
      lastError = err;
      // If 503 (high demand) or 404 (model changed), try next model candidate
      const isRecoverable = err.message && (err.message.includes('503') || err.message.includes('404') || err.message.includes('demand'));
      if (isRecoverable) {
        continue;
      }
      throw new Error(`Gemini API error: ${err.message || 'Unknown API failure'}`);
    }
  }

  if (!rawResponseText) {
    throw new Error(
      `Gemini analysis failed across candidate models: ${lastError ? lastError.message : 'Empty response received'}`
    );
  }

  // Parse JSON response safely
  let parsedFindings;
  try {
    // Strip markdown code fences if model included them despite json mime type
    const cleanedJson = rawResponseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    parsedFindings = JSON.parse(cleanedJson);
  } catch (parseErr) {
    throw new Error(`Failed to parse Gemini response as JSON: ${parseErr.message}`);
  }

  // Extract all rule _ids from provided guidelines for reference validation
  const availableRuleIds = [];
  guidelines.forEach(g => {
    if (Array.isArray(g.rules)) {
      g.rules.forEach(r => {
        if (r._id) availableRuleIds.push(r._id.toString());
      });
    } else if (g && g._id) {
      availableRuleIds.push(g._id.toString());
    }
  });

  // Validate structured findings against schema
  const validatedFindings = validateFindings(parsedFindings, availableRuleIds);

  return validatedFindings;
};

/**
 * Generate actionable guideline suggestions from observed brand drift violation clusters using Gemini
 *
 * @param {Object} params
 * @param {Array} params.recurringViolations - Aggregated violation patterns
 * @param {Array} params.activeGuidelines - Existing guideline documents
 * @returns {Promise<Array>} List of validated GuidelineSuggestion objects
 */
const generateDriftGuidelineSuggestions = async ({ recurringViolations = [], activeGuidelines = [] }) => {
  if (!recurringViolations || recurringViolations.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const prompt = buildDriftIntelligencePrompt({ recurringViolations, activeGuidelines });

  const configuredModel = process.env.GEMINI_MODEL;
  const candidateModels = configuredModel
    ? [configuredModel, ...DEFAULT_MODELS.filter(m => m !== configuredModel)]
    : DEFAULT_MODELS;

  let rawResponseText = null;
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      if (response && response.text) {
        rawResponseText = response.text.trim();
        break;
      }
    } catch (err) {
      lastError = err;
      const isRecoverable = err.message && (err.message.includes('503') || err.message.includes('404') || err.message.includes('demand'));
      if (isRecoverable) continue;
      break;
    }
  }

  if (!rawResponseText) {
    // If Gemini is unreachable or experiencing quota limits, synthesize actionable suggestions directly from the top clusters
    return recurringViolations.slice(0, 3).map((cluster, idx) => ({
      title: `${cluster.category} Standard Clarification`,
      category: cluster.category || 'Tone & Voice',
      severity: cluster.severity || 'medium',
      proposedRuleText: `Ensure strict adherence to ${cluster.category} specifications; explicitly avoid patterns such as ${cluster.sampleOffendingText?.[0] ? `"${cluster.sampleOffendingText[0]}"` : 'unsupported claims'}.`,
      rationale: `Proposed in response to ${cluster.violationCount} recurring violations observed across ${(cluster.affectedChannels || []).join(', ') || 'communication channels'}.`,
      recurringPattern: `Recurring non-compliance in ${cluster.category} (${cluster.violationCount} instances).`,
      suggestedDoExample: 'Craft content emphasizing honest, natural wellness without exaggerated claims.',
      suggestedDontExample: cluster.sampleOffendingText?.[0] || 'Unapproved promotional copy',
      confidence: Math.min(95, Math.max(75, 75 + (cluster.violationCount || 1) * 3))
    }));
  }

  let parsed;
  try {
    const cleaned = rawResponseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    throw new Error(`Failed to parse Gemini drift intelligence response: ${parseErr.message}`);
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  const validCategories = ['Tone & Voice', 'Health & Claims', 'Trademarks & Naming', 'Promotional Style', 'Visual Identity'];
  const validSeverities = ['low', 'medium', 'high', 'critical'];

  return parsed.map((item, idx) => {
    let category = (item.category || '').trim();
    if (!validCategories.includes(category)) {
      category = 'Tone & Voice';
    }

    let severity = (item.severity || 'medium').toLowerCase().trim();
    if (!validSeverities.includes(severity)) {
      severity = 'medium';
    }

    return {
      title: (item.title || `Guideline Refinement #${idx + 1}`).trim(),
      category,
      severity,
      proposedRuleText: (item.proposedRuleText || item.ruleText || '').trim(),
      rationale: (item.rationale || 'Proposed to mitigate recurring brand drift.').trim(),
      recurringPattern: (item.recurringPattern || '').trim(),
      suggestedDoExample: (item.suggestedDoExample || item.doExample || '').trim(),
      suggestedDontExample: (item.suggestedDontExample || item.dontExample || '').trim(),
      confidence: typeof item.confidence === 'number' ? Math.max(50, Math.min(100, item.confidence)) : 85
    };
  }).filter(item => Boolean(item.proposedRuleText));
};

module.exports = {
  analyzeContentWithGemini,
  generateDriftGuidelineSuggestions
};
