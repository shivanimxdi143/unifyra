const mongoose = require('mongoose');
const { Notification } = require('../models');

const VALID_ROLES = ['Brand Manager', 'Employee', 'Reviewer'];

/**
 * @route   GET /api/notifications
 * @desc    Retrieve notifications for a given demo role, newest first.
 *          Query params:
 *            - recipientRole  (required) : 'Brand Manager' | 'Employee' | 'Reviewer'
 *            - unreadOnly     (optional) : 'true' to filter to unread only
 *            - limit          (optional) : integer, max 50, default 20
 * @access  Public
 */
const getNotifications = async (req, res, next) => {
  try {
    const { recipientRole, unreadOnly, limit } = req.query;

    if (!recipientRole || !VALID_ROLES.includes(recipientRole)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `recipientRole query param is required and must be one of: ${VALID_ROLES.join(', ')}`
        }
      });
    }

    const filter = { recipientRole };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 50);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    const unreadCount = await Notification.countDocuments({
      recipientRole,
      read: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Public
 */
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipientRole } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid notification ID format: '${id}'` }
      });
    }

    if (!recipientRole || !VALID_ROLES.includes(recipientRole)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `recipientRole is required and must be one of: ${VALID_ROLES.join(', ')}`
        }
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientRole },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { message: `Notification not found with ID: '${id}' for role '${recipientRole}'` }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications for a role as read.
 *          Body: { recipientRole: 'Reviewer' }
 * @access  Public
 */
const markAllRead = async (req, res, next) => {
  try {
    const { recipientRole } = req.body;

    if (!recipientRole || !VALID_ROLES.includes(recipientRole)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `recipientRole is required and must be one of: ${VALID_ROLES.join(', ')}`
        }
      });
    }

    const result = await Notification.updateMany(
      { recipientRole, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notification(s) as read for role "${recipientRole}"`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
