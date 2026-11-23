const express = require('express');
const router = express.Router();
const {
  getBrandDriftAnalytics,
  getGuidelineSuggestions,
  suggestGuidelineRefinements,
  approveSuggestion,
  dismissSuggestion
} = require('../controllers/analyticsController');
const { driftSuggestionLimiter } = require('../middleware/rateLimiter');

// GET /api/analytics/drift - Aggregate brand drift and recurring violations
router.get('/drift', getBrandDriftAnalytics);

// GET /api/analytics/suggestions - Fetch suggestions
router.get('/suggestions', getGuidelineSuggestions);

// POST /api/analytics/suggest-guideline-refinements - Generate suggestions via Gemini
router.post('/suggest-guideline-refinements', driftSuggestionLimiter, suggestGuidelineRefinements);

// POST /api/analytics/suggestions/:id/approve - Approve suggestion & create active guideline
router.post('/suggestions/:id/approve', approveSuggestion);

// POST /api/analytics/suggestions/:id/dismiss - Dismiss suggestion
router.post('/suggestions/:id/dismiss', dismissSuggestion);

module.exports = router;
