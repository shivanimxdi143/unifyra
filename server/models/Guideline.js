const mongoose = require('mongoose');

/**
 * Subdocument schema for individual brand rules within a guideline
 */
const ruleSchema = new mongoose.Schema(
  {
    ruleText: {
      type: String,
      required: [true, 'Rule text is required'],
      trim: true
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level'
      },
      default: 'medium'
    },
    examples: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { _id: true }
);

/**
 * Guideline Schema
 * Represents brand guidelines created and managed for brand governance
 */
const guidelineSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      default: 'FreshBite'
    },
    title: {
      type: String,
      required: [true, 'Guideline title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    rules: {
      type: [ruleSchema],
      default: []
    },
    createdBy: {
      type: String,
      required: [true, 'Creator identifier (createdBy) is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast retrieval by brand and category
guidelineSchema.index({ brandName: 1, category: 1 });

const Guideline = mongoose.model('Guideline', guidelineSchema);

module.exports = Guideline;
