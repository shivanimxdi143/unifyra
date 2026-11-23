export const BRAND_PROFILE = {
  name: 'FreshBite',
  slogan: 'Real Food, Pure Energy.',
  category: 'Fast-Casual Organic Dining & Beverages',
  primaryColor: '#047857',
  accentColor: '#10b981',
  complianceScore: 94.2,
  activeLocations: 48,
  partnerFarms: 14,
  rulesEnforced: 26,
  brandValues: [
    { title: 'Radical Transparency', desc: '100% farm origin traceability on all greens & proteins' },
    { title: 'Vital Energy', desc: 'Whole food nourishment without artificial stimulants or preservatives' },
    { title: 'Community Grounded', desc: 'Welcoming, human-first voice free of corporate elitism' }
  ],
  toneKeywords: ['Vibrant', 'Transparent', 'Wholesome', 'Conversational', 'Grounded', 'Invigorating'],
  bannedKeywords: ['synergy', 'disruptive', 'paradigm-shifting', 'cure', 'cures', 'guaranteed detox', 'miracle cure', 'blowout sale']
};

export const BRAND_GUIDELINES = [
  {
    id: 'BG-101',
    category: 'Tone & Voice',
    title: 'Warm, Conversational & Transparent Tone',
    severity: 'medium',
    enforcement: 'Recommended',
    description: 'FreshBite speaks like a knowledgeable, welcoming local chef. Avoid stiff corporate vocabulary, overly technical food jargon, or condescending wellness elitism.',
    doExample: 'Our scratch dressings are whisked daily using extra virgin olive oil and cold-pressed lemons.',
    dontExample: 'Our proprietary culinary delivery system maximizes bioperformance via modern emulsification.',
    updatedAt: '2026-10-15'
  },
  {
    id: 'BG-102',
    category: 'Tone & Voice',
    title: 'Banned Corporate Jargon & Fluff',
    severity: 'high',
    enforcement: 'Strict',
    description: 'Corporate buzzwords (e.g., "synergy", "paradigm shift", "disrupt", "leverage", "ecosystem") dilute FreshBite authenticity and are strictly disallowed in customer-facing copy.',
    doExample: 'We partner directly with family farms in the Willamette Valley.',
    dontExample: 'We leverage strategic synergy across agricultural ecosystems to disrupt the fast-casual space.',
    updatedAt: '2026-11-01'
  },
  {
    id: 'BG-201',
    category: 'Health & Claims',
    title: 'Zero Unsubstantiated Medical Claims',
    severity: 'critical',
    enforcement: 'Mandatory',
    description: 'Never claim that any FreshBite item cures diseases, eliminates medical toxins, or guarantees medical outcomes. Use supportive wellness verbs such as "nourishes", "fuels", "rich in antioxidants".',
    doExample: 'Crafted with fresh ginger and turmeric to help support natural vitality throughout your afternoon.',
    dontExample: 'Our miracle elixir cures chronic inflammation and flushes all liver toxins in 24 hours guaranteed.',
    updatedAt: '2026-11-10'
  },
  {
    id: 'BG-202',
    category: 'Health & Claims',
    title: 'Mandatory Dietary & Allergen Disclaimers',
    severity: 'critical',
    enforcement: 'Mandatory',
    description: 'Whenever highlighting Gluten-Free (GF), Dairy-Free (DF), or Vegan (VG) options, include the cross-contact disclosure standard.',
    doExample: 'Gluten-Friendly bowl. Handcrafted in a kitchen that also processes wheat and tree nuts.',
    dontExample: '100% allergen-proof with absolute zero contamination risk.',
    updatedAt: '2026-09-20'
  },
  {
    id: 'BG-203',
    category: 'Health & Claims',
    title: 'Certified Organic & Farm Traceability Standard',
    severity: 'high',
    enforcement: 'Strict',
    description: 'Only use the word "Organic" if the ingredient is USDA Certified Organic and name the partner farm when making local provenance claims.',
    doExample: 'Featuring certified organic baby spinach from Oakridge Organics.',
    dontExample: 'Completely organic all-natural everything.',
    updatedAt: '2026-10-04'
  },
  {
    id: 'BG-301',
    category: 'Trademarks & Naming',
    title: 'Protected Trademarks & Signature Item Capitalization',
    severity: 'high',
    enforcement: 'Strict',
    description: 'Official FreshBite menu items must use proper title casing and the trademark symbol on first mention: Farm-to-Bowl™, Green Glow Elixir™, Harvest Protein Bowl™, and Avocado Crisp Tartine™.',
    doExample: 'Try our refreshing Green Glow Elixir™ paired with the Harvest Protein Bowl™.',
    dontExample: 'Try our green glow smoothie and harvest protein bowl.',
    updatedAt: '2026-08-12'
  },
  {
    id: 'BG-302',
    category: 'Trademarks & Naming',
    title: 'Official Tagline Punctuation & Integrity',
    severity: 'medium',
    enforcement: 'Strict',
    description: 'The FreshBite brand tagline is always "Real Food, Pure Energy." with a comma and period. Never use exclamation marks or alternate words.',
    doExample: 'FreshBite — Real Food, Pure Energy.',
    dontExample: 'FreshBite: Real Food, Pure Energy!!! or Real Food for Real Energy',
    updatedAt: '2026-08-15'
  },
  {
    id: 'BG-401',
    category: 'Promotional Style',
    title: 'Respectful, Non-Hype Promotional Phrasing',
    severity: 'medium',
    enforcement: 'Recommended',
    description: 'Avoid spammy clickbait tactics (ALL-CAPS screaming, excessive exclamation marks, panic urgency words like "BLOWOUT", "CRAZY DEAL"). Present promotions as thoughtful invitations.',
    doExample: 'Celebrate the weekend with $3 off your favorite bowl when you order through the app.',
    dontExample: '🚨 CRAZY WEEKEND BLOWOUT! BUY NOW BEFORE WE RUN OUT FOREVER OR YOU WILL REGRET IT!!!',
    updatedAt: '2026-10-28'
  },
  {
    id: 'BG-402',
    category: 'Promotional Style',
    title: 'FreshBite Circle Loyalty Terminology',
    severity: 'low',
    enforcement: 'Recommended',
    description: 'Refer to our loyalty program as "FreshBite Circle" and currency as "Bite Points". Avoid "VIP Club", "Cashback", or generic points terminology.',
    doExample: 'Earn double Bite Points as a FreshBite Circle member this Friday.',
    dontExample: 'Get free cashback tokens in our VIP club.',
    updatedAt: '2026-07-19'
  },
  {
    id: 'BG-501',
    category: 'Visual Identity',
    title: 'Visual Identity & Creative Composition Standards',
    severity: 'medium',
    enforcement: 'Recommended',
    description: 'Marketing creatives and imagery must feature clear brand identity, legible typography hierarchy, balanced layout with adequate margins, and cohesive visual tone aligned with natural vitality.',
    doExample: 'High-clarity image featuring visible brand logo in corner, clean modern typography, and natural vibrant lighting.',
    dontExample: 'Cluttered poster with obscured or distorted logo, illegible low-contrast text over busy photography, and harsh neon filters.',
    updatedAt: '2026-11-20'
  }
];

export const DEMO_PRESETS = [
  {
    id: 'preset-fail-claims',
    label: '🚨 High Violations: Unsubstantiated Health Claims & Clickbait',
    title: 'Summer Elixir Instagram Blast',
    channel: 'Social - Instagram',
    department: 'Digital Marketing',
    campaign: 'Summer Vitality 2026',
    content: '🔥 CRAZY BLOWOUT SALE! Grab our new Green Miracle Elixir today! It instantly cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed! Try our new farm to bowl drink now with 50% discount! Real Food Pure Energy!!!',
    mockVerdict: {
      score: 54,
      status: 'changes_requested',
      toneScore: 62,
      claimsScore: 38,
      trademarkScore: 65,
      summary: 'Multiple critical violations detected regarding medical claims (BG-201), aggressive promotional hype (BG-401), and unauthorized tagline formatting (BG-302). Human review required.',
      findings: [
        {
          id: 'f-1',
          ruleId: 'BG-201',
          severity: 'critical',
          offendingText: 'instantly cures chronic digestive inflammation and eliminates all toxins from your liver in 24 hours guaranteed',
          explanation: 'Making guaranteed medical treatment or cure claims violates FDA regulations and FreshBite policy.',
          suggestion: 'is crafted with cold-pressed celery and ginger to naturally nourish and refresh your body',
          ruleTitle: 'Zero Unsubstantiated Medical Claims'
        },
        {
          id: 'f-2',
          ruleId: 'BG-401',
          severity: 'medium',
          offendingText: '🔥 CRAZY BLOWOUT SALE!',
          explanation: 'Hyperbolic urgency phrasing conflicts with FreshBite’s mindful, premium brand voice.',
          suggestion: 'Savor summer with a special welcome offer:',
          ruleTitle: 'Respectful, Non-Hype Promotional Phrasing'
        },
        {
          id: 'f-3',
          ruleId: 'BG-301',
          severity: 'high',
          offendingText: 'farm to bowl drink',
          explanation: 'Protected trademark "Farm-to-Bowl™" must be hyphenated, capitalized, and include trademark mark.',
          suggestion: 'Farm-to-Bowl™ beverage',
          ruleTitle: 'Protected Trademarks & Signature Item Capitalization'
        },
        {
          id: 'f-4',
          ruleId: 'BG-302',
          severity: 'medium',
          offendingText: 'Real Food Pure Energy!!!',
          explanation: 'Brand slogan must strictly be punctuated as "Real Food, Pure Energy." without exclamation marks.',
          suggestion: 'Real Food, Pure Energy.',
          ruleTitle: 'Official Tagline Punctuation & Integrity'
        }
      ]
    }
  },
  {
    id: 'preset-fail-jargon',
    label: '⚠️ Medium Violations: Corporate Jargon & Trademark Formatting',
    title: 'LinkedIn Corporate Catering Announcement',
    channel: 'Social - LinkedIn',
    department: 'B2B Sales',
    campaign: 'Office Catering Fall 2026',
    content: 'FreshBite is leveraging revolutionary synergy to disrupt office lunches! Introducing our new harvest protein bowl and green glow drink, featuring paradigm-shifting nutrition engineered for peak corporate synergy. Contact our B2B team to monetize your wellness perks.',
    mockVerdict: {
      score: 71,
      status: 'changes_requested',
      toneScore: 58,
      claimsScore: 82,
      trademarkScore: 60,
      summary: 'Content contains disallowed corporate buzzwords (BG-102) and uncapitalized signature trademark items (BG-301).',
      findings: [
        {
          id: 'f-5',
          ruleId: 'BG-102',
          severity: 'high',
          offendingText: 'leveraging revolutionary synergy to disrupt office lunches',
          explanation: 'Buzzwords like "leveraging", "synergy", and "disrupt" violate FreshBite conversational standards.',
          suggestion: 'bringing wholesome, scratch-made meals to your team meetings',
          ruleTitle: 'Banned Corporate Jargon & Fluff'
        },
        {
          id: 'f-6',
          ruleId: 'BG-301',
          severity: 'high',
          offendingText: 'harvest protein bowl and green glow drink',
          explanation: 'Official trademark items must be formatted as Harvest Protein Bowl™ and Green Glow Elixir™.',
          suggestion: 'Harvest Protein Bowl™ and Green Glow Elixir™',
          ruleTitle: 'Protected Trademarks & Signature Item Capitalization'
        },
        {
          id: 'f-7',
          ruleId: 'BG-102',
          severity: 'medium',
          offendingText: 'paradigm-shifting nutrition engineered for peak corporate synergy',
          explanation: 'Avoid cold engineering metaphors when discussing organic food.',
          suggestion: 'nutrient-dense meals crafted to sustain focus and natural energy throughout your workday',
          ruleTitle: 'Banned Corporate Jargon & Fluff'
        }
      ]
    }
  },
  {
    id: 'preset-compliant',
    label: '✅ High Compliance: Approved FreshBite Brand Voice (98%)',
    title: 'Weekend Farmer Partnership Newsletter',
    channel: 'Email Newsletter',
    department: 'Brand Communications',
    campaign: 'Fall Harvest Storytelling',
    content: 'This Saturday, we are proud to spotlight Oakridge Organics, where every crisp leaf of baby kale in our Harvest Protein Bowl™ is harvested at sunrise. Pair your bowl with our signature Green Glow Elixir™, freshly pressed with heirloom apples and organic ginger. Real Food, Pure Energy. Gluten-Friendly options available upon request.',
    mockVerdict: {
      score: 98,
      status: 'approved',
      toneScore: 99,
      claimsScore: 97,
      trademarkScore: 100,
      summary: 'Exemplary brand compliance. Tone is authentic, farm traceability is explicit, trademarks are correctly capitalized, and the official tagline is properly formatted.',
      findings: []
    }
  }
];

export const INITIAL_SUBMISSIONS = [
  {
    id: 'SUB-2026-089',
    title: 'Summer Elixir Instagram Launch',
    submitter: {
      name: 'Elena Rostova',
      role: 'Social Media Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Social - Instagram',
    department: 'Marketing',
    campaign: 'Summer Vitality 2026',
    submittedAt: '2026-11-16T14:30:00Z',
    status: 'pending',
    score: 68,
    content: 'Get our new Green Miracle Elixir! It detoxifies your liver and guarantees instant digestive health after just one sip. Order now with 30% off your first Farm-to-Bowl™ purchase! Real Food, Pure Energy.',
    findingsCount: 2,
    findings: [
      {
        id: 'f-89-1',
        ruleId: 'BG-201',
        severity: 'critical',
        offendingText: 'detoxifies your liver and guarantees instant digestive health',
        explanation: 'Medical guarantee violating FDA guidance and FreshBite wellness standards.',
        suggestion: 'naturally hydrates and revitalizes with cold-pressed leafy greens and ginger'
      },
      {
        id: 'f-89-2',
        ruleId: 'BG-401',
        severity: 'medium',
        offendingText: 'Get our new Green Miracle Elixir!',
        explanation: 'Unregistered product name variation; should be Green Glow Elixir™.',
        suggestion: 'Meet our refreshing Green Glow Elixir™'
      }
    ],
    reviewerNotes: ''
  },
  {
    id: 'SUB-2026-088',
    title: 'Fall Menu In-Store Table Tent Cards',
    submitter: {
      name: 'Marcus Vance',
      role: 'Retail Design Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'In-Store Signage',
    department: 'Retail Operations',
    campaign: 'Autumn Harvest 2026',
    submittedAt: '2026-11-16T11:15:00Z',
    status: 'pending',
    score: 84,
    content: 'Warm up with our Roasted Butternut Tartine. Made with slow-roasted squash from Willow Creek Farm and house-whipped lemon ricotta. Pair with cold-pressed apple cider. Gluten-Friendly bread available.',
    findingsCount: 1,
    findings: [
      {
        id: 'f-88-1',
        ruleId: 'BG-202',
        severity: 'high',
        offendingText: 'Gluten-Friendly bread available.',
        explanation: 'Missing mandatory kitchen allergen cross-contact disclosure.',
        suggestion: 'Gluten-Friendly bread available (prepared in a facility that handles wheat).'
      }
    ],
    reviewerNotes: ''
  },
  {
    id: 'SUB-2026-087',
    title: 'TikTok Recipe Teaser - Avocado Crisp Tartine',
    submitter: {
      name: 'Chloe Kim',
      role: 'Content Creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Social - TikTok',
    department: 'Digital Marketing',
    campaign: 'Snack Series 2026',
    submittedAt: '2026-11-15T18:45:00Z',
    status: 'changes_requested',
    score: 62,
    content: 'Want to cure your morning fatigue forever? Try our viral avocado crisp tartine with secret seeds! Guaranteed to burn fat all day. Real Food Pure Energy!!',
    findingsCount: 3,
    findings: [
      {
        id: 'f-87-1',
        ruleId: 'BG-201',
        severity: 'critical',
        offendingText: 'cure your morning fatigue forever ... Guaranteed to burn fat all day',
        explanation: 'Extreme pseudoscientific health claims strictly forbidden.',
        suggestion: 'start your morning with sustained, nutrient-dense energy'
      },
      {
        id: 'f-87-2',
        ruleId: 'BG-301',
        severity: 'high',
        offendingText: 'avocado crisp tartine',
        explanation: 'Missing trademark capitalisation: Avocado Crisp Tartine™.',
        suggestion: 'Avocado Crisp Tartine™'
      },
      {
        id: 'f-87-3',
        ruleId: 'BG-302',
        severity: 'medium',
        offendingText: 'Real Food Pure Energy!!',
        explanation: 'Slogan must be "Real Food, Pure Energy."',
        suggestion: 'Real Food, Pure Energy.'
      }
    ],
    reviewerNotes: 'Please revise the health claims immediately before publishing. Tone also needs to be more grounded and less sensationalist.'
  },
  {
    id: 'SUB-2026-086',
    title: 'National Press Release - 15 New West Coast Locations',
    submitter: {
      name: 'David Sterling',
      role: 'Communications VP',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Press Release',
    department: 'Corporate PR',
    campaign: 'Western Expansion Q4',
    submittedAt: '2026-11-15T09:20:00Z',
    status: 'approved',
    score: 96,
    content: 'FreshBite today announced the expansion of its Farm-to-Bowl™ organic dining network with 15 new restaurant openings across Oregon and Washington. Every location features scratch cooking with certified regional farm suppliers. Real Food, Pure Energy.',
    findingsCount: 0,
    findings: [],
    reviewerNotes: 'Excellent copy! Accurate trademarks and crisp brand framing.'
  },
  {
    id: 'SUB-2026-085',
    title: 'Customer Loyalty Email - Bite Points Double Week',
    submitter: {
      name: 'Elena Rostova',
      role: 'Social Media Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Email Newsletter',
    department: 'Marketing',
    campaign: 'Loyalty Rewards November',
    submittedAt: '2026-11-14T16:00:00Z',
    status: 'approved',
    score: 95,
    content: 'Enjoy double Bite Points all week long as a member of the FreshBite Circle. Every handcrafted salad and bowl brings you closer to your next seasonal favorite on us. Real Food, Pure Energy.',
    findingsCount: 0,
    findings: [],
    reviewerNotes: 'Approved. Perfect usage of FreshBite Circle terminology.'
  },
  {
    id: 'SUB-2026-084',
    title: 'Paid Meta Ad - Flash 50% Off Code Blast',
    submitter: {
      name: 'Chloe Kim',
      role: 'Content Creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Digital Ads',
    department: 'Performance Marketing',
    campaign: 'Q4 Customer Acquisition',
    submittedAt: '2026-11-13T12:00:00Z',
    status: 'rejected',
    score: 48,
    content: '🚨 STOP SCROLLING! 50% OFF CRAZY BLOWOUT! Use coupon BOWL50 now! The best diet miracle of your life or your money back! 100% cure for sluggish mornings!',
    findingsCount: 4,
    findings: [
      {
        id: 'f-84-1',
        ruleId: 'BG-401',
        severity: 'critical',
        offendingText: '🚨 STOP SCROLLING! 50% OFF CRAZY BLOWOUT!',
        explanation: 'Violates non-hype policy; cheapens the brand identity.',
        suggestion: 'Taste the season: Enjoy an exclusive welcome discount on your first online bowl.'
      },
      {
        id: 'f-84-2',
        ruleId: 'BG-201',
        severity: 'critical',
        offendingText: 'The best diet miracle of your life ... 100% cure for sluggish mornings!',
        explanation: 'Prohibited medical and miracle dietary claims.',
        suggestion: 'Clean energy you can feel, crafted with organic ingredients.'
      }
    ],
    reviewerNotes: 'Completely rejected. We do not do high-pressure spam ads. Please reread BG-401 and BG-201.'
  }
];

export const SUBMISSION_HISTORY = [
  ...INITIAL_SUBMISSIONS,
  {
    id: 'SUB-2026-083',
    title: 'Instagram Reel: Behind the Scenes with Chef Sofia',
    submitter: {
      name: 'Sofia Chen',
      role: 'Culinary Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Social - Instagram',
    department: 'Culinary Team',
    campaign: 'Chef Notes Fall 2026',
    submittedAt: '2026-11-12T10:15:00Z',
    status: 'approved',
    score: 97,
    content: 'Chef Sofia demonstrates how we balance Meyer lemon zest with fresh rosemary for our Autumn vinaigrette. Scratch cooking, honest ingredients. Real Food, Pure Energy.',
    findingsCount: 0,
    findings: [],
    reviewerNotes: 'Approved automatically with gold standard score.'
  },
  {
    id: 'SUB-2026-082',
    title: 'Google Ads Search Headline Variations',
    submitter: {
      name: 'Marcus Vance',
      role: 'Retail Design Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'Digital Ads',
    department: 'Digital Marketing',
    campaign: 'Search Capture 2026',
    submittedAt: '2026-11-11T15:20:00Z',
    status: 'approved',
    score: 93,
    content: 'Fresh Organic Bowls Near You | FreshBite Farm-to-Bowl™ | Order Online for Pickup & Delivery.',
    findingsCount: 0,
    findings: [],
    reviewerNotes: 'Accurate and compliant.'
  },
  {
    id: 'SUB-2026-081',
    title: 'Store Front Window Decal: Winter Seasonal Menu',
    submitter: {
      name: 'David Sterling',
      role: 'Communications VP',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    channel: 'In-Store Signage',
    department: 'Retail Operations',
    campaign: 'Winter Warmers 2026',
    submittedAt: '2026-11-10T08:45:00Z',
    status: 'changes_requested',
    score: 79,
    content: 'Cozy up with our Roasted Roots Bowl. Packed with 100% certified organic roasted parsnips, wild rice, and pomegranate seeds. Real Food Pure Energy',
    findingsCount: 1,
    findings: [
      {
        id: 'f-81-1',
        ruleId: 'BG-302',
        severity: 'medium',
        offendingText: 'Real Food Pure Energy',
        explanation: 'Missing comma and period in official tagline.',
        suggestion: 'Real Food, Pure Energy.'
      }
    ],
    reviewerNotes: 'Please correct tagline punctuation before printing window vinyls.'
  }
];

export const CHANNEL_METRICS = [
  { channel: 'Social Media', count: 142, complianceRate: 91.4, icon: 'Share2', color: 'emerald' },
  { channel: 'Email Marketing', count: 86, complianceRate: 97.2, icon: 'Mail', color: 'teal' },
  { channel: 'In-Store Signage', count: 45, complianceRate: 98.0, icon: 'Store', color: 'green' },
  { channel: 'Digital Ads', count: 69, complianceRate: 88.5, icon: 'Megaphone', color: 'amber' }
];

export const RECENT_AUDIT_LOGS = [
  { id: 'LOG-401', action: 'AI Audit Completed', target: 'Summer Elixir Instagram Blast', score: 54, status: 'changes_requested', time: '12m ago', user: 'Elena Rostova' },
  { id: 'LOG-400', action: 'Review Decision: Approved', target: 'Customer Loyalty Email - Bite Points Double Week', score: 95, status: 'approved', time: '1h ago', user: 'Reviewer Shivani' },
  { id: 'LOG-399', action: 'Guideline Updated', target: 'BG-201: Zero Unsubstantiated Medical Claims', score: null, status: 'updated', time: '3h ago', user: 'Brand Governance Admin' },
  { id: 'LOG-398', action: 'Review Decision: Rejected', target: 'Paid Meta Ad - Flash 50% Off Code Blast', score: 48, status: 'rejected', time: '5h ago', user: 'Reviewer Sumit' },
  { id: 'LOG-397', action: 'AI Audit Completed', target: 'National Press Release - West Coast Locations', score: 96, status: 'approved', time: '8h ago', user: 'David Sterling' }
];
