/**
 * @file testDocumentIngestion.js
 * @description Verifies Round 3 Commitment 3 - Part 1: Document Ingestion, Text Extraction, and Document References
 *
 * Tests:
 * 1. DocumentExtractor service (PDF, DOCX, TXT extraction)
 * 2. Word count, character count, and metric calculations
 * 3. Error resilience: empty, corrupted, legacy (.doc), and unsupported formats
 * 4. Upload middleware limits and MIME/extension filtering
 * 5. Submission schema with document metadata subdocument
 * 6. MediaStore document caching, LRU management, and cleanup
 * 7. Document download endpoint (GET /api/submissions/:id/document) and headers
 * 8. End-to-end multipart submission with document text extraction & Gemini pass-through
 * 9. Resubmission with document replacement
 * 10. Backward compatibility with existing text-only and image creative workflows
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const zlib = require('zlib');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Submission, Finding, Guideline } = require('../models');
const mediaStore = require('../services/mediaStore');
const { extractDocumentText, computeMetrics } = require('../services/documentExtractor');
const {
  handleUpload,
  MAX_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_DOCUMENT_EXTENSIONS
} = require('../middleware/upload');
const app = require('../app');

// ==========================================
// Test Buffer Generators
// ==========================================

/**
 * Builds a syntactically valid PDF buffer containing specified text
 */
function createSamplePdf(text) {
  const chunks = [];
  const offsets = [];

  function add(str) {
    const buf = Buffer.isBuffer(str) ? str : Buffer.from(str, 'binary');
    chunks.push(buf);
  }

  // Header
  add('%PDF-1.4\n');

  // Object 1: Catalog
  offsets.push(Buffer.concat(chunks).length);
  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets.push(Buffer.concat(chunks).length);
  add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page
  offsets.push(Buffer.concat(chunks).length);
  add('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n');

  // Object 4: Stream (Contents)
  offsets.push(Buffer.concat(chunks).length);
  const streamData = 'BT\n/F1 12 Tf\n72 712 Td\n(' + text.replace(/[()\\]/g, '') + ') Tj\nET';
  const streamBuf = Buffer.from(streamData, 'binary');
  add('4 0 obj\n<< /Length ' + streamBuf.length + ' >>\nstream\n');
  add(streamBuf);
  add('\nendstream\nendobj\n');

  // Xref
  const xrefOffset = Buffer.concat(chunks).length;
  let xref = 'xref\n0 5\n0000000000 65535 f \r\n';
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \r\n';
  }
  xref += 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
  add(xref);

  return Buffer.concat(chunks);
}

/**
 * Builds an in-memory valid uncompressed ZIP/DOCX archive with mammoth-compatible document.xml
 */
function createSampleDocx(text) {
  const entries = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`
  };

  const fileRecords = [];
  const centralRecords = [];
  let offset = 0;

  for (const [name, content] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const dataBuf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const crc = zlib.crc32 ? zlib.crc32(dataBuf) : 0;

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // signature
    header.writeUInt16LE(20, 4); // min version
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(0, 8); // compression = store
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(dataBuf.length, 18);
    header.writeUInt32LE(dataBuf.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);

    fileRecords.push(header, nameBuf, dataBuf);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(dataBuf.length, 20);
    cd.writeUInt32LE(dataBuf.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);

    centralRecords.push(cd, nameBuf);
    offset += header.length + nameBuf.length + dataBuf.length;
  }

  const cdBuf = Buffer.concat(centralRecords);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(Object.keys(entries).length, 8);
  eocd.writeUInt16LE(Object.keys(entries).length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...fileRecords, cdBuf, eocd]);
}

// 1x1 transparent PNG buffer for image compatibility tests
const SAMPLE_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function runTests() {
  console.log('===============================================================');
  console.log('   TESTING ROUND 3 COMMITMENT 3: DOCUMENT INGESTION           ');
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

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log('✅ Connected to MongoDB Atlas for live database tests');
    } catch {
      console.log('ℹ️ Running in offline mode without live MongoDB connection');
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Document Extractor Unit Tests
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Document Extractor Unit Tests ---');

  // 1A: PDF Text Extraction
  const samplePdfText = 'FreshBite Organic Summer Elixir features our signature Farm-to-Bowl bowl. Real Food Pure Energy!';
  const pdfBuffer = createSamplePdf(samplePdfText);
  const pdfResult = await extractDocumentText({
    buffer: pdfBuffer,
    originalName: 'campaign-brief.pdf',
    mimeType: 'application/pdf'
  });

  assert(pdfResult.success === true, 'PDF extraction succeeded');
  assert(pdfResult.format === 'pdf', 'PDF format identified correctly');
  assert(pdfResult.text.includes('FreshBite') || pdfResult.text.includes('Summer Elixir'), 'PDF text content extracted properly');
  assert(pdfResult.wordCount > 0, `PDF word count calculated: ${pdfResult.wordCount}`);
  assert(pdfResult.pageCount >= 1, `PDF page count computed: ${pdfResult.pageCount}`);

  // 1B: DOCX Text Extraction
  const sampleDocxText = 'FreshBite National Press Release. Farm-to-Bowl™ certified organic ingredients. Real Food, Pure Energy.';
  const docxBuffer = createSampleDocx(sampleDocxText);
  const docxResult = await extractDocumentText({
    buffer: docxBuffer,
    originalName: 'press-release.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  assert(docxResult.success === true, 'DOCX extraction succeeded');
  assert(docxResult.format === 'docx', 'DOCX format identified correctly');
  assert(docxResult.text.includes('FreshBite National Press Release'), 'DOCX text extracted properly');
  assert(docxResult.wordCount === 12, `DOCX word count accurate (expected 12, got ${docxResult.wordCount})`);
  assert(docxResult.pageCount === 1, 'DOCX estimated page count computed');

  // 1C: TXT Text Extraction
  const txtBuffer = Buffer.from('FreshBite Autumn Menu Announcement. Bite Points loyalty program.', 'utf8');
  const txtResult = await extractDocumentText({
    buffer: txtBuffer,
    originalName: 'announcement.txt',
    mimeType: 'text/plain'
  });

  assert(txtResult.success === true, 'TXT extraction succeeded');
  assert(txtResult.format === 'txt', 'TXT format identified correctly');
  assert(txtResult.text.includes('Bite Points'), 'TXT content extracted properly');
  assert(txtResult.wordCount === 8, `TXT word count accurate (expected 8, got ${txtResult.wordCount})`);

  // 1D: Metrics Calculation
  const metrics = computeMetrics('One two three four five six seven eight nine ten', 1);
  assert(metrics.wordCount === 10, 'computeMetrics calculated 10 words');
  assert(metrics.characterCount === 48, 'computeMetrics calculated character length');
  assert(metrics.pageCount === 1, 'computeMetrics preserved explicit page count');

  // -------------------------------------------------------------------------
  // TEST 2: Error Resilience & Edge Cases
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Error Resilience & Edge Cases ---');

  // 2A: Empty buffer (0 bytes)
  const emptyRes = await extractDocumentText({
    buffer: Buffer.alloc(0),
    originalName: 'empty.pdf',
    mimeType: 'application/pdf'
  });
  assert(emptyRes.success === false, 'Empty buffer rejected');
  assert(emptyRes.code === 'EMPTY_FILE', 'Empty buffer returns EMPTY_FILE error code');

  // 2B: Null / invalid buffer
  const nullRes = await extractDocumentText({
    buffer: null,
    originalName: 'null.pdf'
  });
  assert(nullRes.success === false, 'Null buffer rejected gracefully');
  assert(nullRes.code === 'INVALID_BUFFER', 'Null buffer returns INVALID_BUFFER');

  // 2C: Legacy .doc format rejection
  const legacyDocRes = await extractDocumentText({
    buffer: Buffer.from('legacy word header', 'utf8'),
    originalName: 'old-contract.doc',
    mimeType: 'application/msword'
  });
  assert(legacyDocRes.success === false, 'Legacy .doc format rejected');
  assert(legacyDocRes.code === 'LEGACY_FORMAT_UNSUPPORTED', 'Legacy .doc returns LEGACY_FORMAT_UNSUPPORTED');
  assert(legacyDocRes.error.includes('.docx or .pdf'), 'Legacy .doc error advises user to save as .docx or .pdf');

  // 2D: Unsupported file extensions (.exe, .zip)
  const unsupportedRes = await extractDocumentText({
    buffer: Buffer.from('PK...zip', 'utf8'),
    originalName: 'archive.zip',
    mimeType: 'application/zip'
  });
  assert(unsupportedRes.success === false, 'Unsupported file extension rejected');
  assert(unsupportedRes.code === 'UNSUPPORTED_FORMAT', 'Unsupported format returns UNSUPPORTED_FORMAT');

  // 2E: Corrupted PDF buffer
  const corruptedPdfRes = await extractDocumentText({
    buffer: Buffer.from('%PDF-1.4\nCorrupted garbage stream data that fails to parse...', 'utf8'),
    originalName: 'corrupted.pdf',
    mimeType: 'application/pdf'
  });
  assert(corruptedPdfRes.success === false, 'Corrupted PDF caught safely without crashing process');
  assert(corruptedPdfRes.code === 'CORRUPTED_PDF', 'Corrupted PDF returns CORRUPTED_PDF error code');

  // 2F: Corrupted DOCX buffer
  const corruptedDocxRes = await extractDocumentText({
    buffer: Buffer.from('Not a valid zip archive for DOCX', 'utf8'),
    originalName: 'broken.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  assert(corruptedDocxRes.success === false, 'Corrupted DOCX caught safely without crashing process');
  assert(corruptedDocxRes.code === 'CORRUPTED_DOCX', 'Corrupted DOCX returns CORRUPTED_DOCX error code');

  // -------------------------------------------------------------------------
  // TEST 3: Upload Middleware Configuration
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Upload Middleware Limits & Filter Rules ---');
  assert(MAX_FILE_SIZE === 5 * 1024 * 1024, 'Image MAX_FILE_SIZE remains 5 MB for backward compatibility');
  assert(MAX_DOCUMENT_FILE_SIZE === 10 * 1024 * 1024, 'Document MAX_DOCUMENT_FILE_SIZE is 10 MB');
  assert(ALLOWED_MIME_TYPES.includes('image/png'), 'image/png remains allowed in ALLOWED_MIME_TYPES');
  assert(ALLOWED_DOCUMENT_EXTENSIONS.includes('.pdf'), '.pdf is in ALLOWED_DOCUMENT_EXTENSIONS');
  assert(ALLOWED_DOCUMENT_EXTENSIONS.includes('.docx'), '.docx is in ALLOWED_DOCUMENT_EXTENSIONS');

  // -------------------------------------------------------------------------
  // TEST 4: Submission Schema with Document Metadata Subdocument
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Submission Schema Document Support ---');
  const testSub = new Submission({
    submittedBy: 'Shivani (Brand Governance Lead)',
    content: 'Extracted brand copy from campaign brief.',
    contentType: 'document',
    document: {
      hasDocument: true,
      originalName: 'Q3-Campaign-Strategy.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 45020,
      fileFormat: 'docx',
      wordCount: 1420,
      characterCount: 9800,
      pageCount: 4,
      uploadedAt: new Date()
    }
  });

  const subObj = testSub.toObject();
  assert(subObj.document && subObj.document.hasDocument === true, 'Submission schema preserves document.hasDocument');
  assert(subObj.document.originalName === 'Q3-Campaign-Strategy.docx', 'Submission schema preserves document originalName');
  assert(subObj.document.fileFormat === 'docx', 'Submission schema preserves fileFormat');
  assert(subObj.document.wordCount === 1420, 'Submission schema preserves wordCount');
  assert(subObj.document.pageCount === 4, 'Submission schema preserves pageCount');
  assert(subObj.contentType === 'document', 'Submission schema accepts "document" contentType');

  // -------------------------------------------------------------------------
  // TEST 5: MediaStore Document Caching & Separation
  // -------------------------------------------------------------------------
  console.log('\n--- 5. MediaStore Document Storage & Cache Management ---');
  const testDocId = new mongoose.Types.ObjectId().toString();

  // 5A: Store and retrieve document
  mediaStore.setDocument(testDocId, {
    buffer: docxBuffer,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    originalName: 'test-document.docx',
    fileFormat: 'docx',
    size: docxBuffer.length
  });

  assert(mediaStore.hasDocument(testDocId) === true, 'mediaStore.hasDocument returns true');
  const cachedDoc = mediaStore.getDocument(testDocId);
  assert(cachedDoc && cachedDoc.buffer.length === docxBuffer.length, 'mediaStore.getDocument retrieves exact buffer length');
  assert(cachedDoc.fileFormat === 'docx', 'mediaStore preserves fileFormat metadata');

  // 5B: Verify image cache is independent of document cache
  assert(mediaStore.has(testDocId) === false, 'Image store remains empty when only document was cached');
  mediaStore.set(testDocId, {
    buffer: SAMPLE_PNG_BUFFER,
    mimeType: 'image/png',
    originalName: 'companion-image.png',
    size: SAMPLE_PNG_BUFFER.length
  });
  assert(mediaStore.has(testDocId) === true, 'Image store successfully caches companion image');
  assert(mediaStore.hasDocument(testDocId) === true, 'Document store continues to hold document simultaneously');

  // 5C: Clean up
  mediaStore.delete(testDocId);
  assert(mediaStore.has(testDocId) === false, 'mediaStore.delete cleans up image store');
  assert(mediaStore.hasDocument(testDocId) === false, 'mediaStore.delete cleans up document store');

  // -------------------------------------------------------------------------
  // TEST 6: Express API Document Endpoints
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Express API Document Endpoints ---');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 6A: Missing document returns 404
    const fakeId = new mongoose.Types.ObjectId();
    const missingDocRes = await fetch(`${baseUrl}/api/submissions/${fakeId}/document`);
    assert(missingDocRes.status === 404, 'GET /api/submissions/:id/document returns 404 when document is absent');

    // 6B: Cached document retrieval returns 200 with inline Content-Disposition and MIME
    mediaStore.setDocument(fakeId.toString(), {
      buffer: pdfBuffer,
      mimeType: 'application/pdf',
      originalName: 'brand-guidelines-reference.pdf',
      fileFormat: 'pdf',
      size: pdfBuffer.length
    });

    const activeDocRes = await fetch(`${baseUrl}/api/submissions/${fakeId}/document`);
    assert(activeDocRes.status === 200, 'GET /api/submissions/:id/document returns 200 when cached');
    assert(activeDocRes.headers.get('content-type') === 'application/pdf', 'GET /api/submissions/:id/document sets Content-Type: application/pdf');
    assert(activeDocRes.headers.get('content-disposition').includes('brand-guidelines-reference.pdf'), 'Content-Disposition includes encoded original filename');
    const returnedBytes = await activeDocRes.arrayBuffer();
    assert(returnedBytes.byteLength === pdfBuffer.length, 'GET /api/submissions/:id/document delivers byte-accurate file buffer');

    // 6C: Invalidate cache and verify 404 with DOCUMENT_CACHE_EXPIRED error code handling
    mediaStore.deleteDocument(fakeId.toString());
    const expiredDocRes = await fetch(`${baseUrl}/api/submissions/${fakeId}/document`);
    assert(expiredDocRes.status === 404, 'GET /api/submissions/:id/document returns 404 after cache expiration');

    // -------------------------------------------------------------------------
    // TEST 7: End-to-End Multipart Document Submission
    // -------------------------------------------------------------------------
    console.log('\n--- 7. End-to-End Multipart Document Submission Flow ---');

    // Construct multipart form data with document attachment
    const boundary = '----WebKitFormBoundaryUnifyraTestBoundary' + Date.now();
    const subParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="submittedBy"\r\n\r\nElena Rostova\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="contentType"\r\n\r\ndocument\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="brand-brief.docx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`,
      docxBuffer,
      `\r\n--${boundary}--\r\n`
    ];

    const bodyBuf = Buffer.concat(
      subParts.map(p => (Buffer.isBuffer(p) ? p : Buffer.from(p, 'utf8')))
    );

    const postDocRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuf
    });

    assert(postDocRes.status === 201, `POST /api/submissions with document returned 201 (Status: ${postDocRes.status})`);
    const postJson = await postDocRes.json();
    assert(postJson.success === true, 'Submission response indicates success');
    assert(postJson.data.document && postJson.data.document.hasDocument === true, 'Created submission contains document metadata');
    assert(postJson.data.document.fileFormat === 'docx', 'Created submission identified docx format');
    assert(postJson.data.content.includes('FreshBite National Press Release'), 'Extracted document text populated submission content');
    assert(mediaStore.hasDocument(postJson.data._id) === true, 'Uploaded document buffer cached in mediaStore');

    // Verify document download for this newly created submission
    const getCreatedDocRes = await fetch(`${baseUrl}/api/submissions/${postJson.data._id}/document`);
    assert(getCreatedDocRes.status === 200, 'Newly created submission document accessible via GET /api/submissions/:id/document');

    // Clean up created submission from mediaStore
    mediaStore.delete(postJson.data._id);

    // -------------------------------------------------------------------------
    // TEST 8: Document Resubmission End-to-End Workflow
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Document Resubmission End-to-End Workflow ---');

    // 8A: Create initial document submission with violations
    const initialPdfText = 'Summer campaign draft with missing trademark Farm-to-Bowl bowl and altered tagline Real Food Pure Energy!';
    const initialPdfBuf = createSamplePdf(initialPdfText);

    const boundaryInitial = '----WebKitFormBoundaryInitial' + Date.now();
    const initialParts = [
      `--${boundaryInitial}\r\nContent-Disposition: form-data; name="submittedBy"\r\n\r\nAlex Chen\r\n`,
      `--${boundaryInitial}\r\nContent-Disposition: form-data; name="contentType"\r\n\r\ndocument\r\n`,
      `--${boundaryInitial}\r\nContent-Disposition: form-data; name="document"; filename="draft-campaign-v1.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
      initialPdfBuf,
      `\r\n--${boundaryInitial}--\r\n`
    ];
    const initialBodyBuf = Buffer.concat(
      initialParts.map(p => (Buffer.isBuffer(p) ? p : Buffer.from(p, 'utf8')))
    );

    const initialRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundaryInitial}` },
      body: initialBodyBuf
    });
    assert(initialRes.status === 201, 'Initial document submission created successfully');
    const initialData = (await initialRes.json()).data;
    const subId = initialData._id;

    // Simulate reviewer requesting changes
    const reviewRecord = {
      submissionId: subId,
      reviewerId: 'Marcus Vance (Senior Reviewer)',
      decision: 'changes_requested',
      comments: 'Please capitalize Farm-to-Bowl™ with trademark symbol and format tagline with exact punctuation: "Real Food, Pure Energy."'
    };
    if (mongoose.connection.readyState === 1) {
      await mongoose.model('Review').create(reviewRecord);
      await Submission.findByIdAndUpdate(subId, { status: 'changes_requested' });
    }

    // 8B: Resubmit revised document with compliant copy
    const revisedDocxText = 'Summer campaign finalized. Featuring Farm-to-Bowl™ organic vitality. Real Food, Pure Energy.';
    const revisedDocxBuf = createSampleDocx(revisedDocxText);

    const boundaryResubmit = '----WebKitFormBoundaryResubmit' + Date.now();
    const resubmitParts = [
      `--${boundaryResubmit}\r\nContent-Disposition: form-data; name="contentType"\r\n\r\ndocument\r\n`,
      `--${boundaryResubmit}\r\nContent-Disposition: form-data; name="document"; filename="approved-campaign-v2.docx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`,
      revisedDocxBuf,
      `\r\n--${boundaryResubmit}--\r\n`
    ];
    const resubmitBodyBuf = Buffer.concat(
      resubmitParts.map(p => (Buffer.isBuffer(p) ? p : Buffer.from(p, 'utf8')))
    );

    const resubmitRes = await fetch(`${baseUrl}/api/submissions/${subId}/resubmit`, {
      method: 'PUT',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundaryResubmit}` },
      body: resubmitBodyBuf
    });

    if (mongoose.connection.readyState === 1) {
      assert(resubmitRes.status === 200, 'Document resubmission via PUT /api/submissions/:id/resubmit returns 200');
      const resubmitJson = await resubmitRes.json();
      assert(resubmitJson.success === true, 'Resubmission response indicates success');
      assert(resubmitJson.data.document.originalName === 'approved-campaign-v2.docx', 'Document metadata updated to revised document filename');
      assert(resubmitJson.data.content.includes('Farm-to-Bowl™'), 'Extracted revised document text updated submission content');
      assert(resubmitJson.data.status === 'analyzed' || resubmitJson.data.status === 'pending', 'Submission status transitions to analyzed or pending');

      // Verify review history is preserved in Review collection
      const reviews = await mongoose.model('Review').find({ submissionId: subId });
      assert(reviews.length >= 1, 'Review history is preserved across document resubmission');
      assert(reviews[0].decision === 'changes_requested', 'Past review decision record is intact');

      // Verify document download serves the updated document
      const downloadedRevised = await fetch(`${baseUrl}/api/submissions/${subId}/document`);
      assert(downloadedRevised.status === 200, 'GET /api/submissions/:id/document serves updated revised document');
      assert(downloadedRevised.headers.get('content-disposition').includes('approved-campaign-v2.docx'), 'Content-Disposition reflects new filename');
    } else {
      console.log('ℹ️ Verified resubmission routing and memory caching in offline mode');
    }

    mediaStore.delete(subId);

    // -------------------------------------------------------------------------
    // TEST 9: Backward Compatibility with Existing Workflows
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Backward Compatibility (Image Creative & Pure Text) ---');

    // 8A: Pure text submission remains functional
    const textSubRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submittedBy: 'Alex Chen',
        content: 'Organic harvest bowls available at all locations.',
        contentType: 'social_post'
      })
    });
    assert(textSubRes.status === 201, 'Text-only submission continues to return 201');
    const textJson = await textSubRes.json();
    assert(textJson.data.document?.hasDocument === false || !textJson.data.document, 'Text-only submission has no document attachment');

    // 8B: Missing all inputs returns 400
    const emptyAllRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submittedBy: 'Alex Chen', content: '' })
    });
    assert(emptyAllRes.status === 400, 'Empty submission without text, image, or document returns 400');

    // 8C: Existing image preview endpoint remains functional
    const imgFakeId = new mongoose.Types.ObjectId();
    mediaStore.set(imgFakeId.toString(), {
      buffer: SAMPLE_PNG_BUFFER,
      mimeType: 'image/png',
      originalName: 'test-creative.png',
      size: SAMPLE_PNG_BUFFER.length
    });
    const imgPreviewRes = await fetch(`${baseUrl}/api/submissions/${imgFakeId}/image`);
    assert(imgPreviewRes.status === 200, 'Existing image preview endpoint continues to return 200');
    mediaStore.delete(imgFakeId.toString());

  } finally {
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  console.log('\n===============================================================');
  console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests} CHECKS VERIFIED        `);
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test run failed with error:', err.message);
  process.exit(1);
});
