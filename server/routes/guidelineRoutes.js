const express = require('express');
const router = express.Router();
const {
  createGuideline,
  getGuidelines,
  getGuidelineById,
  updateGuideline,
  deleteGuideline
} = require('../controllers/guidelineController');

// /api/guidelines
router
  .route('/')
  .post(createGuideline)
  .get(getGuidelines);

// /api/guidelines/:id
router
  .route('/:id')
  .get(getGuidelineById)
  .put(updateGuideline)
  .delete(deleteGuideline);

module.exports = router;
