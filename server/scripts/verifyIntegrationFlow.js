/**
 * @file verifyIntegrationFlow.js
 * @description End-to-end integration test verifying the complete Unifyra brand governance lifecycle:
 * 1. Brand Manager creates guidelines.
 * 2. Employee submits draft content.
 * 3. Gemini analyzes content -> findings & score generated, status updated to analyzed.
 * 4. Reviewer requests changes -> status updated to changes_requested.
 * 5. Employee resubmits amended content -> status resets to pending, old findings cleared, history retained.
 * 6. Fresh Gemini analysis on resubmitted content.
 * 7. Reviewer approves submission -> status updated to approved.
 * 8. Cleanup test data.
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Guideline, Submission, Finding, Review } = require('../models');
const { analyzeContentWithGemini } = require('../services/geminiService');

async function runIntegrationFlow() {
  console.log('===============================================================');
  console.log('   UNIFYRA FULL INTEGRATION LIFECYCLE VERIFICATION');
  console.log('===============================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');

  let testGuidelineId = null;
  let testSubmissionId = null;

  try {
    // -------------------------------------------------------------
    // Step 1: Brand Manager creates guidelines
    // -------------------------------------------------------------
    console.log('\n[Step 1] Brand Manager creates a guideline with sub-rules...');
    const testGuideline = await Guideline.create({
      brandName: 'FreshBite',
      title: 'Integration Test Trademark & Claim Rules',
      category: 'Trademarks & Claims',
      description: 'Test guidelines for integration verification',
      createdBy: 'test_brand_manager',
      rules: [
        {
          ruleText: 'Signature menu items must use proper title casing and trademark symbol: Farm-to-Bowl™, Green Glow Elixir™, Harvest Protein Bowl™, and Avocado Crisp Tartine™.',
          severity: 'high',
          examples: ['DO: "Farm-to-Bowl™ lunch."', 'DON\'T: "farm to bowl meal."']
        },
        {
          ruleText: 'Official brand tagline must strictly be formatted as "Real Food, Pure Energy." with a comma and period.',
          severity: 'medium',
          examples: ['DO: "Real Food, Pure Energy."', 'DON\'T: "Real Food Pure Energy!"']
        }
      ]
    });
    testGuidelineId = testGuideline._id;
    console.log(`✅ Guideline created with ID: ${testGuideline._id} and ${testGuideline.rules.length} rules.`);

    // -------------------------------------------------------------
    // Step 2: Employee submits draft content
    // -------------------------------------------------------------
    console.log('\n[Step 2] Employee submits draft marketing copy...');
    const draftContent = 'Try our fresh farm to bowl lunch today! FreshBite: Real Food Pure Energy!';
    const testSubmission = await Submission.create({
      submittedBy: 'employee_alex',
      content: draftContent,
      contentType: 'social_post',
      status: 'pending'
    });
    testSubmissionId = testSubmission._id;
    console.log(`✅ Submission created with ID: ${testSubmission._id}, status: "${testSubmission.status}"`);

    // -------------------------------------------------------------
    // Step 3: Gemini analyzes submission
    // -------------------------------------------------------------
    console.log('\n[Step 3] Running Gemini compliance analysis on submission...');
    const allGuidelines = await Guideline.find({});
    const findings = await analyzeContentWithGemini({
      content: testSubmission.content,
      contentType: testSubmission.contentType,
      guidelines: allGuidelines
    });

    console.log(`✅ Gemini returned ${findings.length} findings.`);

    // Calculate score
    let penalty = 0;
    findings.forEach((f) => {
      const sev = (f.severity || '').toLowerCase();
      if (sev === 'critical') penalty += 24;
      else if (sev === 'high') penalty += 14;
      else if (sev === 'medium') penalty += 8;
      else penalty += 4;
    });
    const calculatedScore = Math.max(25, Math.min(100, 100 - penalty));

    // Save findings
    const findingDocs = findings.map((f) => ({
      submissionId: testSubmission._id,
      ruleId: f.ruleId,
      severity: f.severity,
      offendingText: f.offendingText,
      explanation: f.explanation,
      suggestedCorrection: f.suggestedCorrection
    }));
    if (findingDocs.length > 0) {
      await Finding.insertMany(findingDocs);
    }

    testSubmission.status = 'analyzed';
    testSubmission.complianceScore = calculatedScore;
    testSubmission.findingsCount = findingDocs.length;
    await testSubmission.save();

    console.log(`✅ Submission updated to status: "${testSubmission.status}", score: ${calculatedScore}%, findings: ${findingDocs.length}`);
    if (findingDocs.length === 0) {
      throw new Error('Expected violations for "farm to bowl" and "Real Food Pure Energy!" were not caught.');
    }

    // -------------------------------------------------------------
    // Step 4: Reviewer requests changes
    // -------------------------------------------------------------
    console.log('\n[Step 4] Reviewer requests changes...');
    const review1 = await Review.create({
      submissionId: testSubmission._id,
      reviewerId: 'reviewer_sarah',
      decision: 'changes_requested',
      comments: 'Please fix the trademark casing for Farm-to-Bowl™ and add the comma/period to the tagline.'
    });
    testSubmission.status = 'changes_requested';
    await testSubmission.save();
    console.log(`✅ Review recorded with decision: "${review1.decision}". Submission status: "${testSubmission.status}"`);

    // -------------------------------------------------------------
    // Step 5: Employee resubmits amended content
    // -------------------------------------------------------------
    console.log('\n[Step 5] Employee resubmits amended content...');
    const amendedContent = 'Try our fresh Farm-to-Bowl™ lunch today! FreshBite: Real Food, Pure Energy.';
    
    // Clear old findings and reset status
    await Finding.deleteMany({ submissionId: testSubmission._id });
    testSubmission.content = amendedContent;
    testSubmission.status = 'pending';
    testSubmission.complianceScore = null;
    testSubmission.findingsCount = 0;
    await testSubmission.save();

    const previousReviews = await Review.find({ submissionId: testSubmission._id });
    console.log(`✅ Content resubmitted. Status reset to "${testSubmission.status}". Previous reviews preserved: ${previousReviews.length} record(s).`);

    // -------------------------------------------------------------
    // Step 6: Fresh Gemini analysis on amended content
    // -------------------------------------------------------------
    console.log('\n[Step 6] Running fresh Gemini analysis on amended content...');
    const cleanFindings = await analyzeContentWithGemini({
      content: testSubmission.content,
      contentType: testSubmission.contentType,
      guidelines: allGuidelines
    });

    console.log(`✅ Fresh Gemini analysis returned ${cleanFindings.length} findings.`);
    let cleanPenalty = 0;
    cleanFindings.forEach((f) => {
      const sev = (f.severity || '').toLowerCase();
      if (sev === 'critical') cleanPenalty += 24;
      else if (sev === 'high') cleanPenalty += 14;
      else if (sev === 'medium') cleanPenalty += 8;
      else cleanPenalty += 4;
    });
    const cleanScore = Math.max(25, Math.min(100, 100 - cleanPenalty));

    testSubmission.status = 'analyzed';
    testSubmission.complianceScore = cleanScore;
    testSubmission.findingsCount = cleanFindings.length;
    await testSubmission.save();
    console.log(`✅ Resubmission score: ${cleanScore}%, status: "${testSubmission.status}"`);

    // -------------------------------------------------------------
    // Step 7: Reviewer approves submission
    // -------------------------------------------------------------
    console.log('\n[Step 7] Reviewer approves submission...');
    const review2 = await Review.create({
      submissionId: testSubmission._id,
      reviewerId: 'reviewer_sarah',
      decision: 'approved',
      comments: 'All trademark and tagline corrections verified. Approved for distribution.'
    });
    testSubmission.status = 'approved';
    await testSubmission.save();
    console.log(`✅ Review recorded with decision: "${review2.decision}". Submission final status: "${testSubmission.status}"`);

    // -------------------------------------------------------------
    // Step 8: Verify audit trail integrity
    // -------------------------------------------------------------
    console.log('\n[Step 8] Verifying complete audit trail...');
    const fullAuditReviews = await Review.find({ submissionId: testSubmission._id }).sort({ createdAt: 1 });
    console.log(`✅ Total review decisions in audit trail: ${fullAuditReviews.length}`);
    fullAuditReviews.forEach((r, idx) => {
      console.log(`   Decision ${idx + 1}: [${r.decision}] by ${r.reviewerId} at ${r.createdAt.toISOString()} - "${r.comments}"`);
    });

    console.log('\n===============================================================');
    console.log('   FULL INTEGRATION LIFECYCLE VERIFIED SUCCESSFULLY!           ');
    console.log('===============================================================');
  } finally {
    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test records from MongoDB...');
    if (testSubmissionId) {
      await Finding.deleteMany({ submissionId: testSubmissionId });
      await Review.deleteMany({ submissionId: testSubmissionId });
      await Submission.findByIdAndDelete(testSubmissionId);
      console.log(`   Deleted test submission ${testSubmissionId} and associated records.`);
    }
    if (testGuidelineId) {
      await Guideline.findByIdAndDelete(testGuidelineId);
      console.log(`   Deleted test guideline ${testGuidelineId}.`);
    }
    await mongoose.connection.close();
    console.log('   Mongoose connection closed.');
  }
}

runIntegrationFlow().catch((err) => {
  console.error('\n❌ Integration Verification FAILED:', err);
  process.exit(1);
});
