/**
 * Analysis Schema Definition
 * Defines the structured JSON contract for Gemini brand governance findings
 */

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Validates an array of findings returned by the AI
 * @param {Array} findings
 * @param {Array} availableRules - optional list of known rule IDs to map against
 * @returns {Array} cleaned and validated findings
 */
const validateFindings = (findings, availableRuleIds = []) => {
  if (!Array.isArray(findings)) {
    throw new Error('AI response must be an array of findings');
  }

  return findings.map((f, idx) => {
    if (!f || typeof f !== 'object') {
      throw new Error(`Finding at index ${idx} is not a valid object`);
    }

    // Validate and sanitize severity
    let severity = (f.severity || 'medium').toString().toLowerCase().trim();
    if (!VALID_SEVERITIES.includes(severity)) {
      severity = 'medium';
    }

    // Validate offendingText (or synthesize visual label if visualArea is provided)
    let offendingText = (f.offendingText || '').toString().trim();
    const visualArea = (f.visualArea || f.region || '').toString().trim();
    if (!offendingText && visualArea) {
      offendingText = `[Visual: ${visualArea}]`;
    }
    if (!offendingText) {
      offendingText = visualArea ? `[Visual: ${visualArea}]` : '[Visual Brand Finding]';
    }

    // Validate explanation
    const explanation = (f.explanation || '').toString().trim();
    if (!explanation) {
      throw new Error(`Finding at index ${idx} is missing required 'explanation'`);
    }

    // Validate suggestedCorrection
    const suggestedCorrection = (f.suggestedCorrection || '').toString().trim();

    // Validate or match ruleId
    let ruleId = null;
    if (f.ruleId) {
      const cleanRuleId = f.ruleId.toString().replace(/\[Rule ID:\s*|\s*\]/gi, '').trim();
      if (availableRuleIds.some(id => id.toString() === cleanRuleId)) {
        ruleId = cleanRuleId;
      }
    }

    return {
      ruleId,
      severity,
      offendingText,
      explanation,
      suggestedCorrection,
      visualArea: visualArea || null
    };
  });
};

module.exports = {
  VALID_SEVERITIES,
  validateFindings
};
