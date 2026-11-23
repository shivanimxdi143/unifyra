const mongoose = require('mongoose');
const { Review, Submission, Finding } = require('../models');
const { emitToRoles } = require('../services/notificationService');

const ALLOWED_DECISIONS = ['approved', 'rejected', 'changes_requested'];

/**
 * @route   POST /api/reviews/:submissionId
 * @desc    Submit a human review decision (approved, rejected, changes_requested) for an analyzed submission
 * @access  Public
 */
const createReview = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { reviewerId, decision, comments } = req.body;

    // 1. Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${submissionId}'` }
      });
    }

    // 2. Validate reviewer ID
    if (!reviewerId || !reviewerId.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'reviewerId is required' }
      });
    }

    // 3. Validate decision
    const normalizedDecision = decision ? decision.toLowerCase().trim() : '';
    if (!ALLOWED_DECISIONS.includes(normalizedDecision)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid decision: '${decision}'. Must be one of: ${ALLOWED_DECISIONS.join(', ')}`
        }
      });
    }

    // 4. Validate comments
    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Review comments are required' }
      });
    }

    // 5. Fetch submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: `Submission not found with ID: '${submissionId}'` }
      });
    }

    // 6. Enforce that only analyzed or changes_requested submissions can be reviewed
    if (submission.status !== 'analyzed' && submission.status !== 'changes_requested') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot review submission with status '${submission.status}'. Submissions must be 'analyzed' or 'changes_requested' before human review.`
        }
      });
    }

    // 7. Create review record in MongoDB
    const review = await Review.create({
      submissionId: submission._id,
      reviewerId: reviewerId.trim(),
      decision: normalizedDecision,
      comments: comments.trim()
    });

    // 8. Update submission status to match human decision
    submission.status = normalizedDecision;
    await submission.save();

    // 9. Emit governance notifications (non-critical: errors are swallowed in emitToRoles)
    const contentPreview = submission.content
      ? submission.content.slice(0, 40) + (submission.content.length > 40 ? '…' : '')
      : 'submission';

    if (normalizedDecision === 'approved') {
      await emitToRoles(['Employee', 'Brand Manager'], {
        type: 'approved',
        title: 'Content Approved',
        message: `${reviewerId.trim()} approved "${contentPreview}"`,
        submissionId: submission._id,
        actorId: reviewerId.trim()
      });
    } else if (normalizedDecision === 'rejected') {
      await emitToRoles(['Employee', 'Brand Manager'], {
        type: 'rejected',
        title: 'Content Rejected',
        message: `${reviewerId.trim()} rejected "${contentPreview}". Review the feedback and revise.`,
        submissionId: submission._id,
        actorId: reviewerId.trim()
      });
    } else if (normalizedDecision === 'changes_requested') {
      await emitToRoles(['Employee'], {
        type: 'changes_requested',
        title: 'Changes Requested',
        message: `${reviewerId.trim()} requested revisions on "${contentPreview}": ${comments.trim().slice(0, 80)}${comments.trim().length > 80 ? '…' : ''}`,
        submissionId: submission._id,
        actorId: reviewerId.trim()
      });
      await emitToRoles(['Brand Manager'], {
        type: 'changes_requested',
        title: 'Reviewer Requested Changes',
        message: `${reviewerId.trim()} requested changes on "${contentPreview}"`,
        submissionId: submission._id,
        actorId: reviewerId.trim()
      });
    }

    res.status(201).json({
      success: true,
      message: `Review recorded successfully with decision: ${normalizedDecision}`,
      data: {
        review,
        submission
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation Error',
          details: messages
        }
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/reviews/pending
 * @desc    Retrieve submissions currently awaiting human review (status: 'analyzed')
 * @access  Public
 */
const getPendingReviews = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ status: 'analyzed' }).sort({ updatedAt: -1 });

    // Enrich pending submissions with their finding counts
    const submissionIds = submissions.map(s => s._id);
    const findings = await Finding.find({ submissionId: { $in: submissionIds } });

    const findingsMap = {};
    findings.forEach(f => {
      const key = f.submissionId.toString();
      if (!findingsMap[key]) findingsMap[key] = [];
      findingsMap[key].push(f);
    });

    const enrichedSubmissions = submissions.map(s => {
      const subFindings = findingsMap[s._id.toString()] || [];
      let score = s.complianceScore;
      if (score === null || score === undefined) {
        let penalty = 0;
        subFindings.forEach(f => {
          if (f.severity === 'critical') penalty += 24;
          else if (f.severity === 'high') penalty += 14;
          else if (f.severity === 'medium') penalty += 8;
          else penalty += 4;
        });
        score = Math.max(25, Math.min(100, 100 - penalty));
      }
      return {
        ...s.toObject(),
        complianceScore: score,
        findingsCount: subFindings.length,
        findings: subFindings
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedSubmissions.length,
      data: enrichedSubmissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:submissionId
 * @desc    Retrieve complete review decision history for a submission
 * @access  Public
 */
const getReviewHistory = async (req, res, next) => {
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

    const reviews = await Review.find({ submissionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      submissionId: submission._id,
      currentStatus: submission.status,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getPendingReviews,
  getReviewHistory
};
