const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionsByUser,
  resubmitContent,
  getSubmissionImage
} = require('../controllers/submissionController');
const { handleUpload } = require('../middleware/upload');

// POST /api/submissions, GET /api/submissions
router
  .route('/')
  .post(handleUpload, createSubmission)
  .get(getSubmissions);

// GET /api/submissions/user/:userId
router
  .route('/user/:userId')
  .get(getSubmissionsByUser);

// GET /api/submissions/:id/image (serves demo image preview)
router
  .route('/:id/image')
  .get(getSubmissionImage);

// GET /api/submissions/:id, PUT /api/submissions/:id (resubmission)
router
  .route('/:id')
  .get(getSubmissionById)
  .put(handleUpload, resubmitContent);

// Alias: PUT /api/submissions/:id/resubmit
router
  .route('/:id/resubmit')
  .put(handleUpload, resubmitContent);

module.exports = router;
