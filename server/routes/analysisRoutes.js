const express = require('express');
const router = express.Router();
const { analyzeSubmission } = require('../controllers/analysisController');

// POST /api/analysis/:submissionId
router.post('/:submissionId', analyzeSubmission);

module.exports = router;
