const express = require('express');
const router = express.Router();
const { analyzeSubmission } = require('../controllers/analysisController');
const { analysisRateLimiter } = require('../middleware/rateLimiter');

// POST /api/analysis/:submissionId with quota rate protection
router.post('/:submissionId', analysisRateLimiter, analyzeSubmission);

module.exports = router;
