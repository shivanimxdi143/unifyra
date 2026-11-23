const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');

// GET /api/notifications?recipientRole=Reviewer&unreadOnly=true&limit=20
router.get('/', getNotifications);

// PATCH /api/notifications/mark-all-read - mark all as read for a role (must be before /:id/read)
router.patch('/mark-all-read', markAllRead);

// PATCH /api/notifications/:id/read - mark a single notification as read
router.patch('/:id/read', markRead);

module.exports = router;
