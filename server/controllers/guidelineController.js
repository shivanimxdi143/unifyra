const mongoose = require('mongoose');
const { Guideline } = require('../models');

/**
 * @route   POST /api/guidelines
 * @desc    Create a new brand guideline
 * @access  Public
 */
const createGuideline = async (req, res, next) => {
  try {
    const { brandName, title, category, description, rules, createdBy } = req.body;

    // Basic validation for required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title is required' }
      });
    }

    if (!createdBy || !createdBy.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'createdBy is required' }
      });
    }

    // Validate rules array structure if provided
    if (rules && !Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Rules must be an array of rule objects' }
      });
    }

    if (Array.isArray(rules)) {
      for (let i = 0; i < rules.length; i++) {
        if (!rules[i].ruleText || !rules[i].ruleText.trim()) {
          return res.status(400).json({
            success: false,
            error: { message: `Rule at index ${i} must have non-empty ruleText` }
          });
        }
      }
    }

    const guideline = await Guideline.create({
      brandName: brandName ? brandName.trim() : undefined,
      title: title.trim(),
      category: category ? category.trim() : undefined,
      description: description ? description.trim() : '',
      rules: rules || [],
      createdBy: createdBy.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Guideline created successfully',
      data: guideline
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
 * @route   GET /api/guidelines
 * @desc    Get all brand guidelines, with optional filtering by brandName and category
 * @access  Public
 */
const getGuidelines = async (req, res, next) => {
  try {
    const { brandName, category } = req.query;
    const filter = {};

    if (brandName && brandName.trim()) {
      filter.brandName = new RegExp(`^${brandName.trim()}$`, 'i');
    }

    if (category && category.trim()) {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    const guidelines = await Guideline.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: guidelines.length,
      data: guidelines
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/guidelines/:id
 * @desc    Get a single brand guideline by ID
 * @access  Public
 */
const getGuidelineById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid guideline ID format: '${id}'` }
      });
    }

    const guideline = await Guideline.findById(id);

    if (!guideline) {
      return res.status(404).json({
        success: false,
        error: { message: `Guideline not found with ID: '${id}'` }
      });
    }

    res.status(200).json({
      success: true,
      data: guideline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/guidelines/:id
 * @desc    Update a brand guideline by ID
 * @access  Public
 */
const updateGuideline = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid guideline ID format: '${id}'` }
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Update payload cannot be empty' }
      });
    }

    // Validate rules array if updated
    if (req.body.rules !== undefined) {
      if (!Array.isArray(req.body.rules)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Rules must be an array of rule objects' }
        });
      }

      for (let i = 0; i < req.body.rules.length; i++) {
        if (!req.body.rules[i].ruleText || !req.body.rules[i].ruleText.trim()) {
          return res.status(400).json({
            success: false,
            error: { message: `Rule at index ${i} must have non-empty ruleText` }
          });
        }
      }
    }

    const updatedGuideline = await Guideline.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedGuideline) {
      return res.status(404).json({
        success: false,
        error: { message: `Guideline not found with ID: '${id}'` }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guideline updated successfully',
      data: updatedGuideline
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
 * @route   DELETE /api/guidelines/:id
 * @desc    Delete a brand guideline by ID
 * @access  Public
 */
const deleteGuideline = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid guideline ID format: '${id}'` }
      });
    }

    const guideline = await Guideline.findByIdAndDelete(id);

    if (!guideline) {
      return res.status(404).json({
        success: false,
        error: { message: `Guideline not found with ID: '${id}'` }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Guideline deleted successfully',
      data: { id: guideline._id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGuideline,
  getGuidelines,
  getGuidelineById,
  updateGuideline,
  deleteGuideline
};
