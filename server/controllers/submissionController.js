const mongoose = require('mongoose');
const { Submission, Finding, Guideline } = require('../models');
const { analyzeContentWithGemini } = require('../services/geminiService');
const mediaStore = require('../services/mediaStore');

/**
 * @route   POST /api/submissions
 * @desc    Submit content for brand governance checking
 * @access  Public
 */
const createSubmission = async (req, res, next) => {
  try {
    const { submittedBy, content, contentType } = req.body;
    const hasImage = Boolean(req.file);

    // Validate required fields
    if (!submittedBy || !submittedBy.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'submittedBy is required' }
      });
    }

    if (!hasImage && (!content || !content.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Submission content or an attached creative image is required' }
      });
    }

    const submissionData = {
      submittedBy: submittedBy.trim(),
      content: (content && content.trim()) ? content.trim() : (hasImage ? '[Attached Marketing Creative]' : ''),
      status: 'pending'
    };

    if (contentType) {
      submissionData.contentType = contentType.trim().toLowerCase();
    }

    if (hasImage) {
      submissionData.image = {
        hasImage: true,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };
    }

    const submission = await Submission.create(submissionData);

    // Cache image in memory store for demo analysis and preview
    if (hasImage) {
      mediaStore.set(submission._id.toString(), {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      });
    }

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

    // Enrich submissions with attached findings and compute complianceScore if needed
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
        if (s.status === 'pending') {
          score = null;
        } else {
          let penalty = 0;
          subFindings.forEach(f => {
            if (f.severity === 'critical') penalty += 24;
            else if (f.severity === 'high') penalty += 14;
            else if (f.severity === 'medium') penalty += 8;
            else penalty += 4;
          });
          score = Math.max(25, Math.min(100, 100 - penalty));
        }
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

    let score = submission.complianceScore;
    if (score === null || score === undefined) {
      if (submission.status === 'pending') {
        score = null;
      } else {
        let penalty = 0;
        findings.forEach(f => {
          if (f.severity === 'critical') penalty += 24;
          else if (f.severity === 'high') penalty += 14;
          else if (f.severity === 'medium') penalty += 8;
          else penalty += 4;
        });
        score = Math.max(25, Math.min(100, 100 - penalty));
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...submission.toObject(),
        complianceScore: score,
        findingsCount: findings.length,
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
        if (s.status === 'pending') {
          score = null;
        } else {
          let penalty = 0;
          subFindings.forEach(f => {
            if (f.severity === 'critical') penalty += 24;
            else if (f.severity === 'high') penalty += 14;
            else if (f.severity === 'medium') penalty += 8;
            else penalty += 4;
          });
          score = Math.max(25, Math.min(100, 100 - penalty));
        }
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

    // Update content
    if (content && content.trim()) {
      submission.content = content.trim();
    }
    if (contentType) {
      submission.contentType = contentType.trim().toLowerCase();
    }

    // Update image if a new creative was uploaded during resubmission
    if (req.file) {
      submission.image = {
        hasImage: true,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };
      mediaStore.set(submission._id.toString(), {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      });
    }

    // Clear old findings to prevent duplicates upon re-analysis (review history in Review collection is retained)
    await Finding.deleteMany({ submissionId: submission._id });

    // Fetch applicable guidelines to perform AI brand compliance analysis on revised content
    const guidelines = await Guideline.find({});
    let savedFindings = [];
    let calculatedScore = 100;

    if (guidelines && guidelines.length > 0) {
      try {
        const cachedImage = mediaStore.get(submission._id.toString());
        const validatedFindings = await analyzeContentWithGemini({
          content: submission.content,
          contentType: submission.contentType,
          guidelines,
          image: cachedImage
        });

        if (validatedFindings.length > 0) {
          const findingsToInsert = validatedFindings.map(f => ({
            submissionId: submission._id,
            ruleId: f.ruleId || null,
            severity: f.severity,
            offendingText: f.offendingText,
            explanation: f.explanation,
            suggestedCorrection: f.suggestedCorrection || '',
            visualArea: f.visualArea || null
          }));
          savedFindings = await Finding.insertMany(findingsToInsert);
        }

        // Compute deterministic compliance score
        let penalty = 0;
        savedFindings.forEach(f => {
          if (f.severity === 'critical') penalty += 24;
          else if (f.severity === 'high') penalty += 14;
          else if (f.severity === 'medium') penalty += 8;
          else penalty += 4;
        });
        calculatedScore = Math.max(25, Math.min(100, 100 - penalty));

        // After successful AI analysis, set status to 'analyzed' so reviewer can take action
        submission.status = 'analyzed';
        submission.complianceScore = calculatedScore;
      } catch (aiErr) {
        // Fall back to pending if AI analysis fails temporarily
        submission.status = 'pending';
        submission.complianceScore = null;
      }
    } else {
      submission.status = 'pending';
      submission.complianceScore = null;
    }

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission revised and analyzed successfully',
      data: {
        ...submission.toObject(),
        findings: savedFindings
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
 * @route   GET /api/submissions/:id/image
 * @desc    Serve uploaded image creative preview from temporary demo store
 * @access  Public
 */
const getSubmissionImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${id}'` }
      });
    }

    const cached = mediaStore.get(id);
    if (cached && cached.buffer) {
      res.set('Content-Type', cached.mimeType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(cached.buffer);
    }

    // Check if MongoDB is connected before querying
    if (mongoose.connection.readyState === 1) {
      const submission = await Submission.findById(id);
      if (!submission || !submission.image || !submission.image.hasImage) {
        return res.status(404).json({
          success: false,
          error: { message: `No image creative found for submission ID '${id}'` }
        });
      }
    }

    // Metadata exists but buffer expired from memory store
    return res.status(404).json({
      success: false,
      error: {
        message: 'Image preview is no longer in temporary memory cache. Persistent cloud storage (e.g., S3) is required for long-term archiving.',
        code: 'IMAGE_CACHE_EXPIRED'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionsByUser,
  resubmitContent,
  getSubmissionImage
};
