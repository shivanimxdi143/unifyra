const mongoose = require('mongoose');

/**
 * Submission Schema
 * Represents content submitted by team members for brand compliance checking
 */
const submissionSchema = new mongoose.Schema(
  {
    submittedBy: {
      type: String,
      required: [true, 'Submitter identifier (submittedBy) is required'],
      trim: true
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      hasImage: {
        type: Boolean,
        default: false
      },
      originalName: {
        type: String,
        trim: true,
        default: ''
      },
      mimeType: {
        type: String,
        trim: true,
        default: ''
      },
      size: {
        type: Number,
        default: 0
      },
      uploadedAt: {
        type: Date,
        default: null
      }
    },
    contentType: {
      type: String,
      trim: true,
      lowercase: true,
      enum: {
        values: [
          'social_post',
          'blog_post',
          'email',
          'ad_copy',
          'website_copy',
          'press_release',
          'other'
        ],
        message: '{VALUE} is not a supported content type'
      },
      default: 'social_post'
    },
    status: {
      type: String,
      lowercase: true,
      enum: {
        values: ['pending', 'analyzed', 'changes_requested', 'approved', 'rejected'],
        message: '{VALUE} is not a valid submission status'
      },
      default: 'pending'
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance (filtering by status and submitter)
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ submittedBy: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
