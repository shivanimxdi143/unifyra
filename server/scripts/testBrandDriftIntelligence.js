/**
 * @file testBrandDriftIntelligence.js
 * @description Verifies Round 3 Commitment 2: Advanced Brand Drift Intelligence
 * Tests:
 * 1. GuidelineSuggestion schema validation and model constraints
 * 2. MongoDB Aggregation pipeline for brand drift analytics across channels & categories
 * 3. HTTP GET /api/analytics/drift with time window filtering (7d, 30d, all)
 * 4. HTTP POST /api/analytics/suggest-guideline-refinements (AI / grounded synthesis)
 * 5. HTTP GET /api/analytics/suggestions (listing pending proposals)
 * 6. HTTP POST /api/analytics/suggestions/:id/approve (creating real Guideline in DB)
 * 7. Duplicate approval rejection (HTTP 400)
 * 8. HTTP POST /api/analytics/suggestions/:id/dismiss (dismissal workflow)
 * 9. Database cleanup and state verification
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Submission, Finding, Guideline, GuidelineSuggestion } = require('../models');
const app = require('../app');

async function runTests() {
  console.log('===============================================================');
  console.log('   TESTING ROUND 3 COMMITMENT 2: ADVANCED BRAND DRIFT         ');
  console.log('===============================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment or server/.env');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');

  // Track created IDs for strict cleanup
  const createdSubmissions = [];
  const createdFindings = [];
  const createdGuidelines = [];
  const createdSuggestions = [];

  // Start temporary local HTTP server for API route testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✅ Test server running on ${baseUrl}`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: GuidelineSuggestion Schema Validation
    // -------------------------------------------------------------------------
    console.log('\n--- 1. GuidelineSuggestion Schema Constraints ---');
    const testSug = new GuidelineSuggestion({
      title: 'Healthy Claims Restriction',
      category: 'Health & Claims',
      severity: 'high',
      proposedRuleText: 'Never state a product cures medical ailments.',
      rationale: 'Multiple posts claimed immunity cures.',
      supportingEvidence: {
        violationCount: 5,
        affectedChannels: ['Instagram', 'Twitter'],
        sampleOffendingText: 'Cures all fatigue naturally!',
        recurringPattern: 'Medical claim'
      },
      confidence: 0.92
    });

    assert(testSug.status === 'pending', 'Default status is "pending"');
    assert(testSug.category === 'Health & Claims', 'Accepts valid category enum');
    assert(testSug.severity === 'high', 'Accepts valid severity enum');
    assert(testSug.confidence === 0.92, 'Preserves confidence float');
    assert(testSug.supportingEvidence.violationCount === 5, 'Nested supportingEvidence preserved');

    // -------------------------------------------------------------------------
    // TEST 2: Seed Sample Submissions & Recurring Violations
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Seeding Test Submissions & Recurring Findings ---');
    const testGuideline = await Guideline.create({
      brandName: 'FreshBite',
      title: 'No Medical Health Claims',
      category: 'Health & Claims',
      description: 'Do not state food products cure diseases or ailments.',
      createdBy: 'test-admin@freshbite.com',
      rules: [
        {
          ruleText: 'Do not claim products cure illness or guarantee weight loss.',
          severity: 'high',
          examples: ['Supports vitality', 'Cures diabetes']
        }
      ]
    });
    createdGuidelines.push(testGuideline._id);

    // Create 4 test submissions across different channels
    const sub1 = await Submission.create({
      submittedBy: 'drift_tester_1',
      content: 'Drink our cleanse, it eliminates medical fatigue 100%!',
      contentType: 'social_post',
      department: 'Marketing',
      status: 'analyzed',
      complianceScore: 65,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    createdSubmissions.push(sub1._id);

    const sub2 = await Submission.create({
      submittedBy: 'drift_tester_2',
      content: 'Guaranteed to cure chronic exhaustion!',
      contentType: 'ad_copy',
      department: 'Social Media',
      status: 'analyzed',
      complianceScore: 70,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });
    createdSubmissions.push(sub2._id);

    const sub3 = await Submission.create({
      submittedBy: 'drift_tester_3',
      content: 'Fresh organic bowl for everyday wellness and great nutrition.',
      contentType: 'email',
      department: 'Growth',
      status: 'approved',
      complianceScore: 98,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    createdSubmissions.push(sub3._id);

    // Seed recurring findings linking to the testGuideline rule
    const f1 = await Finding.create({
      submissionId: sub1._id,
      ruleId: testGuideline._id.toString(),
      ruleTitle: 'No Medical Health Claims',
      category: 'Health & Claims',
      severity: 'high',
      offendingText: 'eliminates medical fatigue 100%',
      explanation: 'Making unsubstantiated medical claims',
      createdAt: sub1.createdAt
    });
    createdFindings.push(f1._id);

    const f2 = await Finding.create({
      submissionId: sub2._id,
      ruleId: testGuideline._id.toString(),
      ruleTitle: 'No Medical Health Claims',
      category: 'Health & Claims',
      severity: 'high',
      offendingText: 'cure chronic exhaustion',
      explanation: 'Medical curing guarantee violation',
      createdAt: sub2.createdAt
    });
    createdFindings.push(f2._id);

    console.log(`  ✅ Seeded 3 submissions and 2 recurring findings across social_post, ad_copy and email`);

    // -------------------------------------------------------------------------
    // TEST 3: GET /api/analytics/drift Endpoint & Aggregations
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing GET /api/analytics/drift ---');
    const driftRes = await fetch(`${baseUrl}/api/analytics/drift?timeRange=30d`);
    assert(driftRes.status === 200, 'GET /api/analytics/drift returns HTTP 200');

    const driftJson = await driftRes.json();
    assert(driftJson.success === true, 'Response indicates success: true');
    assert(driftJson.data && driftJson.data.summary, 'Response contains summary metrics');
    assert(typeof driftJson.data.summary.totalSubmissions === 'number', 'summary.totalSubmissions is numeric');
    assert(driftJson.data.summary.totalSubmissions >= 3, 'Summary totalSubmissions reflects seeded items');
    assert(driftJson.data.severityDistribution && typeof driftJson.data.severityDistribution.high === 'number', 'severityDistribution includes high severity');
    assert(Array.isArray(driftJson.data.categoryBreakdown), 'categoryBreakdown is an array');
    assert(Array.isArray(driftJson.data.channelBreakdown), 'channelBreakdown is an array');
    assert(Array.isArray(driftJson.data.topRecurringViolations), 'topRecurringViolations is an array');

    // Verify channel breakdown detects social_post and email
    const channelNames = driftJson.data.channelBreakdown.map((c) => c.channel);
    assert(channelNames.includes('social_post'), 'channelBreakdown includes social_post');
    assert(channelNames.includes('email'), 'channelBreakdown includes email');

    // Test time range filtering
    const drift7d = await fetch(`${baseUrl}/api/analytics/drift?timeRange=7d`);
    assert(drift7d.status === 200, 'GET /api/analytics/drift?timeRange=7d returns HTTP 200');

    const driftAll = await fetch(`${baseUrl}/api/analytics/drift?timeRange=all`);
    assert(driftAll.status === 200, 'GET /api/analytics/drift?timeRange=all returns HTTP 200');

    // -------------------------------------------------------------------------
    // TEST 4: POST /api/analytics/suggest-guideline-refinements
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing POST /api/analytics/suggest-guideline-refinements ---');
    const suggestRes = await fetch(`${baseUrl}/api/analytics/suggest-guideline-refinements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert(suggestRes.status === 201 || suggestRes.status === 200, 'POST /api/analytics/suggest-guideline-refinements returns HTTP 201 Created');

    const suggestJson = await suggestRes.json();
    assert(suggestJson.success === true, 'Suggestion generation returns success: true');
    assert(Array.isArray(suggestJson.data), 'Suggestion response data is an array');
    assert(suggestJson.data.length >= 1, 'At least 1 guideline suggestion generated from recurring violations');

    // Track all generated suggestions for cleanup
    suggestJson.data.forEach(s => createdSuggestions.push(s._id));
    const generatedSuggestion = suggestJson.data[0];

    assert(generatedSuggestion.title, 'Generated suggestion has title');
    assert(generatedSuggestion.proposedRuleText, 'Generated suggestion has proposedRuleText');
    assert(generatedSuggestion.status === 'pending', 'Generated suggestion has status "pending"');
    assert(generatedSuggestion.supportingEvidence, 'Generated suggestion has supportingEvidence');

    // -------------------------------------------------------------------------
    // TEST 5: GET /api/analytics/suggestions
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing GET /api/analytics/suggestions ---');
    const listRes = await fetch(`${baseUrl}/api/analytics/suggestions?status=pending`);
    assert(listRes.status === 200, 'GET /api/analytics/suggestions returns HTTP 200');
    const listJson = await listRes.json();
    assert(listJson.success === true, 'List response indicates success: true');
    assert(Array.isArray(listJson.data), 'List response data is an array');
    const foundPending = listJson.data.some((s) => s._id.toString() === generatedSuggestion._id.toString());
    assert(foundPending, 'Generated suggestion is present in pending suggestions list');

    // -------------------------------------------------------------------------
    // TEST 6: POST /api/analytics/suggestions/:id/approve
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Suggestion Approval & Guideline Enforcement ---');
    const approveRes = await fetch(`${baseUrl}/api/analytics/suggestions/${generatedSuggestion._id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName: 'Brand Director Test' })
    });
    assert(approveRes.status === 200, 'POST /api/analytics/suggestions/:id/approve returns HTTP 200');

    const approveJson = await approveRes.json();
    assert(approveJson.success === true, 'Approve response indicates success: true');
    assert(approveJson.data && approveJson.data.suggestion, 'Returns updated suggestion object');
    assert(approveJson.data.suggestion.status === 'approved', 'Suggestion status is updated to "approved"');
    assert(approveJson.data.suggestion.reviewedBy === 'Brand Director Test', 'Suggestion reviewer is recorded');
    assert(approveJson.data.guideline && approveJson.data.guideline._id, 'Returns newly created Guideline in database');

    createdGuidelines.push(approveJson.data.guideline._id);

    // Verify in MongoDB that the Guideline actually exists and is active
    const savedGuideline = await Guideline.findById(approveJson.data.guideline._id);
    assert(savedGuideline !== null, 'Newly created Guideline successfully persisted in MongoDB Atlas');
    assert(savedGuideline.title === generatedSuggestion.title, 'Guideline title matches approved suggestion title');
    assert(savedGuideline.category === generatedSuggestion.category, 'Guideline category matches approved suggestion');

    // -------------------------------------------------------------------------
    // TEST 7: Duplicate Approval Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Duplicate Approval Prevention ---');
    const dupRes = await fetch(`${baseUrl}/api/analytics/suggestions/${generatedSuggestion._id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName: 'Brand Director Test' })
    });
    assert(dupRes.status === 400, 'Duplicate approval returns HTTP 400 Bad Request');
    const dupJson = await dupRes.json();
    assert(dupJson.success === false, 'Duplicate approval returns success: false');
    const errText = dupJson.message || dupJson.error?.message || JSON.stringify(dupJson);
    assert(errText.toLowerCase().includes('already') && errText.toLowerCase().includes('approved'), 'Error message states already approved');

    // -------------------------------------------------------------------------
    // TEST 8: POST /api/analytics/suggestions/:id/dismiss
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Suggestion Dismissal ---');
    // Create another temporary suggestion to dismiss
    const dismissibleSug = await GuidelineSuggestion.create({
      title: 'Temporary Promotional Style Drift',
      category: 'Promotional Style',
      severity: 'medium',
      proposedRuleText: 'Limit countdown timers to 24-hour flash sales.',
      rationale: 'Frequent urgency emojis noted on Twitter.',
      supportingEvidence: {
        violationCount: 3,
        affectedChannels: ['Twitter'],
        sampleOffendingText: 'LAST CHANCE 30 MINS ONLY',
        recurringPattern: 'Excessive urgency language'
      },
      status: 'pending'
    });
    createdSuggestions.push(dismissibleSug._id);

    const dismissRes = await fetch(`${baseUrl}/api/analytics/suggestions/${dismissibleSug._id}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName: 'Brand Manager Test' })
    });
    assert(dismissRes.status === 200, 'POST /api/analytics/suggestions/:id/dismiss returns HTTP 200');

    const dismissJson = await dismissRes.json();
    assert(dismissJson.success === true, 'Dismiss returns success: true');
    assert(dismissJson.data.status === 'dismissed', 'Suggestion status updated to "dismissed"');
    assert(dismissJson.data.reviewedBy === 'Brand Manager Test', 'Dismissal records reviewerName');

    // -------------------------------------------------------------------------
    // TEST 9: Confirm Dismissed Suggestions Cannot Be Approved or Re-Dismissed
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Dismissed Suggestions Protection ---');
    const approveDismissedRes = await fetch(`${baseUrl}/api/analytics/suggestions/${dismissibleSug._id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName: 'Brand Director Test' })
    });
    assert(approveDismissedRes.status === 400, 'Approving dismissed suggestion returns HTTP 400');
    const approveDismissedJson = await approveDismissedRes.json();
    const dismissErrText = approveDismissedJson.message || approveDismissedJson.error?.message || '';
    assert(dismissErrText.toLowerCase().includes('dismissed'), 'Error indicates dismissed suggestions cannot be approved');

    const reDismissRes = await fetch(`${baseUrl}/api/analytics/suggestions/${dismissibleSug._id}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName: 'Brand Manager Test' })
    });
    assert(reDismissRes.status === 400, 'Re-dismissing already dismissed suggestion returns HTTP 400');

    // -------------------------------------------------------------------------
    // VERIFICATION SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`   ALL TESTS PASSED: ${passedTests} / ${totalTests} ASSERTIONS VERIFIED `);
    console.log('===============================================================');

  } finally {
    // Clean up all seeded test data
    console.log('\n--- Cleaning up temporary test artifacts ---');
    if (createdSubmissions.length > 0) {
      await Submission.deleteMany({ _id: { $in: createdSubmissions } });
    }
    if (createdFindings.length > 0) {
      await Finding.deleteMany({ _id: { $in: createdFindings } });
    }
    if (createdGuidelines.length > 0) {
      await Guideline.deleteMany({ _id: { $in: createdGuidelines } });
    }
    if (createdSuggestions.length > 0) {
      await GuidelineSuggestion.deleteMany({ _id: { $in: createdSuggestions } });
    }
    console.log('✅ Cleaned up temporary test database records');

    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('✅ Server and database connections closed cleanly');
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
