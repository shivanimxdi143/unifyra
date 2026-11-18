/**
 * Brand Analysis Prompt Builder
 * Prepares system instructions and structured context for Gemini AI brand analysis
 */

/**
 * Normalizes input guidelines into structured category groupings.
 * Handles both Mongoose Guideline documents (with .rules array)
 * and flat rule arrays (with .ruleText directly).
 *
 * @param {Array} guidelines
 * @returns {Array} Array of normalized guideline category objects
 */
const normalizeGuidelines = (guidelines) => {
  if (!guidelines || !Array.isArray(guidelines)) return [];

  const categoryMap = new Map();

  guidelines.forEach((item, idx) => {
    if (!item) return;

    // Case 1: Mongoose Guideline document containing a rules subdocument array
    if (Array.isArray(item.rules) && item.rules.length > 0) {
      const catKey = item.category || item.title || `Category ${idx + 1}`;
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          title: item.title || catKey,
          brandName: item.brandName || 'FreshBite',
          category: item.category || catKey,
          description: item.description || '',
          rules: []
        });
      }
      const catObj = categoryMap.get(catKey);
      item.rules.forEach((r, rIdx) => {
        catObj.rules.push({
          _id: r._id ? r._id.toString() : null,
          ruleText: r.ruleText,
          severity: (r.severity || 'medium').toLowerCase(),
          examples: Array.isArray(r.examples) ? r.examples : []
        });
      });
    }
    // Case 2: Flat rule object (e.g. STANDARD_FRESHBITE_GUIDELINES)
    else if (item.ruleText) {
      const catKey = item.category || 'General Governance';
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          title: catKey,
          brandName: item.brandName || 'FreshBite',
          category: catKey,
          description: `Brand standards for ${catKey}`,
          rules: []
        });
      }
      const catObj = categoryMap.get(catKey);
      catObj.rules.push({
        _id: item._id ? item._id.toString() : null,
        ruleText: item.ruleText,
        severity: (item.severity || 'medium').toLowerCase(),
        examples: Array.isArray(item.examples) ? item.examples : []
      });
    }
    // Case 3: Empty or header-only guideline document
    else if (item.title) {
      const catKey = item.category || item.title;
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          title: item.title,
          brandName: item.brandName || 'FreshBite',
          category: item.category || catKey,
          description: item.description || '',
          rules: []
        });
      }
    }
  });

  return Array.from(categoryMap.values());
};

/**
 * Format guidelines into structured text for prompt context
 * @param {Array} guidelines
 * @returns {string}
 */
const formatGuidelinesForPrompt = (guidelines) => {
  const normalized = normalizeGuidelines(guidelines);
  if (normalized.length === 0) {
    return 'No guidelines provided.';
  }

  return normalized
    .map((g, gIdx) => {
      const header = `Guideline Category ${gIdx + 1}: ${g.title} (${g.brandName} - Category: ${g.category})`;
      const desc = g.description ? `Description: ${g.description}` : '';
      const rulesList = (g.rules || [])
        .map((r, rIdx) => {
          const ruleId = r._id ? `[Rule ID: ${r._id}]` : `[Rule #${rIdx + 1}]`;
          const ex = r.examples && r.examples.length > 0 ? ` | Examples: ${r.examples.join(' | ')}` : '';
          return `  - ${ruleId} (${r.severity.toUpperCase()} severity): "${r.ruleText}"${ex}`;
        })
        .join('\n');

      return `${header}\n${desc ? desc + '\n' : ''}Rules:\n${rulesList || '  - No specific sub-rules defined.'}`;
    })
    .join('\n\n');
};

/**
 * Build the full prompt for Gemini
 * @param {Object} params
 * @param {string} params.content - Submitted text
 * @param {string} params.contentType - e.g. 'social_post', 'email'
 * @param {Array} params.guidelines - Array of Guideline documents or rule objects
 * @returns {string}
 */
const buildAnalysisPrompt = ({ content, contentType = 'content', guidelines = [] }) => {
  const formattedGuidelines = formatGuidelinesForPrompt(guidelines);

  return `You are Unifyra's AI Brand Governance & Compliance Auditor.
Your job is to rigorously review submitted content against approved Brand Guidelines and identify every brand guideline violation or risk.

=== CORE BRAND STANDARDS & GOVERNANCE SPECIFICATIONS ===
Pay meticulous attention to the following specific brand standards:

1. TRADEMARKS & SIGNATURE ITEM NAMING (HIGH SEVERITY):
   - Signature menu items MUST strictly use proper Title Casing AND include the trademark symbol (™) on every occurrence:
     * "Farm-to-Bowl™" (VIOLATION: "farm to bowl", "Farm to Bowl", "Farm-to-Bowl" without ™)
     * "Green Glow Elixir™" (VIOLATION: "green glow elixir", "green glow drink", "Green Glow Elixir" without ™)
     * "Harvest Protein Bowl™" (VIOLATION: "harvest protein bowl", "Harvest Protein Bowl" without ™)
     * "Avocado Crisp Tartine™" (VIOLATION: "avocado crisp tartine", "Avocado Crisp Tartine" without ™)
   - If an item appears in lowercase, altered words, or is missing the ™ symbol, flag the exact item text as a HIGH severity trademark violation.

2. OFFICIAL BRAND TAGLINE (MEDIUM SEVERITY):
   - The official FreshBite tagline must strictly and verbatim be: "Real Food, Pure Energy."
   - Requirement: Must contain the comma after "Food" and end with a period ".".
   - VIOLATIONS: Missing comma ("Real Food Pure Energy"), exclamation marks ("Real Food Pure Energy!", "Real Food for Pure Energy!!!"), word alterations, or paraphrasing ("Real Food for Real Energy").
   - Flag the altered tagline phrase as a MEDIUM severity violation.

3. PROHIBITED CORPORATE BUZZWORDS & JARGON (HIGH SEVERITY):
   - Banned buzzwords and their variations: "synergy", "strategic synergy", "paradigm shift", "disrupt", "disrupting", "leverage", "leveraging", "ecosystem", "ecosystems", "touchpoints", "bandwidth".
   - Flag these corporate buzzwords as a HIGH severity violation.

4. TONE & CLINICAL INGESTION VOCABULARY (MEDIUM SEVERITY):
   - Tone must be warm, conversational, and transparent.
   - Avoid cold, clinical, sterile, or overly technical pseudo-scientific vocabulary (e.g., "micronutrient delivery matrices", "bioperformance parameters", "caloric ingestion vectors", "cellular absorption").
   - Flag clinical jargon as a MEDIUM severity violation.

5. LOYALTY PROGRAM TERMINOLOGY (LOW SEVERITY):
   - The loyalty program must EXCLUSIVELY be referred to as "FreshBite Circle".
   - The loyalty currency must EXCLUSIVELY be referred to as "Bite Points".
   - VIOLATIONS: "VIP Club", "VIP Cashback Club", "Cashback", "cash tokens", or generic "points" / "loyalty points".
   - Flag incorrect loyalty terminology as a LOW severity violation.

6. HEALTH CLAIMS & MEDICAL SAFETY (CRITICAL SEVERITY - STRICT ZERO TOLERANCE):
   - NEVER make unsubstantiated medical claims, disease prevention claims (e.g. flu, viral illness, boosting white blood cells to shield against flu), disease cure claims (e.g. cures chronic inflammation, cures cancer, burns fat instantly), or detox/liver flush guarantees (e.g. flushes liver toxins in 24 hours).
   - Use wellness support verbs such as "nourishes", "fuels", "energizes", "supports natural vitality".
   - Flag any cure, disease prevention, or detox guarantee as CRITICAL severity.
   - If a sentence contains a unified health/cure/detox claim, flag the complete claim phrase as a single violation rather than fragmenting it.

7. ALLERGEN & GLUTEN DISCLOSURES (CRITICAL SEVERITY - STRICT ZERO TOLERANCE):
   - Mandatory allergen notice: Any mention of "Gluten-Friendly" (GF) must include kitchen cross-contact notice: "(prepared in a facility that also handles wheat)".
   - NEVER claim "100% allergen-proof", "100% gluten-free", or "zero contamination risk".
   - Flag missing cross-contact notices or claims of 100% allergen safety as CRITICAL severity.

8. ORGANIC PROVENANCE CLAIMS (HIGH SEVERITY):
   - Only claim ingredients are "Organic" if certified organic and attributed to a named partner farm (e.g., Oakridge Organics, Willow Creek Farm).
   - Broad unsubstantiated statements like "100% organic everything with zero chemicals anywhere" are prohibited.
   - Flag sweeping uncertified organic claims as a HIGH severity violation.

9. PROMOTIONAL STYLE & URGENCY (MEDIUM SEVERITY):
   - Avoid aggressive urgency, all-caps shouting (e.g. "DON'T MISS OUT ON THIS INSANE DEAL!"), panic triggers ("ACT NOW BEFORE IT'S GONE FOREVER!!!"), and spam phrases ("CRAZY BLOWOUT SALE!").
   - Flag aggressive promotional pressure as a MEDIUM severity violation.

=== COMPLIANT CONTENT DIRECTIVE ===
- If the submitted content complies with all brand guidelines, uses correct trademark symbols (™), the exact tagline "Real Food, Pure Energy.", and contains no banned words or unauthorized claims, RETURN AN EMPTY JSON ARRAY: [].
- DO NOT invent, hallucinate, or flag compliant text. Clean copy must receive zero findings.

=== OUTPUT SCHEMA REQUIREMENTS ===
Return a JSON array containing finding objects. Each finding MUST strictly have:
- "ruleId": The exact hex string from "[Rule ID: <id>]" of the guideline rule violated, or null if no matching ID exists.
- "severity": Must be exactly one of: "low", "medium", "high", "critical".
- "offendingText": The EXACT word, phrase, or sentence from the submitted text that triggers the violation.
- "explanation": Concise, objective explanation of why this text violates the brand guideline.
- "suggestedCorrection": A brand-compliant, professional rewrite.

Output ONLY the raw JSON array. Do not wrap in markdown code fences (\`\`\`json) or include any extra commentary.

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
