const mongoose = require('mongoose');

/**
 * GuidelineSuggestion Schema
 * Represents AI-proposed brand guideline refinements generated from recurring brand drift violations
 */
const guidelineSuggestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Suggestion title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Tone & Voice'
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level'
      },
      default: 'medium'
    },
    proposedRuleText: {
      type: String,
      required: [true, 'Proposed rule text is required'],
      trim: true
    },
    rationale: {
      type: String,
      required: [true, 'Rationale explaining the brand drift pattern is required'],
      trim: true
    },
    supportingEvidence: {
      violationCount: {
        type: Number,
        default: 0
      },
      affectedChannels: [
        {
          type: String,
          trim: true
        }
      ],
      sampleOffendingText: [
        {
          type: String,
          trim: true
        }
      ],
      recurringPattern: {
        type: String,
        trim: true,
        default: ''
      }
    },
    suggestedDoExample: {
      type: String,
      trim: true,
      default: ''
    },
    suggestedDontExample: {
      type: String,
      trim: true,
      default: ''
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'dismissed'],
        message: '{VALUE} is not a valid suggestion status'
      },
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    appliedGuidelineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guideline',
      default: null
    }
  },
  {
    timestamps: true
  }
);

guidelineSuggestionSchema.index({ status: 1, createdAt: -1 });

const GuidelineSuggestion = mongoose.model('GuidelineSuggestion', guidelineSuggestionSchema);

module.exports = GuidelineSuggestion;
