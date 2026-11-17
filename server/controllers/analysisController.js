const mongoose = require('mongoose');
const { Submission, Guideline, Finding } = require('../models');
const { analyzeContentWithGemini } = require('../services/geminiService');

/**
 * @route   POST /api/analysis/:submissionId
 * @desc    Run Gemini-powered brand compliance analysis on a submission
 * @access  Public
 */
const analyzeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    // 1. Validate submissionId format
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid submission ID format: '${submissionId}'` }
      });
    }

    // 2. Fetch the submission from MongoDB
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: `Submission not found with ID: '${submissionId}'` }
      });
    }

    // 3. Fetch applicable brand guidelines
    const guidelines = await Guideline.find({});
    if (!guidelines || guidelines.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No brand guidelines found in the system. Create at least one guideline before running compliance analysis.'
        }
      });
    }

    // 4. Perform Gemini AI brand analysis
    let validatedFindings = [];
    try {
      validatedFindings = await analyzeContentWithGemini({
        content: submission.content,
        contentType: submission.contentType,
        guidelines: guidelines
      });
    } catch (aiError) {
      return res.status(502).json({
        success: false,
        error: {
          message: `AI Analysis service failure: ${aiError.message}`
        }
      });
    }

    // 5. Clean up any existing findings for this submission (for idempotency on re-analysis)
    await Finding.deleteMany({ submissionId: submission._id });

    // 6. Save new findings to database using Finding model
    let savedFindings = [];
    if (validatedFindings.length > 0) {
      const findingsToInsert = validatedFindings.map(f => ({
        submissionId: submission._id,
        ruleId: f.ruleId || null,
        severity: f.severity,
        offendingText: f.offendingText,
        explanation: f.explanation,
        suggestedCorrection: f.suggestedCorrection || ''
      }));

      savedFindings = await Finding.insertMany(findingsToInsert);
    }

    // 7. Update submission status to 'analyzed' (never auto-approve)
    submission.status = 'analyzed';
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission analyzed successfully',
      data: {
        submissionId: submission._id,
        status: submission.status,
        findingsCount: savedFindings.length,
        findings: savedFindings
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeSubmission
};
