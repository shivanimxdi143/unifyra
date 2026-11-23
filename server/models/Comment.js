const mongoose = require('mongoose');

/**
 * Comment Schema
 * Stores inline collaborative comments and threaded replies on submissions.
 * Top-level comments have parentId: null.
 * Replies reference the parent comment via parentId.
 */
const commentSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Reference to submission (submissionId) is required'],
      index: true
    },
    authorId: {
      type: String,
      required: [true, 'Author identifier (authorId) is required'],
      trim: true
    },
    authorRole: {
      type: String,
      enum: {
        values: ['Brand Manager', 'Employee', 'Reviewer'],
        message: '{VALUE} is not a valid author role'
      },
      default: 'Employee'
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment must not exceed 2000 characters']
    },
    // parentId: null = top-level comment; ObjectId = reply to that comment
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index: query all comments for a submission in chronological order
commentSchema.index({ submissionId: 1, createdAt: 1 });
// Index for fetching replies to a specific comment
commentSchema.index({ parentId: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
