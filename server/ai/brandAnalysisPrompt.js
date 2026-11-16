/**
 * @file brandAnalysisPrompt.js
 * @description Production prompt engineering for Unifyra AI Brand Governance & Intelligence.
 * Formulates system instructions and user prompts to audit content strictly against supplied brand guidelines.
 */

const { VALID_SEVERITIES } = require('./analysisSchema');

/**
 * System instruction defining the core persona, ethical boundaries, and evaluation logic.
 */
const SYSTEM_INSTRUCTION = `You are Unifyra Brand Governance AI, an expert brand intelligence and compliance auditor.
Your job is to objectively analyze submitted marketing, editorial, and corporate copy strictly against a set of provided brand guidelines.

CORE OPERATIONAL PRINCIPLES:
1. STRICT EVIDENCE-BASED AUDITING (ZERO RULE INVENTIONS):
   - You MUST ONLY evaluate the submitted content against the EXPLICITLY SUPPLIED guidelines.
   - Do NOT assume, invent, extrapolate, or hallucinate guidelines, corporate policies, or legal prohibitions that are not provided in the prompt.
   - If the content does not violate any supplied rule, you must return an empty findings array: "findings": [].

2. HUMAN-IN-THE-LOOP SAFEGUARD (ZERO AUTO-APPROVAL):
   - You are an advisory audit engine, NOT the final decision maker.
   - You must NEVER approve, reject, or certify content for publication. Human reviewers make all publishing decisions.
   - Your sole responsibility is to identify objective violations, cite the violated rule, extract exact offending text, explain the issue, and provide constructive corrections.

3. VERBATIM OFFENDING TEXT:
   - "offendingText" MUST be an exact, verbatim substring extracted directly from the submitted content.
   - Do not paraphrase, summarize, or alter the offending text snippet.

4. SEVERITY ASSIGNMENT:
   - "severity" must be strictly one of: "low", "medium", "high", "critical".
   - Honor the severity specified in the guideline rule whenever provided.
   - Guide:
     * "critical": Prohibited medical/cure claims, false dietary/allergen claims, severe regulatory breaches.
     * "high": Trademark misrepresentation, banned buzzwords, false organic/sourcing claims.
     * "medium": Inappropriate brand tone, aggressive clickbait, incorrect tagline punctuation.
     * "low": Minor formatting inconsistencies, advisory phrasing adjustments.

5. ACTIONABLE SUGGESTIONS:
   - "suggestedCorrection" must offer a high-quality, brand-compliant alternative that retains the original creative intent of the author while adhering strictly to the brand standard.

6. OUTPUT FORMAT:
   - You MUST output valid, parseable JSON only. Do not wrap the output in markdown fences (\`\`\`json) if raw JSON is requested.
   - Format:
     {
       "findings": [
         {
           "ruleId": "string (the rule ID from guidelines)",
           "severity": "low | medium | high | critical",
           "offendingText": "verbatim excerpt from content",
           "explanation": "clear, constructive explanation",
           "suggestedCorrection": "recommended replacement text"
         }
       ],
       "overallComplianceScore": 0-100,
       "summary": "concise overview of compliance status"
     }`;

/**
 * Formats Mongoose Guideline documents or plain guideline objects into a clean,
 * structured text representation for the AI model context.
 *
 * Supports:
 * - Guideline documents containing nested `rules` array (@see Guideline.js)
 * - Flattened rule arrays with `ruleText`, `severity`, `examples`, `_id`
 *
 * @param {Array<object>} guidelines - List of guidelines from the database
 * @returns {string} Formatted guidelines text
 */
function formatGuidelinesForPrompt(guidelines = []) {
  if (!Array.isArray(guidelines) || guidelines.length === 0) {
    return 'NO GUIDELINES SUPPLIED. Since no rules were provided, no violations can be flagged.';
  }

  const sections = [];

  guidelines.forEach((item, index) => {
    // If the guideline has nested rules (Mongoose Guideline schema)
    if (Array.isArray(item.rules) && item.rules.length > 0) {
      const header = `### Guideline Group ${index + 1}: ${item.title || 'General'} (${item.category || 'Standard'}) [Brand: ${item.brandName || 'FreshBite'}]`;
      const desc = item.description ? `Description: ${item.description}` : '';

      const ruleEntries = item.rules.map((rule, rIdx) => {
        const ruleId = rule._id ? String(rule._id) : `R-${index + 1}.${rIdx + 1}`;
        const severity = rule.severity || 'medium';
        const examples = Array.isArray(rule.examples) && rule.examples.length > 0
          ? `\n      Examples/Counter-examples: ${rule.examples.join(' | ')}`
          : '';
        return `  - Rule ID: [${ruleId}]\n    Severity: ${severity}\n    Requirement: ${rule.ruleText}${examples}`;
      });

      sections.push([header, desc, ...ruleEntries].filter(Boolean).join('\n'));
    } else {
      // Flat rule structure
      const ruleId = item._id ? String(item._id) : (item.id || `RULE-${index + 1}`);
      const category = item.category ? ` [Category: ${item.category}]` : '';
      const severity = item.severity || 'medium';
      const title = item.title ? ` - ${item.title}` : '';
      const text = item.ruleText || item.description || '';
      const examples = [];
      if (item.doExample) examples.push(`DO: "${item.doExample}"`);
      if (item.dontExample) examples.push(`DON'T: "${item.dontExample}"`);
      if (Array.isArray(item.examples)) examples.push(...item.examples);

      const exampleStr = examples.length > 0 ? `\n    Examples: ${examples.join(' | ')}` : '';

      sections.push(
        `- Rule ID: [${ruleId}]${category}${title}\n  Severity: ${severity}\n  Requirement: ${text}${exampleStr}`
      );
    }
  });

  return sections.join('\n\n');
}

/**
 * Builds the complete prompt payload for brand compliance analysis.
 *
 * @param {object} params
 * @param {string} params.content - The submitted text content to audit
 * @param {string} [params.contentType='social_post'] - Channel/type of content
 * @param {Array<object>} params.guidelines - Array of guidelines from database
 * @param {string} [params.brandName='FreshBite'] - Name of the brand
 * @param {object} [params.metadata={}] - Optional metadata (e.g. campaign, targetAudience)
 * @returns {{ systemInstruction: string, prompt: string }} Payload ready for Gemini API call
 */
function buildBrandAnalysisPrompt({
  content = '',
  contentType = 'social_post',
  guidelines = [],
  brandName = 'FreshBite',
  metadata = {}
}) {
  const formattedGuidelines = formatGuidelinesForPrompt(guidelines);

  const prompt = `You are evaluating submitted content for brand compliance for brand: "${brandName}".

=== OFFICIAL ENFORCED BRAND GUIDELINES ===
${formattedGuidelines}
=========================================

=== CONTENT SUBMITTED FOR AUDIT ===
Content Type: ${contentType}
${metadata.campaign ? `Campaign: ${metadata.campaign}\n` : ''}${metadata.submittedBy ? `Submitted By: ${metadata.submittedBy}\n` : ''}
Text Content:
"""
${content}
"""
====================================

AUDIT INSTRUCTIONS:
1. Examine the submitted text sentence by sentence against the supplied brand guidelines.
2. For each clear violation:
   - Set "ruleId" to the exact Rule ID provided in brackets above.
   - Set "severity" to "low", "medium", "high", or "critical".
   - Extract the exact "offendingText" verbatim from the submitted copy.
   - In "explanation", state specifically why this text breaches the guideline.
   - In "suggestedCorrection", provide an approved, brand-aligned replacement.
3. If the content completely adheres to all supplied guidelines, return:
   {
     "findings": [],
     "overallComplianceScore": 100,
     "summary": "Content complies with all supplied brand guidelines."
   }
4. Calculate "overallComplianceScore" (0 to 100) reflecting severity of violations:
   - Critical: -25 points
   - High: -15 points
   - Medium: -8 points
   - Low: -4 points
   - (Floor at 0 points)
5. Return strictly valid JSON adhering to the specified schema.`;

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt
  };
}

module.exports = {
  SYSTEM_INSTRUCTION,
  VALID_SEVERITIES,
  formatGuidelinesForPrompt,
  buildBrandAnalysisPrompt
};
