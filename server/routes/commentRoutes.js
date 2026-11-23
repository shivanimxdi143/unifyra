const express = require('express');
const router = express.Router();
const { addComment, getComments, deleteComment } = require('../controllers/commentController');

// GET /api/comments/:submissionId - retrieve all comments and replies for a submission
router.get('/:submissionId', getComments);

// POST /api/comments/:submissionId - add a top-level comment or reply to a submission
router.post('/:submissionId', addComment);

// DELETE /api/comments/:commentId - delete a comment and its replies
router.delete('/comment/:commentId', deleteComment);

module.exports = router;
