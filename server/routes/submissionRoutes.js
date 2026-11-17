const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionsByUser,
  resubmitContent
} = require('../controllers/submissionController');

// POST /api/submissions, GET /api/submissions
router
  .route('/')
  .post(createSubmission)
  .get(getSubmissions);

// GET /api/submissions/user/:userId
router
  .route('/user/:userId')
  .get(getSubmissionsByUser);

// GET /api/submissions/:id, PUT /api/submissions/:id (resubmission)
router
  .route('/:id')
  .get(getSubmissionById)
  .put(resubmitContent);

// Alias: PUT /api/submissions/:id/resubmit
router
  .route('/:id/resubmit')
  .put(resubmitContent);

module.exports = router;
