const mongoose = require('mongoose');

/**
 * Notification Schema
 * Stores governance event notifications for each demo role.
 * Generated automatically by controllers on key workflow events.
 */
const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'submission_received',
          'resubmission_received',
          'approved',
          'rejected',
          'changes_requested',
          'comment_added',
          'reply_added'
        ],
        message: '{VALUE} is not a valid notification type'
      }
    },
    // The demo role that should receive this notification
    recipientRole: {
      type: String,
      required: [true, 'Recipient role is required'],
      enum: {
        values: ['Brand Manager', 'Employee', 'Reviewer'],
        message: '{VALUE} is not a valid recipient role'
      }
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: 500
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      default: null
    },
    // Human-readable identifier (submittedBy or reviewerId)
    actorId: {
      type: String,
      trim: true,
      default: ''
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index: efficiently fetch all unread notifications for a role, newest first
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });
// Index for submission-level notification queries
notificationSchema.index({ submissionId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
