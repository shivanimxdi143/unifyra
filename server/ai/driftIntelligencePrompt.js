/**
 * Brand Drift Intelligence Prompt Builder
 * Prepares system instructions and structured violation evidence for Gemini AI guideline refinement
 */

/**
 * Formats aggregated recurring violation clusters for prompt context
 * @param {Array} recurringViolations 
 * @returns {string}
 */
const formatViolationEvidence = (recurringViolations = []) => {
  if (!recurringViolations || recurringViolations.length === 0) {
    return 'No recurring violation patterns detected. Brand adherence is healthy.';
  }

  return recurringViolations
    .map((v, idx) => {
      const samples = (v.sampleOffendingText || []).slice(0, 4).map(s => `"${s}"`).join(', ');
      const channels = (v.affectedChannels || []).join(', ') || 'all channels';
      const ruleRef = v.ruleTitle ? `Associated Rule: "${v.ruleTitle}"` : `Rule ID: ${v.ruleId || 'General'}`;

      return `Cluster #${idx + 1}:
  - Category: ${v.category || 'General Governance'}
  - ${ruleRef}
  - Violation Frequency: ${v.violationCount} occurrences (${v.percentageOfTotal || 0}% of all flagged violations)
  - Affected Channels: ${channels}
  - Sample Offending Snippets: ${samples || 'N/A'}`;
    })
    .join('\n\n');
};

/**
 * Build prompt for generating guideline suggestions from brand drift data
 * @param {Object} params
 * @param {Array} params.recurringViolations - Aggregated violation clusters
 * @param {Array} params.activeGuidelines - Existing brand guidelines
 * @returns {string}
 */
const buildDriftIntelligencePrompt = ({ recurringViolations = [], activeGuidelines = [] }) => {
  const formattedEvidence = formatViolationEvidence(recurringViolations);
  
  const existingRulesSummary = activeGuidelines
    .map(g => `- [${g.category || 'General'}] ${g.title}: ${g.description || ''}`)
    .slice(0, 15)
    .join('\n');

  return `You are Unifyra's Chief Brand Governance Strategist & AI Drift Intelligence Agent.
Your objective is to analyze real recurring brand compliance violations observed across submissions and propose concrete, actionable brand guideline refinements to prevent future brand drift.

=== OBSERVED BRAND DRIFT EVIDENCE (REAL AGGREGATED VIOLATIONS) ===
${formattedEvidence}

=== CURRENT ACTIVE BRAND GUIDELINES (SUMMARY) ===
${existingRulesSummary || 'Standard FreshBite governance rules active.'}

=== DIRECTIVES FOR GUIDELINE REFINEMENTS ===
1. Analyze the observed violation clusters above and identify the root cause of confusion or repeated non-compliance.
2. Formulate 1 to 3 specific, targeted guideline additions or policy clarifications that directly address these recurring patterns.
3. Every suggestion MUST be directly supported by the observed violation evidence. Do NOT invent unsupported statistics, fictional partner farms, or unobserved claims.
4. Provide concrete, realistic DO and DON'T examples derived from the sample offending snippets.
5. Return a strict JSON array of suggestion objects.

=== OUTPUT SCHEMA REQUIREMENTS ===
Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "title": "Clear, concise title for the proposed rule (e.g. 'Mandatory Cross-Contact Kitchen Notice')",
    "category": "Exact category: 'Tone & Voice' | 'Health & Claims' | 'Trademarks & Naming' | 'Promotional Style' | 'Visual Identity'",
    "severity": "'low' | 'medium' | 'high' | 'critical'",
    "proposedRuleText": "The authoritative, unambiguous rule statement for employees to follow.",
    "rationale": "Clear explanation of why this rule is proposed, citing the observed drift pattern and affected channels.",
    "recurringPattern": "Summary of the observed non-compliance pattern (e.g., 'Repeatedly using hyperbolic cure claims in Instagram copy').",
    "suggestedDoExample": "A compliant, high-quality example of how to express this concept.",
    "suggestedDontExample": "A non-compliant example matching the observed offending copy.",
    "confidence": 85
  }
]

Output ONLY the raw JSON array. Do not include markdown code fences (\`\`\`json) or extra commentary.`;
};

module.exports = {
  formatViolationEvidence,
  buildDriftIntelligencePrompt
};
