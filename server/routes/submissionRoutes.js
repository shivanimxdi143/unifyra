const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionsByUser
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

// GET /api/submissions/:id
router
  .route('/:id')
  .get(getSubmissionById);

module.exports = router;
