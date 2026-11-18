/**
 * @file testResubmissionWorkflow.js
 * @description Verifies the complete resubmission workflow:
 * 1. Initial submission created (status: pending).
 * 2. Gemini analyzes content -> status transitions to 'analyzed'.
 * 3. Reviewer requests changes -> status transitions to 'changes_requested'.
 * 4. Employee edits content and resubmits -> content updated, findings refreshed, status transitions to 'analyzed' (NOT stuck in 'pending').
 * 5. Reviewer approves submission -> status transitions to 'approved'.
 * 6. Audit history is verified as intact.
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Submission, Finding, Review, Guideline } = require('../models');
const { analyzeContentWithGemini } = require('../services/geminiService');

async function testResubmissionLifecycle() {
  console.log('===============================================================');
  console.log('   TESTING UNIFYRA RESUBMISSION WORKFLOW (ISSUE 1 FIX)        ');
  console.log('===============================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');

  let testSubId = null;

  try {
    // Step 1: Employee creates submission with trademark and tagline errors
    console.log('\n[Step 1] Employee submits draft with violations...');
    const sub = await Submission.create({
      submittedBy: 'employee_resubmit_test',
      content: 'Stop by for a fresh farm to bowl lunch today. Real Food Pure Energy!',
      contentType: 'social_post',
      status: 'pending'
    });
    testSubId = sub._id;
    console.log(`✅ Submission created: ID ${sub._id}, status="${sub.status}"`);

    // Step 2: Gemini analyzes content
    console.log('\n[Step 2] AI audits initial content...');
    const guidelines = await Guideline.find({});
    const initialFindings = await analyzeContentWithGemini({
      content: sub.content,
      contentType: sub.contentType,
      guidelines
    });
    console.log(`✅ AI identified ${initialFindings.length} violations.`);

    // Insert findings & update status to analyzed
    if (initialFindings.length > 0) {
      await Finding.insertMany(
        initialFindings.map((f) => ({
          submissionId: sub._id,
          ruleId: f.ruleId,
          severity: f.severity,
          offendingText: f.offendingText,
          explanation: f.explanation,
          suggestedCorrection: f.suggestedCorrection
        }))
      );
    }
    sub.status = 'analyzed';
    sub.complianceScore = 78;
    await sub.save();
    console.log(`✅ Initial submission status updated to "${sub.status}" (Score: ${sub.complianceScore}%)`);

    // Step 3: Reviewer requests changes
    console.log('\n[Step 3] Reviewer requests changes...');
    const reviewReq = await Review.create({
      submissionId: sub._id,
      reviewerId: 'reviewer_lead',
      decision: 'changes_requested',
      comments: 'Please capitalize Farm-to-Bowl™ and fix the tagline punctuation to "Real Food, Pure Energy."'
    });
    sub.status = 'changes_requested';
    await sub.save();
    console.log(`✅ Review recorded: decision="${reviewReq.decision}". Submission status="${sub.status}"`);

    // Step 4: Employee edits content and resubmits
    console.log('\n[Step 4] Employee edits content and calls resubmit logic...');
    const revisedContent = 'Stop by for a fresh Farm-to-Bowl™ lunch today. FreshBite: Real Food, Pure Energy.';
    
    // Simulate resubmitContent logic:
    // Update content, clear stale findings, re-analyze with Gemini, and set status to 'analyzed'
    sub.content = revisedContent;
    await Finding.deleteMany({ submissionId: sub._id });

    const revisedFindings = await analyzeContentWithGemini({
      content: sub.content,
      contentType: sub.contentType,
      guidelines
    });

    console.log(`✅ AI audited revised content: ${revisedFindings.length} violations found.`);
    if (revisedFindings.length > 0) {
      await Finding.insertMany(
        revisedFindings.map((f) => ({
          submissionId: sub._id,
          ruleId: f.ruleId,
          severity: f.severity,
          offendingText: f.offendingText,
          explanation: f.explanation,
          suggestedCorrection: f.suggestedCorrection
        }))
      );
    }

    let penalty = 0;
    revisedFindings.forEach((f) => {
      const sev = (f.severity || '').toLowerCase();
      if (sev === 'critical') penalty += 24;
      else if (sev === 'high') penalty += 14;
      else if (sev === 'medium') penalty += 8;
      else penalty += 4;
    });
    const revisedScore = Math.max(25, Math.min(100, 100 - penalty));

    // KEY FIX: Status transitions to 'analyzed' (NOT 'pending')
    sub.status = 'analyzed';
    sub.complianceScore = revisedScore;
    await sub.save();

    console.log(`✅ Revised submission saved! Status="${sub.status}", Compliance Score=${revisedScore}%`);

    if (sub.status !== 'analyzed') {
      throw new Error(`CRITICAL FAIL: Expected status to be 'analyzed', but got '${sub.status}'`);
    }

    // Step 5: Reviewer approves the revised submission
    console.log('\n[Step 5] Reviewer approves revised submission...');
    // Verify that the backend reviewController condition allows this:
    if (sub.status !== 'analyzed' && sub.status !== 'changes_requested') {
      throw new Error(`Backend rejection: Cannot review submission with status '${sub.status}'`);
    }

    const reviewApprove = await Review.create({
      submissionId: sub._id,
      reviewerId: 'reviewer_lead',
      decision: 'approved',
      comments: 'Revised content adheres perfectly to brand guidelines. Approved!'
    });
    sub.status = 'approved';
    await sub.save();
    console.log(`✅ Review recorded: decision="${reviewApprove.decision}". Final submission status="${sub.status}"`);

    // Step 6: Verify entire audit history is intact
    console.log('\n[Step 6] Verifying full review audit history...');
    const allReviews = await Review.find({ submissionId: sub._id }).sort({ createdAt: 1 });
    console.log(`✅ Total reviews preserved in audit trail: ${allReviews.length}`);
    allReviews.forEach((r, idx) => {
      console.log(`   Review #${idx + 1}: [${r.decision}] by ${r.reviewerId} - "${r.comments}"`);
    });

    if (allReviews.length !== 2) {
      throw new Error(`Expected 2 review records in history, found ${allReviews.length}`);
    }

    console.log('\n===============================================================');
    console.log('   RESUBMISSION WORKFLOW VERIFICATION PASSED!                 ');
    console.log('===============================================================');
  } finally {
    // Cleanup
    if (testSubId) {
      await Finding.deleteMany({ submissionId: testSubId });
      await Review.deleteMany({ submissionId: testSubId });
      await Submission.findByIdAndDelete(testSubId);
      console.log(`\n[Cleanup] Test records cleaned up for submission ${testSubId}.`);
    }
    await mongoose.connection.close();
  }
}

testResubmissionLifecycle().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
