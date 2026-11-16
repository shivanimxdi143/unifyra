const mongoose = require('mongoose');
const { Submission, Finding } = require('../models');

/**
 * @route   POST /api/submissions
 * @desc    Submit content for brand governance checking
 * @access  Public
 */
const createSubmission = async (req, res, next) => {
  try {
    const { submittedBy, content, contentType } = req.body;

    // Validate required fields
    if (!submittedBy || !submittedBy.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'submittedBy is required' }
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Submission content is required' }
      });
    }

    const submissionData = {
      submittedBy: submittedBy.trim(),
      content: content.trim(),
      status: 'pending'
    };

    if (contentType) {
      submissionData.contentType = contentType.trim().toLowerCase();
    }

    const submission = await Submission.create(submissionData);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission
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
 * @route   GET /api/submissions
 * @desc    Get all submissions ordered by newest first, with optional filters (status, submittedBy, contentType)
 * @access  Public
 */
const getSubmissions = async (req, res, next) => {
  try {
    const { status, submittedBy, contentType } = req.query;
    const filter = {};

    if (status && status.trim()) {
      filter.status = status.trim().toLowerCase();
    }

    if (submittedBy && submittedBy.trim()) {
      filter.submittedBy = new RegExp(`^${submittedBy.trim()}$`, 'i');
    }

    if (contentType && contentType.trim()) {
      filter.contentType = contentType.trim().toLowerCase();
    }

    const submissions = await Submission.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/submissions/:id
 * @desc    Get one submission by ID with its associated Finding documents
 * @access  Public
 */
const getSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${id}'` }
      });
    }

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: `Submission not found with ID: '${id}'` }
      });
    }

    // Retrieve associated findings for this submission
    const findings = await Finding.find({ submissionId: id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...submission.toObject(),
        findings: findings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/submissions/user/:userId
 * @desc    Get submissions for a specific employee, newest first
 * @access  Public
 */
const getSubmissionsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !userId.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId parameter is required' }
      });
    }

    const submissions = await Submission.find({
      submittedBy: new RegExp(`^${userId.trim()}$`, 'i')
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/submissions/:id
 * @desc    Update submission content / resubmit for brand checking (resets status to pending, clears old findings)
 * @access  Public
 */
const resubmitContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, contentType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${id}'` }
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Updated content is required' }
      });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: `Submission not found with ID: '${id}'` }
      });
    }

    // Update content and reset status to pending
    submission.content = content.trim();
    if (contentType) {
      submission.contentType = contentType.trim().toLowerCase();
    }
    submission.status = 'pending';
    await submission.save();

    // Clear old findings to prevent duplicates upon re-analysis (review history in Review collection is retained)
    await Finding.deleteMany({ submissionId: submission._id });

    res.status(200).json({
      success: true,
      message: 'Submission updated and reset to pending for re-analysis',
      data: submission
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

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionsByUser,
  resubmitContent
};
