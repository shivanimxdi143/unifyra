/**
 * @file evaluationCases.js
 * @description Benchmark evaluation test suite for Unifyra AI brand governance auditing.
 * Contains 12 realistic test cases spanning critical medical claims, corporate jargon,
 * trademark misuse, tagline tampering, allergen disclaimers, and clean compliant copy.
 */

/**
 * Standard FreshBite demo guidelines used across the test suite.
 * Formatted to mirror the Mongoose Guideline schema rules.
 */
const STANDARD_FRESHBITE_GUIDELINES = [
  {
    _id: '6738c101a1b2c3d4e5f60101',
    category: 'Tone & Voice',
    ruleText: 'Maintain a warm, conversational, and transparent tone. Avoid overly clinical, cold, or pretentious corporate vocabulary.',
    severity: 'medium',
    examples: ['DO: "Whisked fresh daily using cold-pressed olive oil."', 'DON\'T: "Optimal caloric ingestion vectors via proprietary emulsions."']
  },
  {
    _id: '6738c102a1b2c3d4e5f60102',
    category: 'Tone & Voice',
    ruleText: 'Strictly avoid banned corporate buzzwords such as "synergy", "paradigm shift", "disrupt", "leverage", and "ecosystem".',
    severity: 'high',
    examples: ['DO: "We partner directly with family farms."', 'DON\'T: "Leveraging strategic synergy across food ecosystems to disrupt dining."']
  },
  {
    _id: '6738c201a1b2c3d4e5f60201',
    category: 'Health & Claims',
    ruleText: 'Never make unsubstantiated medical claims, disease cure claims, or detox guarantees. Use wellness support verbs such as "nourishes", "fuels", or "energizes".',
    severity: 'critical',
    examples: ['DO: "Packed with vitamin C to help support natural vitality."', 'DON\'T: "Cures chronic inflammation and flushes all liver toxins in 24 hours guaranteed."']
  },
  {
    _id: '6738c202a1b2c3d4e5f60202',
    category: 'Health & Claims',
    ruleText: 'Mandatory allergen and gluten disclosure: Any mention of Gluten-Friendly (GF) must include kitchen cross-contact notice.',
    severity: 'critical',
    examples: ['DO: "Gluten-Friendly crust (prepared in a facility that also handles wheat)."', 'DON\'T: "100% allergen-proof with zero contamination risk."']
  },
  {
    _id: '6738c203a1b2c3d4e5f60203',
    category: 'Health & Claims',
    ruleText: 'Only claim ingredients are "Organic" if certified organic and attribute provenance to a named partner farm.',
    severity: 'high',
    examples: ['DO: "Featuring certified organic baby spinach from Oakridge Organics."', 'DON\'T: "Completely organic everything with zero chemicals."']
  },
  {
    _id: '6738c301a1b2c3d4e5f60301',
    category: 'Trademarks & Naming',
    ruleText: 'Signature menu items must use proper title casing and trademark symbol: Farm-to-Bowl™, Green Glow Elixir™, Harvest Protein Bowl™, and Avocado Crisp Tartine™.',
    severity: 'high',
    examples: ['DO: "Try our signature Farm-to-Bowl™ lunch."', 'DON\'T: "Try our new farm to bowl drink."']
  },
  {
    _id: '6738c302a1b2c3d4e5f60302',
    category: 'Trademarks & Naming',
    ruleText: 'Official brand tagline must strictly be formatted as "Real Food, Pure Energy." with a comma and period. Exclamation marks or word alterations are prohibited.',
    severity: 'medium',
    examples: ['DO: "FreshBite — Real Food, Pure Energy."', 'DON\'T: "Real Food Pure Energy!!" or "Real Food for Real Energy"']
  },
  {
    _id: '6738c401a1b2c3d4e5f60401',
    category: 'Promotional Style',
    ruleText: 'Promotions must be thoughtful and respectful. Avoid aggressive urgency, ALL-CAPS screaming, and spam words like "CRAZY BLOWOUT" or "ACT NOW".',
    severity: 'medium',
    examples: ['DO: "Enjoy 20% off your next bowl this weekend."', 'DON\'T: "🚨 CRAZY BLOWOUT SALE! BUY NOW BEFORE IT\'S GONE FOREVER!!!"']
  },
  {
    _id: '6738c402a1b2c3d4e5f60402',
    category: 'Promotional Style',
    ruleText: 'Refer to our loyalty program exclusively as "FreshBite Circle" and points as "Bite Points". Prohibit "VIP Club", "Cashback", or generic points terminology.',
    severity: 'low',
    examples: ['DO: "Earn double Bite Points with FreshBite Circle this week."', 'DON\'T: "Get free cashback in our VIP club."']
  }
];

/**
 * 12 Benchmark Evaluation Test Cases
 */
const EVALUATION_CASES = [
  // 1. Clear Violation: Critical Medical Claim
  {
    id: 'TC-001',
    title: 'Severe Unsubstantiated Medical & Detox Claim',
    category: 'clear_violation',
    contentType: 'social_post',
    content: 'Feeling sluggish? Our new Green Glow Elixir™ cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed! Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c201a1b2c3d4e5f60201',
        severity: 'critical',
        offendingText: 'cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed',
        explanation: 'Making medical cure and guaranteed liver detox claims violates mandatory health claim guidelines.',
        suggestedCorrection: 'is crafted with ginger and leafy greens to naturally nourish your body and support daily vitality'
      }
    ],
    expectedMaxScore: 75,
    expectedMinScore: 50
  },

  // 2. Fully Compliant Content
  {
    id: 'TC-002',
    title: 'Clean Compliant Farmer Partnership Newsletter',
    category: 'compliant',
    contentType: 'email',
    content: 'This Saturday, we are proud to spotlight Oakridge Organics, where every crisp leaf of baby kale in our Harvest Protein Bowl™ is harvested at sunrise. Pair your bowl with our signature Green Glow Elixir™, freshly pressed with heirloom apples and organic ginger. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 0,
    expectedFindings: [],
    expectedMaxScore: 100,
    expectedMinScore: 98
  },

  // 3. Minor Tone Violation: Overly Clinical & Stiff
  {
    id: 'TC-003',
    title: 'Clinical, Ingestion-Centric Phrasing',
    category: 'minor_tone',
    contentType: 'website_copy',
    content: 'Our culinary kitchen optimizes bioperformance parameters through precision micronutrient delivery matrices. Savor our Farm-to-Bowl™ meal. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c101a1b2c3d4e5f60101',
        severity: 'medium',
        offendingText: 'optimizes bioperformance parameters through precision micronutrient delivery matrices',
        explanation: 'Cold, overly clinical vocabulary contradicts FreshBite\'s warm and conversational tone.',
        suggestedCorrection: 'crafts wholesome, scratch-made meals packed with natural nutrients'
      }
    ],
    expectedMaxScore: 92,
    expectedMinScore: 82
  },

  // 4. Misleading Claims: Unverified Organic Provenance
  {
    id: 'TC-004',
    title: 'Unsubstantiated Organic Provenance Claim',
    category: 'misleading_claims',
    contentType: 'ad_copy',
    content: 'Taste our 100% organic everything with zero chemicals anywhere! Enjoy the Harvest Protein Bowl™ today. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c203a1b2c3d4e5f60203',
        severity: 'high',
        offendingText: '100% organic everything with zero chemicals anywhere',
        explanation: 'Organic claims must be USDA certified and cite specific partner farms rather than making sweeping uncertified statements.',
        suggestedCorrection: 'featuring USDA certified organic vegetables from our regional partner farms'
      }
    ],
    expectedMaxScore: 85,
    expectedMinScore: 70
  },

  // 5. Prohibited Phrases: Banned Corporate Buzzwords
  {
    id: 'TC-005',
    title: 'Corporate Buzzwords & Fluff in B2B Announcement',
    category: 'prohibited_phrases',
    contentType: 'social_post',
    content: 'FreshBite is leveraging strategic synergy across agricultural ecosystems to disrupt office catering! Order the Farm-to-Bowl™ lunch package today. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c102a1b2c3d4e5f60102',
        severity: 'high',
        offendingText: 'leveraging strategic synergy across agricultural ecosystems to disrupt',
        explanation: 'Disallowed corporate jargon ("leveraging", "synergy", "ecosystems", "disrupt") undermines brand authenticity.',
        suggestedCorrection: 'partnering directly with local farmers to bring fresh, nourishing meals to'
      }
    ],
    expectedMaxScore: 85,
    expectedMinScore: 70
  },

  // 6. Multiple Violations: Aggressive Urgency + Medical Claim + Missing Trademark
  {
    id: 'TC-006',
    title: 'Compound Violations: Hype Sale + Cure Claim + Unregistered Item',
    category: 'multiple_violations',
    contentType: 'ad_copy',
    content: '🚨 CRAZY BLOWOUT SALE! ACT NOW BEFORE IT\'S GONE FOREVER!!! Try our new green glow drink that cures sluggish mornings and burns belly fat instantly. Real Food Pure Energy!!',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 4,
    expectedFindings: [
      {
        ruleId: '6738c401a1b2c3d4e5f60401',
        severity: 'medium',
        offendingText: '🚨 CRAZY BLOWOUT SALE! ACT NOW BEFORE IT\'S GONE FOREVER!!!',
        explanation: 'High-pressure urgency and sensationalist sales copy violates promotional style guidelines.'
      },
      {
        ruleId: '6738c301a1b2c3d4e5f60301',
        severity: 'high',
        offendingText: 'green glow drink',
        explanation: 'Official trademark signature item must be written as Green Glow Elixir™.'
      },
      {
        ruleId: '6738c201a1b2c3d4e5f60201',
        severity: 'critical',
        offendingText: 'cures sluggish mornings and burns belly fat instantly',
        explanation: 'Unsubstantiated medical cure and instant fat-burning promises are strictly prohibited.'
      },
      {
        ruleId: '6738c302a1b2c3d4e5f60302',
        severity: 'medium',
        offendingText: 'Real Food Pure Energy!!',
        explanation: 'Slogan must be formatted as "Real Food, Pure Energy." with a comma and period.'
      }
    ],
    expectedMaxScore: 50,
    expectedMinScore: 20
  },

  // 7. Trademark & Naming Misuse
  {
    id: 'TC-007',
    title: 'Missing Trademark Symbols and Lowercase Casing',
    category: 'trademark_misuse',
    contentType: 'social_post',
    content: 'Stop by our downtown location for a fresh farm to bowl lunch and avocado crisp tartine made with local avocados. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 2,
    expectedFindings: [
      {
        ruleId: '6738c301a1b2c3d4e5f60301',
        severity: 'high',
        offendingText: 'farm to bowl',
        explanation: 'Protected trademark must be capitalized and include trademark symbol: Farm-to-Bowl™.'
      },
      {
        ruleId: '6738c301a1b2c3d4e5f60301',
        severity: 'high',
        offendingText: 'avocado crisp tartine',
        explanation: 'Signature item must be formatted as Avocado Crisp Tartine™.'
      }
    ],
    expectedMaxScore: 78,
    expectedMinScore: 65
  },

  // 8. Missing Allergen & Dietary Disclosure
  {
    id: 'TC-008',
    title: 'Gluten-Friendly Claim Lacking Cross-Contamination Warning',
    category: 'allergen_disclosure',
    contentType: 'social_post',
    content: 'Looking for wheat-free options? Our Harvest Protein Bowl™ is 100% gluten-free and allergen-proof! Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c202a1b2c3d4e5f60202',
        severity: 'critical',
        offendingText: '100% gluten-free and allergen-proof',
        explanation: 'Mandatory guideline requires kitchen cross-contact disclaimer and forbids claiming 100% allergen-proof.'
      }
    ],
    expectedMaxScore: 75,
    expectedMinScore: 55
  },

  // 9. Aggressive Promotional Phrasing
  {
    id: 'TC-009',
    title: 'Excessive All-Caps and Urgency Pressure',
    category: 'aggressive_promotional',
    contentType: 'email',
    content: 'DON\'T MISS OUT ON THIS INSANE DEAL! Use code BITE50 right now before the clock runs out! Enjoy our Harvest Protein Bowl™. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c401a1b2c3d4e5f60401',
        severity: 'medium',
        offendingText: 'DON\'T MISS OUT ON THIS INSANE DEAL! Use code BITE50 right now before the clock runs out!',
        explanation: 'Aggressive panic urgency and all-caps phrasing violates promotional standards.'
      }
    ],
    expectedMaxScore: 92,
    expectedMinScore: 80
  },

  // 10. Tagline Punctuation & Integrity Tampering
  {
    id: 'TC-010',
    title: 'Altered Brand Slogan Phrasing and Exclamations',
    category: 'tagline_tampering',
    contentType: 'social_post',
    content: 'Fresh ingredients, organic greens, and craft dressings made from scratch. FreshBite: Real Food for Pure Energy!!!',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c302a1b2c3d4e5f60302',
        severity: 'medium',
        offendingText: 'Real Food for Pure Energy!!!',
        explanation: 'The official tagline must strictly be "Real Food, Pure Energy." with standard punctuation.'
      }
    ],
    expectedMaxScore: 92,
    expectedMinScore: 82
  },

  // 11. Fully Compliant Social Post
  {
    id: 'TC-011',
    title: 'Clean Compliant Instagram Story Copy',
    category: 'compliant',
    contentType: 'social_post',
    content: 'Midday recharge with our Avocado Crisp Tartine™, freshly made with sourdough and organic cilantro from Willow Creek Farm. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 0,
    expectedFindings: [],
    expectedMaxScore: 100,
    expectedMinScore: 98
  },

  // 12. Loyalty Terminology Violation
  {
    id: 'TC-012',
    title: 'Incorrect Loyalty Program Terminology',
    category: 'loyalty_terminology',
    contentType: 'email',
    content: 'Join our VIP Cashback Club today and start collecting cash tokens on every Harvest Protein Bowl™ order. Real Food, Pure Energy.',
    guidelines: STANDARD_FRESHBITE_GUIDELINES,
    expectedFindingCount: 1,
    expectedFindings: [
      {
        ruleId: '6738c402a1b2c3d4e5f60402',
        severity: 'low',
        offendingText: 'VIP Cashback Club today and start collecting cash tokens',
        explanation: 'Loyalty program must be named "FreshBite Circle" and currency must be called "Bite Points".'
      }
    ],
    expectedMaxScore: 96,
    expectedMinScore: 88
  }
];

/**
 * Compares an actual AI analysis result against the expected findings of an evaluation case.
 * Useful for automated prompt regression testing and accuracy benchmarking.
 *
 * @param {object} testCase - An entry from EVALUATION_CASES
 * @param {object} actualResponse - Output returned by AI analysis
 * @returns {object} Evaluation metrics (passed, precision, recall, details)
 */
function evaluateTestCase(testCase, actualResponse) {
  const actualFindings = Array.isArray(actualResponse?.findings) ? actualResponse.findings : [];
  const expectedFindings = testCase.expectedFindings || [];

  // For compliant content (expected 0 findings)
  if (expectedFindings.length === 0) {
    const passed = actualFindings.length === 0;
    return {
      testId: testCase.id,
      title: testCase.title,
      passed,
      expectedCount: 0,
      actualCount: actualFindings.length,
      falsePositives: actualFindings.map(f => f.offendingText),
      notes: passed ? 'Pass: Compliant content produced 0 findings' : 'Fail: False positive findings generated'
    };
  }

  // Count matches
  let truePositives = 0;
  const unmatchedExpected = [];

  expectedFindings.forEach((exp) => {
    const match = actualFindings.find((act) => {
      // Check if offending text overlaps or rule matches
      const textOverlap =
        act.offendingText &&
        (act.offendingText.includes(exp.offendingText) || exp.offendingText.includes(act.offendingText));
      const severityMatch = !exp.severity || String(act.severity).toLowerCase() === String(exp.severity).toLowerCase();
      return textOverlap && severityMatch;
    });

    if (match) {
      truePositives++;
    } else {
      unmatchedExpected.push(exp);
    }
  });

  const falsePositives = actualFindings.length - truePositives;
  const precision = actualFindings.length > 0 ? truePositives / actualFindings.length : 0;
  const recall = expectedFindings.length > 0 ? truePositives / expectedFindings.length : 0;
  const passed = recall >= 0.75 && falsePositives === 0;

  return {
    testId: testCase.id,
    title: testCase.title,
    passed,
    expectedCount: expectedFindings.length,
    actualCount: actualFindings.length,
    truePositives,
    falsePositives,
    precision: Number(precision.toFixed(2)),
    recall: Number(recall.toFixed(2)),
    unmatchedExpected
  };
}

module.exports = {
  STANDARD_FRESHBITE_GUIDELINES,
  EVALUATION_CASES,
  evaluateTestCase
};
