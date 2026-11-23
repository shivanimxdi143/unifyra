const mongoose = require('mongoose');

/**
 * Finding Schema
 * Represents structured compliance findings identified during AI brand governance checks
 */
const findingSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Reference to submission (submissionId) is required'],
      index: true
    },
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    severity: {
      type: String,
      required: [true, 'Finding severity is required'],
      lowercase: true,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level'
      },
      default: 'medium'
    },
    offendingText: {
      type: String,
      required: [true, 'Offending text snippet is required'],
      trim: true
    },
    explanation: {
      type: String,
      required: [true, 'Explanation of the brand violation is required'],
      trim: true
    },
    suggestedCorrection: {
      type: String,
      trim: true,
      default: ''
    },
    visualArea: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying findings per submission ordered by severity or date
findingSchema.index({ submissionId: 1, severity: 1 });

const Finding = mongoose.model('Finding', findingSchema);

module.exports = Finding;
