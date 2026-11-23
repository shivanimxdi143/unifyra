const { Notification } = require('../models');

/**
 * @module notificationService
 * @description Non-critical helper that emits governance event notifications.
 * Errors in notification creation are caught and logged but never propagate
 * to the caller — notifications must never disrupt the main request lifecycle.
 */

/**
 * Emit one notification record to the database.
 *
 * @param {Object} opts
 * @param {string} opts.type           - Notification type enum value
 * @param {string} opts.recipientRole  - Target demo role ('Brand Manager' | 'Employee' | 'Reviewer')
 * @param {string} opts.title          - Short notification title
 * @param {string} opts.message        - Descriptive message body
 * @param {string|null} [opts.submissionId] - ObjectId string of the related submission
 * @param {string} [opts.actorId]      - Identifier of the person who triggered the event
 */
async function emitNotification({ type, recipientRole, title, message, submissionId = null, actorId = '' }) {
  try {
    await Notification.create({
      type,
      recipientRole,
      title,
      message,
      submissionId: submissionId || null,
      actorId: actorId || ''
    });
  } catch (err) {
    // Non-fatal: log and continue — notification failure must not break business logic
    console.error(`[NotificationService] Failed to emit "${type}" notification to "${recipientRole}":`, err.message);
  }
}

/**
 * Emit the same notification to multiple recipient roles at once.
 *
 * @param {string[]} roles   - Array of recipient roles
 * @param {Object}   payload - Same opts as emitNotification (without recipientRole)
 */
async function emitToRoles(roles, payload) {
  await Promise.all(roles.map((role) => emitNotification({ ...payload, recipientRole: role })));
}

module.exports = { emitNotification, emitToRoles };
