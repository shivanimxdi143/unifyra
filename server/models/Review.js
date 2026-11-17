const mongoose = require('mongoose');

/**
 * Review Schema
 * Stores decisions and audit records from human brand reviewers
 */
const reviewSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Reference to submission (submissionId) is required'],
      index: true
    },
    reviewerId: {
      type: String,
      required: [true, 'Reviewer identifier (reviewerId) is required'],
      trim: true
    },
    decision: {
      type: String,
      required: [true, 'Review decision is required'],
      lowercase: true,
      enum: {
        values: ['approved', 'rejected', 'changes_requested'],
        message: '{VALUE} is not a valid review decision'
      }
    },
    comments: {
      type: String,
      required: [true, 'Review comments are required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying review history per submission
reviewSchema.index({ submissionId: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
