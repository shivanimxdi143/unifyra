const { GoogleGenAI } = require('@google/genai');
const { buildAnalysisPrompt } = require('../ai/brandAnalysisPrompt');
const { validateFindings } = require('../ai/analysisSchema');

// Fallback models in case of temporary 503 high-demand spikes
const DEFAULT_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash'];

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

module.exports = {
  analyzeContentWithGemini
};
