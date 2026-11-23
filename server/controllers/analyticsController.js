const mongoose = require('mongoose');
const { Submission, Finding, Guideline, GuidelineSuggestion } = require('../models');
const { generateDriftGuidelineSuggestions } = require('../services/geminiService');

/**
 * Helper to compute date range window
 * @param {string} timeRange - '7d', '30d', '90d', 'all'
 */
const getDateRange = (timeRange = '30d') => {
  const now = new Date();
  let days = 30;

  if (timeRange === '7d') days = 7;
  else if (timeRange === '90d') days = 90;
  else if (timeRange === 'all') return { currentStart: null, previousStart: null };

  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

  return { currentStart, previousStart, days };
};

/**
 * @route   GET /api/analytics/drift
 * @desc    Get real brand drift intelligence, recurring violations, and cross-channel statistics
 * @access  Public
 */
const getBrandDriftAnalytics = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { currentStart, previousStart } = getDateRange(timeRange);

    // 1. Fetch active guidelines to build reference dictionary
    const guidelines = await Guideline.find({});
    const ruleDict = new Map();
    const categoryRulesCount = new Map();

    guidelines.forEach(g => {
      const cat = g.category || 'General';
      categoryRulesCount.set(cat, (categoryRulesCount.get(cat) || 0) + 1);

      if (Array.isArray(g.rules)) {
        g.rules.forEach(r => {
          if (r._id) {
            ruleDict.set(r._id.toString(), {
              title: g.title,
              category: cat,
              severity: r.severity || 'medium',
              ruleText: r.ruleText
            });
          }
        });
      }
      if (g._id) {
        ruleDict.set(g._id.toString(), {
          title: g.title,
          category: cat,
          severity: 'medium',
          ruleText: g.description || g.title
        });
      }
    });

    // 2. Aggregate submissions in current period
    const subMatchFilter = {};
    if (currentStart) {
      subMatchFilter.createdAt = { $gte: currentStart };
    }

    const submissions = await Submission.find(subMatchFilter).sort({ createdAt: -1 });
    const totalSubmissions = submissions.length;
    const auditedSubmissions = submissions.filter(s => s.status !== 'pending');
    
    // Average compliance score
    const scores = auditedSubmissions
      .map(s => s.complianceScore)
      .filter(s => typeof s === 'number' && !isNaN(s));
    const averageComplianceScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

    // Previous period submissions for trend comparison
    let previousPeriodAvgScore = null;
    let previousSubmissionsCount = 0;
    if (previousStart && currentStart) {
      const prevSubs = await Submission.find({
        createdAt: { $gte: previousStart, $lt: currentStart }
      });
      previousSubmissionsCount = prevSubs.length;
      const prevScores = prevSubs
        .filter(s => s.status !== 'pending' && typeof s.complianceScore === 'number')
        .map(s => s.complianceScore);
      if (prevScores.length > 0) {
        previousPeriodAvgScore = Math.round((prevScores.reduce((a, b) => a + b, 0) / prevScores.length) * 10) / 10;
      }
    }

    // 3. Aggregate findings in current period
    const submissionIds = submissions.map(s => s._id);
    const findings = await Finding.find({ submissionId: { $in: submissionIds } }).sort({ createdAt: -1 });
    const totalViolations = findings.length;

    // Severity breakdown
    const severityDistribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    findings.forEach(f => {
      const sev = (f.severity || 'medium').toLowerCase();
      if (severityDistribution[sev] !== undefined) {
        severityDistribution[sev]++;
      } else {
        severityDistribution.medium++;
      }
    });

    // Submissions map for channel lookup
    const subChannelMap = new Map();
    submissions.forEach(s => {
      subChannelMap.set(s._id.toString(), s.contentType || s.channel || 'social_post');
    });

    // 4. Recurring Violations Aggregation (Group by ruleId or category)
    const ruleGrouping = new Map();

    findings.forEach(f => {
      const ruleKey = f.ruleId ? f.ruleId.toString() : 'UNKNOWN_RULE';
      const ref = ruleDict.get(ruleKey) || {
        title: f.offendingText ? `Violation: ${f.offendingText.slice(0, 28)}...` : 'Brand Standard',
        category: 'Tone & Voice',
        severity: f.severity || 'medium',
        ruleText: f.explanation || ''
      };

      if (!ruleGrouping.has(ruleKey)) {
        ruleGrouping.set(ruleKey, {
          ruleId: ruleKey !== 'UNKNOWN_RULE' ? ruleKey : null,
          ruleTitle: ref.title,
          category: ref.category,
          severity: f.severity || ref.severity,
          ruleText: ref.ruleText,
          violationCount: 0,
          sampleOffendingText: new Set(),
          affectedChannels: new Set()
        });
      }

      const cluster = ruleGrouping.get(ruleKey);
      cluster.violationCount++;
      if (f.offendingText) cluster.sampleOffendingText.add(f.offendingText);
      const ch = subChannelMap.get(f.submissionId.toString());
      if (ch) cluster.affectedChannels.add(ch);
    });

    const topRecurringViolations = Array.from(ruleGrouping.values())
      .map(c => ({
        ...c,
        percentageOfTotal: totalViolations > 0 ? Math.round((c.violationCount / totalViolations) * 100) : 0,
        sampleOffendingText: Array.from(c.sampleOffendingText).slice(0, 5),
        affectedChannels: Array.from(c.affectedChannels)
      }))
      .sort((a, b) => b.violationCount - a.violationCount);

    // 5. Category Breakdown
    const categoryStats = new Map();
    const standardCategories = ['Tone & Voice', 'Health & Claims', 'Trademarks & Naming', 'Promotional Style', 'Visual Identity'];
    standardCategories.forEach(cat => {
      categoryStats.set(cat, {
        category: cat,
        violationCount: 0,
        percentage: 0,
        driftLevel: 'Stable'
      });
    });

    findings.forEach(f => {
      const ruleKey = f.ruleId ? f.ruleId.toString() : null;
      const cat = ruleKey && ruleDict.has(ruleKey) ? ruleDict.get(ruleKey).category : 'Tone & Voice';
      if (!categoryStats.has(cat)) {
        categoryStats.set(cat, { category: cat, violationCount: 0, percentage: 0, driftLevel: 'Stable' });
      }
      categoryStats.get(cat).violationCount++;
    });

    const categoryBreakdown = Array.from(categoryStats.values()).map(catObj => {
      const percentage = totalViolations > 0 ? Math.round((catObj.violationCount / totalViolations) * 100) : 0;
      let driftLevel = 'Stable';
      if (percentage >= 35) driftLevel = 'Severe Drift';
      else if (percentage >= 20) driftLevel = 'Moderate Drift';
      else if (percentage > 0) driftLevel = 'Minor Drift';

      return {
        ...catObj,
        percentage,
        driftLevel
      };
    }).sort((a, b) => b.violationCount - a.violationCount);

    // 6. Channel Breakdown
    const channelMap = new Map();
    submissions.forEach(s => {
      const chKey = s.contentType || s.channel || 'social_post';
      if (!channelMap.has(chKey)) {
        channelMap.set(chKey, {
          channel: chKey,
          label: chKey.replace(/_/g, ' ').toUpperCase(),
          totalSubmissions: 0,
          scores: [],
          violationsCount: 0
        });
      }
      const entry = channelMap.get(chKey);
      entry.totalSubmissions++;
      if (typeof s.complianceScore === 'number') {
        entry.scores.push(s.complianceScore);
      }
    });

    // Attach violations count per channel
    findings.forEach(f => {
      const ch = subChannelMap.get(f.submissionId.toString()) || 'social_post';
      if (channelMap.has(ch)) {
        channelMap.get(ch).violationsCount++;
      }
    });

    const channelBreakdown = Array.from(channelMap.values()).map(chObj => {
      const avgScore = chObj.scores.length > 0
        ? Math.round(chObj.scores.reduce((a, b) => a + b, 0) / chObj.scores.length)
        : null;
      return {
        channel: chObj.channel,
        label: chObj.label,
        totalSubmissions: chObj.totalSubmissions,
        averageScore: avgScore,
        violationsCount: chObj.violationsCount
      };
    }).sort((a, b) => b.totalSubmissions - a.totalSubmissions);

    // 7. Timeline Trends (Daily or grouped by submission dates)
    const trendMap = new Map();
    submissions.forEach(s => {
      const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
      if (!trendMap.has(dateStr)) {
        trendMap.set(dateStr, { date: dateStr, submissions: 0, scores: [], violations: 0 });
      }
      const entry = trendMap.get(dateStr);
      entry.submissions++;
      if (typeof s.complianceScore === 'number') entry.scores.push(s.complianceScore);
    });

    findings.forEach(f => {
      const dateStr = new Date(f.createdAt).toISOString().split('T')[0];
      if (trendMap.has(dateStr)) {
        trendMap.get(dateStr).violations++;
      }
    });

    const timelineTrends = Array.from(trendMap.values())
      .map(t => ({
        date: t.date,
        submissionsCount: t.submissions,
        violationsCount: t.violations,
        averageScore: t.scores.length > 0 ? Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length) : null
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 8. Period Comparison Delta
    const hasComparison = Boolean(previousSubmissionsCount > 0 && previousPeriodAvgScore !== null);
    const scoreDelta = hasComparison && averageComplianceScore !== null
      ? Math.round((averageComplianceScore - previousPeriodAvgScore) * 10) / 10
      : null;

    res.status(200).json({
      success: true,
      data: {
        timeRange,
        summary: {
          totalSubmissions,
          auditedSubmissions: auditedSubmissions.length,
          totalViolations,
          averageComplianceScore,
          activeGuidelinesCount: guidelines.length
        },
        comparison: {
          hasComparison,
          previousPeriodAvgScore,
          previousSubmissionsCount,
          scoreDelta,
          interpretation: hasComparison
            ? scoreDelta >= 0
              ? `Compliance score improved by ${scoreDelta}% compared to previous period.`
              : `Brand drift detected: compliance score decreased by ${Math.abs(scoreDelta)}%.`
            : 'Insufficient historical data for period-over-period trend.'
        },
        severityDistribution,
        topRecurringViolations,
        categoryBreakdown,
        channelBreakdown,
        timelineTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/suggestions
 * @desc    Fetch pending or past AI-suggested guideline refinements
 * @access  Public
 */
const getGuidelineSuggestions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ['pending', 'approved', 'dismissed'].includes(status.toLowerCase())) {
      filter.status = status.toLowerCase();
    }

    const suggestions = await GuidelineSuggestion.find(filter)
      .sort({ createdAt: -1 })
      .populate('appliedGuidelineId', 'title category');

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/analytics/suggest-guideline-refinements
 * @desc    Trigger Gemini to generate guideline suggestions from recurring brand drift violations
 * @access  Public
 */
const suggestGuidelineRefinements = async (req, res, next) => {
  try {
    // 1. Gather all active guidelines and all findings
    const [guidelines, findings, submissions] = await Promise.all([
      Guideline.find({}),
      Finding.find({}).sort({ createdAt: -1 }),
      Submission.find({})
    ]);

    if (!findings || findings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Zero brand violations recorded in the database. Brand adherence is healthy; no guideline additions needed.',
        data: []
      });
    }

    // 2. Aggregate recurring clusters
    const subChannelMap = new Map();
    submissions.forEach(s => subChannelMap.set(s._id.toString(), s.contentType || 'social_post'));

    const ruleDict = new Map();
    guidelines.forEach(g => {
      const cat = g.category || 'General';
      if (Array.isArray(g.rules)) {
        g.rules.forEach(r => {
          if (r._id) {
            ruleDict.set(r._id.toString(), { title: g.title, category: cat, ruleText: r.ruleText });
          }
        });
      }
      if (g._id) {
        ruleDict.set(g._id.toString(), { title: g.title, category: cat, ruleText: g.description });
      }
    });

    const ruleClusters = new Map();
    findings.forEach(f => {
      const key = f.ruleId ? f.ruleId.toString() : (f.offendingText ? f.offendingText.slice(0, 30) : 'General');
      const ref = ruleDict.get(key) || { title: key, category: 'Tone & Voice', ruleText: '' };

      if (!ruleClusters.has(key)) {
        ruleClusters.set(key, {
          ruleId: key,
          ruleTitle: ref.title,
          category: ref.category,
          violationCount: 0,
          sampleOffendingText: new Set(),
          affectedChannels: new Set()
        });
      }

      const cluster = ruleClusters.get(key);
      cluster.violationCount++;
      if (f.offendingText) cluster.sampleOffendingText.add(f.offendingText);
      const ch = subChannelMap.get(f.submissionId.toString());
      if (ch) cluster.affectedChannels.add(ch);
    });

    const recurringViolations = Array.from(ruleClusters.values())
      .map(c => ({
        ...c,
        percentageOfTotal: Math.round((c.violationCount / findings.length) * 100),
        sampleOffendingText: Array.from(c.sampleOffendingText).slice(0, 5),
        affectedChannels: Array.from(c.affectedChannels)
      }))
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 4);

    // 3. Generate suggestions via Gemini Drift Intelligence
    const generated = await generateDriftGuidelineSuggestions({
      recurringViolations,
      activeGuidelines: guidelines
    });

    // 4. Persist suggestions in MongoDB as 'pending'
    const savedSuggestions = [];
    for (let i = 0; i < generated.length; i++) {
      const item = generated[i];
      // Match evidence directly to corresponding violation cluster
      const matchedCluster = recurringViolations.find(c => c.category === item.category) || recurringViolations[i] || recurringViolations[0];

      // Check for duplicate pending suggestion with exact same proposed text
      const existing = await GuidelineSuggestion.findOne({
        proposedRuleText: item.proposedRuleText,
        status: 'pending'
      });

      if (!existing) {
        const doc = await GuidelineSuggestion.create({
          title: item.title,
          category: item.category,
          severity: item.severity,
          proposedRuleText: item.proposedRuleText,
          rationale: item.rationale,
          supportingEvidence: {
            violationCount: matchedCluster?.violationCount || 1,
            affectedChannels: matchedCluster?.affectedChannels || ['social_post'],
            sampleOffendingText: matchedCluster?.sampleOffendingText || (item.suggestedDontExample ? [item.suggestedDontExample] : []),
            recurringPattern: item.recurringPattern || (matchedCluster ? `${matchedCluster.violationCount} recurring violations in ${matchedCluster.category}` : '')
          },
          suggestedDoExample: item.suggestedDoExample,
          suggestedDontExample: item.suggestedDontExample,
          confidence: item.confidence,
          status: 'pending'
        });
        savedSuggestions.push(doc);
      } else {
        savedSuggestions.push(existing);
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${savedSuggestions.length} actionable guideline suggestions from brand drift analysis.`,
      data: savedSuggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/analytics/suggestions/:id/approve
 * @desc    Approve an AI guideline refinement and automatically add it to active Brand Guidelines
 * @access  Public
 */
const approveSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerName = 'Brand Manager' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid suggestion ID format: '${id}'` }
      });
    }

    const suggestion = await GuidelineSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: { message: `Suggestion not found with ID: '${id}'` }
      });
    }

    if (suggestion.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This suggestion has already been approved and applied.',
        error: { message: 'This suggestion has already been approved and applied.' }
      });
    }

    if (suggestion.status === 'dismissed') {
      return res.status(400).json({
        success: false,
        message: 'Dismissed suggestions cannot be approved.',
        error: { message: 'Dismissed suggestions cannot be approved.' }
      });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a suggestion with status '${suggestion.status}'.`,
        error: { message: `Cannot approve a suggestion with status '${suggestion.status}'.` }
      });
    }

    // Check if an identical guideline is already active to prevent duplicate active guidelines
    let newGuideline = await Guideline.findOne({
      brandName: 'FreshBite',
      title: suggestion.title
    });

    if (!newGuideline) {
      newGuideline = await Guideline.create({
        brandName: 'FreshBite',
        title: suggestion.title,
        category: suggestion.category,
        description: suggestion.proposedRuleText,
        createdBy: `${reviewerName} (AI Drift Intelligence)`,
        rules: [
          {
            ruleText: suggestion.proposedRuleText,
            severity: suggestion.severity,
            examples: [suggestion.suggestedDoExample, suggestion.suggestedDontExample].filter(Boolean)
          }
        ]
      });
    }

    // Update suggestion status
    suggestion.status = 'approved';
    suggestion.reviewedBy = reviewerName;
    suggestion.reviewedAt = new Date();
    suggestion.appliedGuidelineId = newGuideline._id;
    await suggestion.save();

    res.status(200).json({
      success: true,
      message: `Suggestion approved and converted into official brand guideline "${newGuideline.title}".`,
      data: {
        suggestion,
        guideline: newGuideline
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/analytics/suggestions/:id/dismiss
 * @desc    Dismiss an AI guideline suggestion without applying it
 * @access  Public
 */
const dismissSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerName = 'Brand Manager' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid suggestion ID format: '${id}'` }
      });
    }

    const suggestion = await GuidelineSuggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: { message: `Suggestion not found with ID: '${id}'` }
      });
    }

    if (suggestion.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved suggestions cannot be dismissed.',
        error: { message: 'Approved suggestions cannot be dismissed.' }
      });
    }

    if (suggestion.status === 'dismissed') {
      return res.status(400).json({
        success: false,
        message: 'This suggestion has already been dismissed.',
        error: { message: 'This suggestion has already been dismissed.' }
      });
    }

    suggestion.status = 'dismissed';
    suggestion.reviewedBy = reviewerName;
    suggestion.reviewedAt = new Date();
    await suggestion.save();

    res.status(200).json({
      success: true,
      message: 'Suggestion dismissed.',
      data: suggestion
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrandDriftAnalytics,
  getGuidelineSuggestions,
  suggestGuidelineRefinements,
  approveSuggestion,
  dismissSuggestion
};
