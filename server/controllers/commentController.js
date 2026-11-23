const mongoose = require('mongoose');
const { Comment, Submission } = require('../models');
const { emitToRoles } = require('../services/notificationService');

/**
 * @route   POST /api/comments/:submissionId
 * @desc    Add a top-level comment or a threaded reply to an existing comment
 * @access  Public (demo role-gated on frontend)
 */
const addComment = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { authorId, authorRole, text, parentId } = req.body;

    // 1. Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${submissionId}'` }
      });
    }

    // 2. Validate required fields
    if (!authorId || !authorId.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'authorId is required' }
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment text is required' }
      });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment must not exceed 2000 characters' }
      });
    }

    // 3. Verify the submission exists
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: `Submission not found with ID: '${submissionId}'` }
      });
    }

    // 4. If this is a reply, verify the parent comment exists and belongs to this submission
    let resolvedParentId = null;
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid parentId format: '${parentId}'` }
        });
      }
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: { message: `Parent comment not found with ID: '${parentId}'` }
        });
      }
      if (parentComment.submissionId.toString() !== submissionId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Parent comment does not belong to this submission' }
        });
      }
      // Flatten threading to one level: if parent is itself a reply, attach to its top-level parent
      resolvedParentId = parentComment.parentId
        ? parentComment.parentId
        : parentComment._id;
    }

    // 5. Create the comment
    const validRoles = ['Brand Manager', 'Employee', 'Reviewer'];
    const comment = await Comment.create({
      submissionId,
      authorId: authorId.trim(),
      authorRole: validRoles.includes(authorRole) ? authorRole : 'Employee',
      text: text.trim(),
      parentId: resolvedParentId
    });

    // 6. Emit notification to all roles except the commenter's own role (non-critical)
    const notificationType = resolvedParentId ? 'reply_added' : 'comment_added';
    const notificationTitle = resolvedParentId
      ? `New Reply on Submission`
      : `New Comment on Submission`;
    const contentPreview = submission.content
      ? submission.content.slice(0, 40) + (submission.content.length > 40 ? '…' : '')
      : 'submission';
    const notificationMessage = resolvedParentId
      ? `${authorId.trim()} replied to a comment on "${contentPreview}"`
      : `${authorId.trim()} commented: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? '…' : ''}"`;

    const recipientRoles = ['Brand Manager', 'Employee', 'Reviewer'].filter(
      (r) => r !== (validRoles.includes(authorRole) ? authorRole : 'Employee')
    );

    await emitToRoles(recipientRoles, {
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      submissionId: submission._id,
      actorId: authorId.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: { message: 'Validation Error', details: messages }
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/comments/:submissionId
 * @desc    Retrieve all comments and replies for a submission, sorted oldest first.
 *          Returns a flat list; frontend builds the threaded tree using parentId.
 * @access  Public
 */
const getComments = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${submissionId}'` }
      });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: `Submission not found with ID: '${submissionId}'` }
      });
    }

    const comments = await Comment.find({ submissionId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      submissionId,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment by ID (demo: no ownership check; frontend gating only)
 * @access  Public
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid comment ID format: '${commentId}'` }
      });
    }

    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { message: `Comment not found with ID: '${commentId}'` }
      });
    }

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentId: commentId });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: { id: commentId }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, deleteComment };
