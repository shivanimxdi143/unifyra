# Unifyra AI Brand Governance Engine — Quality Assurance & Evaluation Report

> **Document Version:** 1.0.0  
> **Target System:** Unifyra AI Brand Governance & Intelligence Platform  
> **Brand Under Evaluation:** FreshBite (Fast-Casual Organic Dining & Beverages)  
> **Engine Architecture:** Gemini API + Structured Governance Prompts (`server/ai/`)  
> **Evaluation Benchmark Date:** November 2026  
> **Status:** Test Specification & Expected Baselines (Pending Sumit's API Integration Run)

---

## 1. Executive Summary & Evaluation Objective

Unifyra utilizes Google's Gemini models to enforce autonomous brand governance, editorial voice compliance, regulatory adherence, and trademark protection across multi-channel corporate and marketing communications.

In accordance with product MVP boundaries:
1. **Zero Auto-Approval:** The AI engine acts strictly as an advisory compliance auditor; final publishing sign-off remains with certified human reviewers.
2. **Zero Rule Hallucination:** The model must strictly enforce only explicitly supplied brand rules and must never invent unsupplied policies or legal restrictions.
3. **High Precision & Low False-Positive Rate:** The system must reliably intercept critical health claims, prohibited buzzwords, and trademark omissions without penalizing legitimate, brand-aligned wellness copy (e.g., distinguishing supportive phrasing like *"fuels natural energy"* from prohibited claims like *"cures chronic fatigue"*).

This report establishes **18 comprehensive evaluation scenarios** designed to rigorously benchmark the FreshBite compliance engine across positive test cases (violations to intercept) and negative test cases (compliant & borderline content to protect from false flags).

---

## 2. Evaluation Metrics Framework

When executed against the integrated Gemini API backend, the test suite is evaluated across six quantitative dimensions:

| Metric | Target | Formula / Definition | Significance |
| :--- | :--- | :--- | :--- |
| **True Positive Rate (Recall)** | $\ge 95\%$ | $\frac{TP}{TP + FN}$ | Ensures severe legal, medical, and trademark violations are not missed. |
| **Precision** | $\ge 95\%$ | $\frac{TP}{TP + FP}$ | Minimizes false alerts so content creators do not experience review fatigue. |
| **False Positive Rate (FPR)** | $\le 5\%$ | $\frac{FP}{FP + TN}$ | Guarantees permissible marketing phrasing is never incorrectly penalized. |
| **Exact Offending Text Extraction** | $\ge 90\%$ | Exact verbatim substring match in content | Ensures the UI can highlight the exact phrase and apply 1-click fixes. |
| **Severity Classification Accuracy** | $\ge 95\%$ | Exact severity match (`low`, `medium`, `high`, `critical`) | Protects escalation routing in the Human Review Queue. |
| **Mean Inference Latency** | $\le 1500\text{ ms}$ | Elapsed time between dispatch and structured JSON parse | Guarantees real-time interactive feedback in the UI editor. |

---

## 3. FreshBite Brand Governance Rule Matrix

All evaluation scenarios are anchored to the official FreshBite rules codified in [`server/ai/evaluationCases.js`](file:///d:/Projects/unifyra/server/ai/evaluationCases.js) and [`server/ai/brandAnalysisPrompt.js`](file:///d:/Projects/unifyra/server/ai/brandAnalysisPrompt.js):

| Rule ID | Category | Title & Requirement | Severity | Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| `6738c101a1b2c3d4e5f60101` | **Tone & Voice** | Maintain warm, conversational, and transparent tone. Prohibit clinical, cold, or pretentious corporate jargon. | **Medium** | Strict |
| `6738c102a1b2c3d4e5f60102` | **Tone & Voice** | Strictly avoid banned corporate buzzwords (`synergy`, `paradigm shift`, `disrupt`, `leverage`, `ecosystem`). | **High** | Strict |
| `6738c201a1b2c3d4e5f60201` | **Health & Claims** | Never make unsubstantiated medical claims, cure promises, or detox guarantees. Use wellness support verbs (`nourishes`, `fuels`, `energizes`). | **Critical** | Mandatory |
| `6738c202a1b2c3d4e5f60202` | **Health & Claims** | Mandatory allergen & gluten disclosure. Any mention of Gluten-Friendly (GF) must include kitchen cross-contact notice. Never claim 100% allergen-proof. | **Critical** | Mandatory |
| `6738c203a1b2c3d4e5f60203` | **Health & Claims** | Only claim ingredients are "Organic" if USDA certified and attribute provenance to a named partner farm. | **High** | Strict |
| `6738c301a1b2c3d4e5f60301` | **Trademarks & Naming** | Signature menu items must use proper title casing and trademark symbols (`Farm-to-Bowl™`, `Green Glow Elixir™`, `Harvest Protein Bowl™`, `Avocado Crisp Tartine™`). | **High** | Strict |
| `6738c302a1b2c3d4e5f60302` | **Trademarks & Naming** | Official brand tagline must strictly be formatted as `"Real Food, Pure Energy."` with comma and period. Exclamation marks or word alterations are prohibited. | **Medium** | Strict |
| `6738c401a1b2c3d4e5f60401` | **Promotional Style** | Promotions must be thoughtful and respectful. Avoid aggressive urgency, ALL-CAPS screaming, and spam words (`CRAZY BLOWOUT`, `ACT NOW`). | **Medium** | Recommended |
| `6738c402a1b2c3d4e5f60402` | **Promotional Style** | Refer to loyalty program exclusively as `"FreshBite Circle"` and points as `"Bite Points"`. Prohibit `"VIP Club"`, `"Cashback"`, or generic points terms. | **Low** | Recommended |

---

## 4. Comprehensive 18-Scenario Evaluation Test Suite

### Summary Index

| Scenario ID | Test Category | Target Dimension | Expected Outcome | Expected Severity |
| :--- | :--- | :--- | :--- | :--- |
| **SCEN-01** | Medical & Cure Claim | Critical Health & Legal | **Flagged** | `critical` |
| **SCEN-02** | False Food Safety & Allergy | Critical Health & Legal | **Flagged** | `critical` |
| **SCEN-03** | Unsupported Organic Claim | Sourcing & Provenance | **Flagged** | `high` |
| **SCEN-04** | Prohibited Buzzwords | Banned Corporate Fluff | **Flagged** | `high` |
| **SCEN-05** | Trademark Neglect & Lowercase | Protected Trademarks | **Flagged** | `high` |
| **SCEN-06** | Cold / Clinical Vocabulary | Tone & Voice | **Flagged** | `medium` |
| **SCEN-07** | Aggressive Clickbait Urgency | Promotional Language | **Flagged** | `medium` |
| **SCEN-08** | Slogan Punctuation Tampering | Trademark Integrity | **Flagged** | `medium` |
| **SCEN-09** | Loyalty Terminology Error | Program Naming | **Flagged** | `low` |
| **SCEN-10** | Multiple Compound Violations | Multi-Rule Interception | **Flagged** | `critical`, `high`, `medium` |
| **SCEN-11** | Compliant Partner Newsletter | Baseline Compliant Copy | **Compliant** | None (`100%`) |
| **SCEN-12** | Compliant Short Social Story | Baseline Compliant Copy | **Compliant** | None (`100%`) |
| **SCEN-13** | Compliant In-Store Table Card | Baseline Compliant Copy | **Compliant** | None (`100%`) |
| **SCEN-14** | Borderline Vitality Support Copy | False-Positive Defense | **Compliant** | None (`100%`) |
| **SCEN-15** | Borderline Workout Energy Claim | False-Positive Defense | **Compliant** | None (`100%`) |
| **SCEN-16** | Borderline Respectful Promotion | False-Positive Defense | **Compliant** | None (`100%`) |
| **SCEN-17** | Missing Trademark Symbol | Protected Trademarks | **Flagged** | `high` |
| **SCEN-18** | Compliant Allergen Disclosure | False-Positive Defense | **Compliant** | None (`100%`) |

---

### Detailed Scenario Specifications

#### SCEN-01: Critical Unsubstantiated Medical & Detox Claim
- **Channel / Content Type:** `social_post` (Instagram Blast)
- **Input Content:**
  > *"Feeling sluggish? Our new Green Glow Elixir™ cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed! Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c201a1b2c3d4e5f60201` (*Zero Unsubstantiated Medical Claims*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `critical`
- **Expected Offending Text:** `"cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed"`
- **Expected Explanation:** Food and beverage products cannot claim to cure medical diseases, eliminate biological toxins, or guarantee medical outcomes under FDA standards and FreshBite brand policies.
- **Expected Suggested Correction:** `"is crafted with ginger and leafy greens to naturally nourish your body and support daily vitality"`

---

#### SCEN-02: Critical False Food Safety & Allergen Exemption
- **Channel / Content Type:** `social_post` (TikTok Caption)
- **Input Content:**
  > *"Looking for wheat-free options? Our Harvest Protein Bowl™ is 100% gluten-free and allergen-proof with zero contamination risk for severe celiac customers! Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c202a1b2c3d4e5f60202` (*Mandatory Allergen & Gluten Disclosure*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `critical`
- **Expected Offending Text:** `"100% gluten-free and allergen-proof with zero contamination risk for severe celiac customers"`
- **Expected Explanation:** Claiming a kitchen item is completely allergen-proof or carries zero cross-contact risk is hazardous and strictly prohibited. Mandatory kitchen cross-contact disclosures are required.
- **Expected Suggested Correction:** `"Gluten-Friendly (prepared in a kitchen that also handles wheat and nuts)"`

---

#### SCEN-03: Unsupported Organic Provenance & Chemical Claim
- **Channel / Content Type:** `ad_copy` (Meta Feed Ad)
- **Input Content:**
  > *"Taste our 100% organic everything with zero chemicals anywhere! Enjoy the Harvest Protein Bowl™ today. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c203a1b2c3d4e5f60203` (*Certified Organic & Farm Traceability*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `high`
- **Expected Offending Text:** `"100% organic everything with zero chemicals anywhere"`
- **Expected Explanation:** Organic claims must be USDA Certified Organic and must name specific regional partner farms rather than making sweeping, unverified "zero chemicals" claims.
- **Expected Suggested Correction:** `"featuring USDA certified organic vegetables from our regional partner farms"`

---

#### SCEN-04: Prohibited Corporate Buzzwords & Fluff
- **Channel / Content Type:** `social_post` (LinkedIn Corporate Catering Announcement)
- **Input Content:**
  > *"FreshBite is leveraging strategic synergy across agricultural ecosystems to disrupt office catering! Order the Farm-to-Bowl™ lunch package today. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c102a1b2c3d4e5f60102` (*Banned Corporate Jargon & Fluff*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `high`
- **Expected Offending Text:** `"leveraging strategic synergy across agricultural ecosystems to disrupt"`
- **Expected Explanation:** Corporate buzzwords (`leveraging`, `synergy`, `ecosystems`, `disrupt`) contradict FreshBite's honest, approachable, and transparent voice.
- **Expected Suggested Correction:** `"partnering directly with local farmers to bring fresh, nourishing meals to"`

---

#### SCEN-05: Trademark Neglect & Lowercase Signature Items
- **Channel / Content Type:** `social_post` (Local Store Promo)
- **Input Content:**
  > *"Stop by our downtown location for a fresh farm to bowl lunch and green glow drink made with local apples. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c301a1b2c3d4e5f60301` (*Protected Trademarks & Signature Item Capitalization*)
- **Expected Outcome:** **Flagged** (2 distinct trademark findings expected)
- **Expected Severity:** `high`
- **Expected Offending Text:**
  1. `"farm to bowl"`
  2. `"green glow drink"`
- **Expected Explanation:** Signature brand items are legally registered trademarks and must use title capitalization and trademark symbols.
- **Expected Suggested Correction:** `"Farm-to-Bowl™"` and `"Green Glow Elixir™"`

---

#### SCEN-06: Tone & Voice — Overly Clinical / Cold Vocabulary
- **Channel / Content Type:** `website_copy` (Philosophy Page Snippet)
- **Input Content:**
  > *"Our culinary kitchen optimizes bioperformance parameters through precision micronutrient delivery matrices. Savor our Farm-to-Bowl™ meal. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c101a1b2c3d4e5f60101` (*Warm, Conversational & Transparent Tone*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `medium`
- **Expected Offending Text:** `"optimizes bioperformance parameters through precision micronutrient delivery matrices"`
- **Expected Explanation:** Pseudo-scientific, biohacking, or overly clinical terminology alienates customers and violates FreshBite's conversational, food-first persona.
- **Expected Suggested Correction:** `"crafts wholesome, scratch-made meals packed with natural nutrients"`

---

#### SCEN-07: Aggressive Promotional Urgency & Clickbait
- **Channel / Content Type:** `email` (Flash Discount Blast)
- **Input Content:**
  > *"DON'T MISS OUT ON THIS INSANE DEAL! Use code BITE50 right now before the clock runs out! Enjoy our Harvest Protein Bowl™. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c401a1b2c3d4e5f60401` (*Respectful, Non-Hype Promotional Phrasing*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `medium`
- **Expected Offending Text:** `"DON'T MISS OUT ON THIS INSANE DEAL! Use code BITE50 right now before the clock runs out!"`
- **Expected Explanation:** High-pressure sales tactics, panic-inducing countdown phrasing, and ALL-CAPS screaming conflict with FreshBite’s mindful, premium hospitality standards.
- **Expected Suggested Correction:** `"Celebrate the weekend with a special offer: Enjoy 50% off your next bowl with code BITE50."`

---

#### SCEN-08: Slogan Punctuation & Integrity Tampering
- **Channel / Content Type:** `social_post` (Instagram Reel Caption)
- **Input Content:**
  > *"Fresh ingredients, organic greens, and craft dressings made from scratch. FreshBite: Real Food for Pure Energy!!!"*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c302a1b2c3d4e5f60302` (*Official Tagline Punctuation & Integrity*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `medium`
- **Expected Offending Text:** `"Real Food for Pure Energy!!!"`
- **Expected Explanation:** The brand tagline is legally protected and must strictly appear as `"Real Food, Pure Energy."` with a comma and single period. Substitutions and exclamation marks are forbidden.
- **Expected Suggested Correction:** `"Real Food, Pure Energy."`

---

#### SCEN-09: Loyalty Program Terminology Misuse
- **Channel / Content Type:** `email` (Member Engagement Email)
- **Input Content:**
  > *"Join our VIP Cashback Club today and start collecting cash tokens on every Harvest Protein Bowl™ order. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c402a1b2c3d4e5f60402` (*FreshBite Circle Loyalty Terminology*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `low`
- **Expected Offending Text:** `"VIP Cashback Club today and start collecting cash tokens"`
- **Expected Explanation:** Loyalty initiatives must use official branding (`FreshBite Circle`) and points designation (`Bite Points`) rather than generic casino or cashback terminology.
- **Expected Suggested Correction:** `"Join the FreshBite Circle today and start earning Bite Points"`

---

#### SCEN-10: Multiple Compound Violations
- **Channel / Content Type:** `ad_copy` (Paid Ad Banner Copy)
- **Input Content:**
  > *"🚨 CRAZY BLOWOUT SALE! ACT NOW BEFORE IT'S GONE FOREVER!!! Try our new green glow drink that cures sluggish mornings and burns belly fat instantly. Real Food Pure Energy!!"*
- **Evaluation Type:** Positive Test (Multi-Rule Compound Stress Test)
- **Target Rules:**
  1. `6738c401a1b2c3d4e5f60401` (*Promotional Style*, `medium`)
  2. `6738c301a1b2c3d4e5f60301` (*Trademark Naming*, `high`)
  3. `6738c201a1b2c3d4e5f60201` (*Medical Cure Claim*, `critical`)
  4. `6738c302a1b2c3d4e5f60302` (*Tagline Integrity*, `medium`)
- **Expected Outcome:** **Flagged** (4 distinct findings expected)
- **Expected Score Range:** 20% – 50%
- **Expected Findings Summary:** Must detect all 4 distinct violations simultaneously without halting on the first error.

---

#### SCEN-11: Fully Compliant Farmer Partnership Newsletter
- **Channel / Content Type:** `email` (Weekly Newsletter)
- **Input Content:**
  > *"This Saturday, we are proud to spotlight Oakridge Organics, where every crisp leaf of baby kale in our Harvest Protein Bowl™ is harvested at sunrise. Pair your bowl with our signature Green Glow Elixir™, freshly pressed with heirloom apples and organic ginger. Real Food, Pure Energy."*
- **Evaluation Type:** Negative Test (True Negative Baseline)
- **Target Rule:** None (Fully Compliant)
- **Expected Outcome:** **Compliant**
- **Expected Findings:** `[]` (Empty array)
- **Expected Score:** `100%`
- **Expected Summary:** Acknowledges authentic storytelling, proper farm attribution, correct trademark symbols, and accurate tagline format.

---

#### SCEN-12: Fully Compliant Short Social Story
- **Channel / Content Type:** `social_post` (Instagram Story)
- **Input Content:**
  > *"Midday recharge with our Avocado Crisp Tartine™, freshly made with sourdough and organic cilantro from Willow Creek Farm. Real Food, Pure Energy."*
- **Evaluation Type:** Negative Test (True Negative Baseline)
- **Target Rule:** None (Fully Compliant)
- **Expected Outcome:** **Compliant**
- **Expected Findings:** `[]`
- **Expected Score:** `100%`

---

#### SCEN-13: Fully Compliant In-Store Table Card
- **Channel / Content Type:** `other` (In-Store Print Table Tent)
- **Input Content:**
  > *"Scratch cooking, honest ingredients. Enjoy our chef-crafted Harvest Protein Bowl™ paired with house-whisked lemon herb vinaigrette. Real Food, Pure Energy."*
- **Evaluation Type:** Negative Test (True Negative Baseline)
- **Target Rule:** None (Fully Compliant)
- **Expected Outcome:** **Compliant**
- **Expected Findings:** `[]`
- **Expected Score:** `100%`

---

#### SCEN-14: Borderline Case — Permissible General Vitality Claims
- **Channel / Content Type:** `social_post` (Product Feature)
- **Input Content:**
  > *"Packed with Vitamin C and fresh cold-pressed ginger to naturally support your daily vitality and afternoon alertness. Taste the Harvest Protein Bowl™ today. Real Food, Pure Energy."*
- **Evaluation Type:** False-Positive Resistance Test
- **Target Rule:** `6738c201a1b2c3d4e5f60201` (*Health Claims*)
- **Expected Outcome:** **Compliant (Should NOT be flagged)**
- **Why This Is Crucial:** A crude keyword matcher might erroneously flag `"support"`, `"vitality"`, or `"Vitamin C"` as a medical violation. The AI engine must recognize that supportive wellness verbs (*"naturally support your daily vitality"*) are explicitly permitted by rule `BG-201` examples.
- **Expected Score:** `98%` – `100%`

---

#### SCEN-15: Borderline Case — Natural Workout Energy Claim
- **Channel / Content Type:** `social_post` (Fitness Demographic Post)
- **Input Content:**
  > *"Fuels your workout with clean, sustained energy from slow-roasted sweet potatoes and organic quinoa. Try our signature Farm-to-Bowl™ lunch. Real Food, Pure Energy."*
- **Evaluation Type:** False-Positive Resistance Test
- **Target Rule:** `6738c201a1b2c3d4e5f60201` (*Health Claims*)
- **Expected Outcome:** **Compliant (Should NOT be flagged)**
- **Why This Is Crucial:** The word `"energy"` appears frequently in both compliant nutritional copy and illegal stimulant copy. FreshBite explicitly approves `"fuels your day"` and whole-food nourishment.

---

#### SCEN-16: Borderline Case — Thoughtful & Respectful Promotion
- **Channel / Content Type:** `email` (Weekend Announcement)
- **Input Content:**
  > *"Treat yourself to a wholesome lunch this weekend: Enjoy 20% off your next Farm-to-Bowl™ order with code FRESH20. Real Food, Pure Energy."*
- **Evaluation Type:** False-Positive Resistance Test
- **Target Rule:** `6738c401a1b2c3d4e5f60401` (*Promotional Style*)
- **Expected Outcome:** **Compliant (Should NOT be flagged)**
- **Why This Is Crucial:** Rule `BG-401` permits discounts when framed as thoughtful invitations; it only restricts shouting, high-pressure urgency (`"ACT NOW BEFORE IT'S GONE"`), and clickbait scam phrasing.

---

#### SCEN-17: Trademark Missing Symbol on New Menu Item
- **Channel / Content Type:** `social_post` (Product Launch)
- **Input Content:**
  > *"Introducing our new Avocado Crisp Tartine, made with fresh Haas avocados on toasted sourdough. Real Food, Pure Energy."*
- **Evaluation Type:** Positive Test (True Positive Verification)
- **Target Rule:** `6738c301a1b2c3d4e5f60301` (*Protected Trademarks*)
- **Expected Outcome:** **Flagged**
- **Expected Severity:** `high`
- **Expected Offending Text:** `"Avocado Crisp Tartine"` (missing the `™` mark)
- **Expected Suggested Correction:** `"Avocado Crisp Tartine™"`

---

#### SCEN-18: Borderline Case — Compliant Allergen Disclosure Phrasing
- **Channel / Content Type:** `website_copy` (Menu Item Description)
- **Input Content:**
  > *"Enjoy our hearty Grain Bowl with Gluten-Friendly bread (prepared in a kitchen that also processes wheat and dairy). Real Food, Pure Energy."*
- **Evaluation Type:** False-Positive Resistance Test
- **Target Rule:** `6738c202a1b2c3d4e5f60202` (*Allergen Disclosures*)
- **Expected Outcome:** **Compliant (Should NOT be flagged)**
- **Why This Is Crucial:** The presence of the word `"Gluten-Friendly"` must not trigger a violation when accompanied by the required cross-contact parenthetical statement.

---

## 5. Live Execution Results Matrix (Template for Sumit)

> [!IMPORTANT]
> The table below is the **standardized benchmark record**. Once Sumit completes the Gemini API integration in `server/`, he should execute the automated evaluation runner and record the live Gemini model outputs into the actual columns below.

| Scenario ID | Test Classification | Expected Status | Actual Status (Gemini) | Actual Score | Verbatim Text Match | Severity Match | Rule Match | Latency (ms) | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCEN-01** | Medical Cure Claim | Flagged (`critical`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-02** | False Allergen Exemption | Flagged (`critical`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-03** | Unsupported Organic Claim | Flagged (`high`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-04** | Banned Buzzwords | Flagged (`high`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-05** | Trademark Neglect | Flagged (`high`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-06** | Clinical Phrasing | Flagged (`medium`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-07** | Clickbait Urgency | Flagged (`medium`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-08** | Slogan Tampering | Flagged (`medium`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-09** | Loyalty Terminology | Flagged (`low`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-10** | Compound Violations | Flagged (Multi-rule) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-11** | Compliant Newsletter | Compliant (`100%`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-12** | Compliant Social Story | Compliant (`100%`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-13** | Compliant Menu Tent | Compliant (`100%`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-14** | Vitality Support (Borderline) | Compliant (`0 flags`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-15** | Natural Workout Energy | Compliant (`0 flags`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-16** | Respectful Promotion | Compliant (`0 flags`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-17** | Missing Trademark Symbol | Flagged (`high`) | *Pending API run* | — | — | — | — | — | *PENDING* |
| **SCEN-18** | Compliant Cross-Contact Notice | Compliant (`0 flags`) | *Pending API run* | — | — | — | — | — | *PENDING* |

---

## 6. How to Run These Scenarios Against the Integrated Gemini API

Once Sumit finishes wiring the Gemini client inside `server/controllers/` or `server/services/`, he can execute this entire benchmark in two ways:

### Option A: Programmatic Execution via Node.js

Sumit can call the modular functions exported in `server/ai/`:

```javascript
// Example runner script: server/testAiEvaluation.js
const { buildBrandAnalysisPrompt } = require('./ai/brandAnalysisPrompt');
const { validateAnalysisResponse, sanitizeFindingForDb } = require('./ai/analysisSchema');
const { EVALUATION_CASES, evaluateTestCase, STANDARD_FRESHBITE_GUIDELINES } = require('./ai/evaluationCases');
// Sumit's Gemini integration function:
const { callGeminiApi } = require('./services/geminiService');

async function runBenchmark() {
  console.log(`Running Unifyra AI Benchmark against ${EVALUATION_CASES.length} scenarios...\n`);

  for (const testCase of EVALUATION_CASES) {
    const startTime = Date.now();
    
    // 1. Format prompt
    const { systemInstruction, prompt } = buildBrandAnalysisPrompt({
      content: testCase.content,
      contentType: testCase.contentType,
      guidelines: testCase.guidelines
    });

    // 2. Dispatch to Gemini API
    const rawResult = await callGeminiApi({ systemInstruction, prompt });
    const latency = Date.now() - startTime;

    // 3. Validate against schema
    const validation = validateAnalysisResponse(rawResult);
    if (!validation.isValid) {
      console.error(`[FAIL] ${testCase.id} - Schema validation failed:`, validation.errors);
      continue;
    }

    // 4. Evaluate precision & recall
    const evalMetrics = evaluateTestCase(testCase, rawResult);
    console.log(`[${evalMetrics.passed ? 'PASS' : 'FAIL'}] ${testCase.id}: ${testCase.title} (${latency}ms)`);
    console.log(`       Precision: ${evalMetrics.precision}, Recall: ${evalMetrics.recall}, Actual Score: ${rawResult.overallComplianceScore}%`);
  }
}

runBenchmark().catch(console.error);
```

### Option B: HTTP API Endpoint Execution

Sumit can trigger analysis directly through the Express route:

```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "submittedBy": "Elena Rostova",
    "contentType": "social_post",
    "content": "Feeling sluggish? Our new Green Glow Elixir™ cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed! Real Food, Pure Energy."
  }'
```

Verify that the returned findings array contains the expected structured objects:
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "findings": [
      {
        "severity": "critical",
        "offendingText": "cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed",
        "explanation": "Making medical cure and guaranteed liver detox claims violates mandatory health claim guidelines.",
        "suggestedCorrection": "is crafted with ginger and leafy greens to naturally nourish your body and support daily vitality"
      }
    ]
  }
}
```

---

## 7. Quality Assurance Checklist Prior to Production Hand-off

- [ ] All 10 positive test scenarios correctly flag violations with exact substring excerpts.
- [ ] All 8 negative / borderline scenarios return `findings: []` with compliance score $\ge 98\%$.
- [ ] No findings return arbitrary severity strings outside `low`, `medium`, `high`, `critical`.
- [ ] The AI response never auto-approves or auto-rejects content (`status` is always human-determined).
- [ ] Findings persist into MongoDB via `Finding.create()` without `CastError` on `ruleId`.
- [ ] Frontend editor receives suggestions and applies one-click string replacements accurately.
