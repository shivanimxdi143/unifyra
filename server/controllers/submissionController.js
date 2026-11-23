const mongoose = require('mongoose');
const { Submission, Finding, Guideline } = require('../models');
const { analyzeContentWithGemini } = require('../services/geminiService');
const { extractDocumentText } = require('../services/documentExtractor');
const mediaStore = require('../services/mediaStore');
const { emitToRoles } = require('../services/notificationService');

/**
 * @route   POST /api/submissions
 * @desc    Submit content for brand governance checking (supports copy, images, and PDF/DOCX documents)
 * @access  Public
 */
const createSubmission = async (req, res, next) => {
  try {
    const { submittedBy, content, contentType } = req.body;
    const hasImage = Boolean(req.file);
    const hasDocument = Boolean(req.documentFile);

    // Validate required submitter identifier
    if (!submittedBy || !submittedBy.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'submittedBy is required' }
      });
    }

    let extractedText = '';
    let docMetadata = null;

    // Handle document upload and text extraction if document file is attached
    if (hasDocument) {
      const extractResult = await extractDocumentText({
        buffer: req.documentFile.buffer,
        originalName: req.documentFile.originalname,
        mimeType: req.documentFile.mimetype
      });

      if (!extractResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: extractResult.error,
            code: extractResult.code || 'DOCUMENT_EXTRACTION_FAILED'
          }
        });
      }

      extractedText = extractResult.text || '';
      docMetadata = {
        hasDocument: true,
        originalName: req.documentFile.originalname,
        mimeType: req.documentFile.mimetype,
        size: req.documentFile.size,
        fileFormat: extractResult.format,
        wordCount: extractResult.wordCount,
        characterCount: extractResult.characterCount,
        pageCount: extractResult.pageCount,
        uploadedAt: new Date()
      };
    }

    // Determine final content: explicit content overrides extracted text; otherwise use extracted text or placeholder
    const finalContent = (content && content.trim())
      ? content.trim()
      : (extractedText ? extractedText : (hasImage ? '[Attached Marketing Creative]' : ''));

    // Validate that at least one form of content is provided
    if (!hasImage && !hasDocument && !finalContent) {
      return res.status(400).json({
        success: false,
        error: { message: 'Submission content, an attached document, or an image creative is required' }
      });
    }

    const submissionData = {
      submittedBy: submittedBy.trim(),
      content: finalContent,
      status: 'pending'
    };

    if (contentType) {
      submissionData.contentType = contentType.trim().toLowerCase();
    } else if (hasDocument) {
      submissionData.contentType = 'document';
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

    if (hasDocument && docMetadata) {
      submissionData.document = docMetadata;
    }

    let submission;
    if (mongoose.connection.readyState === 1) {
      submission = await Submission.create(submissionData);
    } else {
      // Offline / testing fallback: instantiate validated model when MongoDB is not connected
      submission = new Submission(submissionData);
      submission._id = new mongoose.Types.ObjectId();
    }

    // Cache image in memory store for demo analysis and preview
    if (hasImage) {
      mediaStore.set(submission._id.toString(), {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      });
    }

    // Cache document in memory store for demo preview and download
    if (hasDocument) {
      mediaStore.setDocument(submission._id.toString(), {
        buffer: req.documentFile.buffer,
        mimeType: req.documentFile.mimetype,
        originalName: req.documentFile.originalname,
        fileFormat: docMetadata.fileFormat,
        size: req.documentFile.size
      });
    }

    // Notify Reviewer and Brand Manager that a new submission is awaiting review (non-critical)
    const newSubPreview = finalContent
      ? finalContent.slice(0, 50) + (finalContent.length > 50 ? '\u2026' : '')
      : (hasDocument ? 'Attached document' : 'Marketing creative');
    await emitToRoles(['Reviewer', 'Brand Manager'], {
      type: 'submission_received',
      title: 'New Submission Awaiting Review',
      message: `${submittedBy.trim()} submitted \u201c${newSubPreview}\u201d for brand compliance review`,
      submissionId: submission._id,
      actorId: submittedBy.trim()
    });

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
    const hasImage = Boolean(req.file);
    const hasDocument = Boolean(req.documentFile);

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

    let extractedText = '';
    if (hasDocument) {
      const extractResult = await extractDocumentText({
        buffer: req.documentFile.buffer,
        originalName: req.documentFile.originalname,
        mimeType: req.documentFile.mimetype
      });

      if (!extractResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: extractResult.error,
            code: extractResult.code || 'DOCUMENT_EXTRACTION_FAILED'
          }
        });
      }

      extractedText = extractResult.text || '';
      submission.document = {
        hasDocument: true,
        originalName: req.documentFile.originalname,
        mimeType: req.documentFile.mimetype,
        size: req.documentFile.size,
        fileFormat: extractResult.format,
        wordCount: extractResult.wordCount,
        characterCount: extractResult.characterCount,
        pageCount: extractResult.pageCount,
        uploadedAt: new Date()
      };

      mediaStore.setDocument(submission._id.toString(), {
        buffer: req.documentFile.buffer,
        mimeType: req.documentFile.mimetype,
        originalName: req.documentFile.originalname,
        fileFormat: extractResult.format,
        size: req.documentFile.size
      });
    }

    // Determine updated text
    if (content && content.trim()) {
      submission.content = content.trim();
    } else if (extractedText) {
      submission.content = extractedText;
    }

    if (contentType) {
      submission.contentType = contentType.trim().toLowerCase();
    } else if (hasDocument && !submission.contentType) {
      submission.contentType = 'document';
    }

    // Update image if a new creative was uploaded during resubmission
    if (hasImage) {
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

    // Notify Reviewer and Brand Manager that a revised submission is awaiting re-review (non-critical)
    const resubPreview = submission.content
      ? submission.content.slice(0, 50) + (submission.content.length > 50 ? '\u2026' : '')
      : 'Revised content';
    await emitToRoles(['Reviewer', 'Brand Manager'], {
      type: 'resubmission_received',
      title: 'Revised Submission Awaiting Review',
      message: `${submission.submittedBy || 'Submitter'} resubmitted \u201c${resubPreview}\u201d after revisions`,
      submissionId: submission._id,
      actorId: submission.submittedBy || ''
    });

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

/**
 * @route   GET /api/submissions/:id/document
 * @desc    Serve uploaded document (PDF/DOCX) from temporary demo store for download or viewing
 * @access  Public
 */
const getSubmissionDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${id}'` }
      });
    }

    const cached = mediaStore.getDocument(id);
    if (cached && cached.buffer) {
      const mime = cached.mimeType || 'application/pdf';
      res.set('Content-Type', mime);
      res.set('Content-Disposition', `inline; filename="${encodeURIComponent(cached.originalName || 'document.pdf')}"`);
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(cached.buffer);
    }

    // Check if MongoDB is connected before querying
    if (mongoose.connection.readyState === 1) {
      const submission = await Submission.findById(id);
      if (!submission || !submission.document || !submission.document.hasDocument) {
        return res.status(404).json({
          success: false,
          error: { message: `No document attachment found for submission ID '${id}'` }
        });
      }
    }

    // Metadata exists in database but buffer expired from memory store
    return res.status(404).json({
      success: false,
      error: {
        message: 'Document file is no longer in temporary memory cache. Persistent cloud storage (e.g., S3) is required for long-term archiving.',
        code: 'DOCUMENT_CACHE_EXPIRED'
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
  getSubmissionImage,
  getSubmissionDocument
};
