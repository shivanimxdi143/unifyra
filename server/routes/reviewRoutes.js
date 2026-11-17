const express = require('express');
const router = express.Router();
const {
  createReview,
  getPendingReviews,
  getReviewHistory
} = require('../controllers/reviewController');

// GET /api/reviews/pending - list submissions awaiting review (Must be before /:submissionId)
router.get('/pending', getPendingReviews);

// POST /api/reviews/:submissionId - submit reviewer decision
// GET /api/reviews/:submissionId - get review decision history
router
  .route('/:submissionId')
  .post(createReview)
  .get(getReviewHistory);

module.exports = router;
