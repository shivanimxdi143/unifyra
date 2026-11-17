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

    // Validate offendingText
    const offendingText = (f.offendingText || '').toString().trim();
    if (!offendingText) {
      throw new Error(`Finding at index ${idx} is missing required 'offendingText'`);
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
    if (f.ruleId && availableRuleIds.some(id => id.toString() === f.ruleId.toString())) {
      ruleId = f.ruleId;
    }

    return {
      ruleId,
      severity,
      offendingText,
      explanation,
      suggestedCorrection
    };
  });
};

module.exports = {
  VALID_SEVERITIES,
  validateFindings
};
