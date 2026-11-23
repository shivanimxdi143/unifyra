const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Submission, Comment, Notification } = require('../models');
const app = require('../app');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('   TESTING ROUND 3: COLLABORATION & NOTIFICATIONS              ');
  console.log('===============================================================');

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unifyra_test';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB for live database tests');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------------------
    // 1. Comments API Validation
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Comments CRUD & Threading ---');

    // Create a dummy submission
    const sub = await Submission.create({
      submittedBy: 'Employee',
      contentType: 'social_post',
      channel: 'Instagram',
      content: 'Collaboration Test Content',
      status: 'pending'
    });

    // 1A. Add top-level comment
    const commentRes = await fetch(`${baseUrl}/api/comments/${sub._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: 'Reviewer',
        authorRole: 'Reviewer',
        text: 'Please check brand tone in paragraph 1.'
      })
    });
    assert(commentRes.status === 201, 'POST /api/comments/:id returns 201');
    const commentData = await commentRes.json();
    assert(commentData.success === true, 'Top-level comment created successfully');
    assert(commentData.data.text === 'Please check brand tone in paragraph 1.', 'Comment text preserved');
    const parentCommentId = commentData.data._id;

    // 1B. Add threaded reply
    const replyRes = await fetch(`${baseUrl}/api/comments/${sub._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: 'Employee',
        authorRole: 'Employee',
        text: 'Updated paragraph 1 to comply.',
        parentId: parentCommentId
      })
    });
    assert(replyRes.status === 201, 'POST reply to comment returns 201');
    const replyData = await replyRes.json();
    assert(replyData.data.parentId === parentCommentId, 'Reply parentId linked properly');

    // 1C. Get all comments
    const getCommentsRes = await fetch(`${baseUrl}/api/comments/${sub._id}`);
    assert(getCommentsRes.status === 200, 'GET /api/comments/:id returns 200');
    const getCommentsData = await getCommentsRes.json();
    assert(getCommentsData.count === 2, 'Fetched all 2 comments for submission');

    // -------------------------------------------------------------------------
    // 2. Notifications API & Routing
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Notifications Feed & Read Status ---');

    // 2A. Get notifications for Reviewer
    const notifsRes = await fetch(`${baseUrl}/api/notifications?recipientRole=Reviewer`);
    assert(notifsRes.status === 200, 'GET /api/notifications returns 200 for Reviewer');
    const notifsData = await notifsRes.json();
    assert(Array.isArray(notifsData.data), 'Notifications returned as array');
    assert(typeof notifsData.unreadCount === 'number', 'Unread count provided in response');

    // Check we have notifications
    const targetNotif = notifsData.data[0];
    if (targetNotif) {
      // 2B. Mark single notification read with wrong role -> 404
      const wrongRoleRes = await fetch(`${baseUrl}/api/notifications/${targetNotif._id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientRole: 'Employee' }) // wrong role
      });
      assert(wrongRoleRes.status === 404, 'PATCH /notifications/:id/read with mismatched role returns 404');

      // 2C. Mark single notification read with correct role -> 200
      const correctRoleRes = await fetch(`${baseUrl}/api/notifications/${targetNotif._id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientRole: 'Reviewer' })
      });
      assert(correctRoleRes.status === 200, 'PATCH /notifications/:id/read with correct role returns 200');
      const updatedNotif = await correctRoleRes.json();
      assert(updatedNotif.data.read === true, 'Notification read flag is true');
    }

    // 2D. Mark all read for Reviewer
    const markAllRes = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientRole: 'Reviewer' })
    });
    assert(markAllRes.status === 200, 'PATCH /notifications/mark-all-read returns 200');

    // 2E. Verify unread count is 0
    const recheckNotifs = await fetch(`${baseUrl}/api/notifications?recipientRole=Reviewer&unreadOnly=true`);
    const recheckData = await recheckNotifs.json();
    assert(recheckData.unreadCount === 0, 'Unread count becomes 0 after mark-all-read');

    // -------------------------------------------------------------------------
    // 3. Cascade Deletion of Comments
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Comment Cascade Deletion ---');
    const deleteRes = await fetch(`${baseUrl}/api/comments/comment/${parentCommentId}`, {
      method: 'DELETE'
    });
    assert(deleteRes.status === 200, 'DELETE /api/comments/comment/:id returns 200');

    const verifyDelete = await fetch(`${baseUrl}/api/comments/${sub._id}`);
    const verifyDeleteData = await verifyDelete.json();
    assert(verifyDeleteData.count === 0, 'Parent and all child replies deleted cascade');

    // Cleanup
    await Submission.findByIdAndDelete(sub._id);
    await Notification.deleteMany({ submissionId: sub._id });

    console.log('\n===============================================================');
    console.log(`   COLLABORATION TESTS COMPLETE: ${passed} passed, ${failed} failed`);
    console.log('===============================================================');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
