/**
 * Brand Analysis Prompt Builder
 * Prepares system instructions and structured context for Gemini AI brand analysis
 */

/**
 * Format guidelines into structured text for prompt context
 * @param {Array} guidelines
 * @returns {string}
 */
const formatGuidelinesForPrompt = (guidelines) => {
  if (!guidelines || guidelines.length === 0) {
    return 'No guidelines provided.';
  }

  return guidelines
    .map((g, gIdx) => {
      const header = `Guideline ${gIdx + 1}: ${g.title} (${g.brandName} - Category: ${g.category})`;
      const desc = g.description ? `Description: ${g.description}` : '';
      const rulesList = (g.rules || [])
        .map((r, rIdx) => {
          const ruleId = r._id ? `[Rule ID: ${r._id}]` : `[Rule #${rIdx + 1}]`;
          const ex = r.examples && r.examples.length > 0 ? `Examples: ${r.examples.join(' | ')}` : '';
          return `  - ${ruleId} (${r.severity.toUpperCase()} severity): "${r.ruleText}" ${ex}`;
        })
        .join('\n');

      return `${header}\n${desc}\nRules:\n${rulesList || '  - No specific sub-rules defined.'}`;
    })
    .join('\n\n');
};

/**
 * Build the full prompt for Gemini
 * @param {Object} params
 * @param {string} params.content - Submitted text
 * @param {string} params.contentType - e.g. 'social_post', 'email'
 * @param {Array} params.guidelines - Array of Guideline documents
 * @returns {string}
 */
const buildAnalysisPrompt = ({ content, contentType = 'content', guidelines = [] }) => {
  const formattedGuidelines = formatGuidelinesForPrompt(guidelines);

  return `You are Unifyra's AI Brand Governance & Compliance Auditor.
Your job is to rigorously review submitted content against approved Brand Guidelines and identify every brand guideline violation or risk.

CRITICAL INSTRUCTIONS:
1. Examine the submitted ${contentType} thoroughly against all provided brand rules.
2. If the content complies with all brand guidelines, return an empty JSON array: [].
3. For EVERY violation, return an object in the JSON array with:
   - "ruleId": The exact [Rule ID: <id>] hex string from the guideline rule violated, or null if it violates the overall brand principle.
   - "severity": Must be one of "low", "medium", "high", or "critical" based on how severe the brand risk is.
   - "offendingText": The EXACT word, phrase, or sentence from the submitted content that causes the violation.
   - "explanation": A clear, objective explanation of why this text violates the specific brand rule.
   - "suggestedCorrection": A specific, brand-compliant rewrite or alternative phrasing.
4. Output ONLY valid JSON array with no markdown code fences, backticks, or other text outside the JSON.

--- APPROVED BRAND GUIDELINES ---
${formattedGuidelines}

--- SUBMITTED CONTENT (${contentType.toUpperCase()}) ---
"${content}"
`;
};

module.exports = {
  formatGuidelinesForPrompt,
  buildAnalysisPrompt
};
