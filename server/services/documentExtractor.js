const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Supported document formats and extensions
 */
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

/**
 * Calculates document metrics including word count, character count, and estimated page count
 *
 * @param {string} text - Cleaned document text
 * @param {number} [reportedPages=null] - Page count reported by parser (e.g. PDF total)
 * @returns {Object} Metric counts
 */
function computeMetrics(text, reportedPages = null) {
  const clean = (text || '').trim();
  const characterCount = clean.length;
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // For documents without explicit page counts (DOCX, TXT), estimate ~350 words per standard page
  const pageCount = reportedPages && reportedPages > 0
    ? reportedPages
    : Math.max(1, Math.ceil(wordCount / 350));

  return {
    wordCount,
    characterCount,
    pageCount
  };
}

/**
 * Extracts plain text and metadata from PDF, DOCX, or TXT document buffers.
 * Handles empty, corrupted, password-protected, and unsupported files safely without crashing.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - Raw document file buffer
 * @param {string} params.originalName - Uploaded document file name
 * @param {string} [params.mimeType=''] - Declared MIME type
 * @returns {Promise<Object>} Extraction result object
 */
async function extractDocumentText({ buffer, originalName = '', mimeType = '' }) {
  // 1. Validate buffer existence and byte length
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return {
      success: false,
      error: 'Invalid document buffer provided for text extraction.',
      code: 'INVALID_BUFFER'
    };
  }

  if (buffer.length === 0) {
    return {
      success: false,
      error: 'Uploaded document is empty (0 bytes). Please upload a valid document file.',
      code: 'EMPTY_FILE'
    };
  }

  // 2. Identify file extension and normalized format
  const ext = path.extname(originalName || '').toLowerCase();
  const normalizedMime = (mimeType || '').toLowerCase();

  // Reject legacy binary Word (.doc) format with an explicit helpful error
  if (ext === '.doc' || normalizedMime === 'application/msword') {
    return {
      success: false,
      error: 'Legacy Word format (.doc) is not supported. Please save or export your document as .docx or .pdf before uploading.',
      code: 'LEGACY_FORMAT_UNSUPPORTED'
    };
  }

  // Determine format from extension or MIME type
  let format = null;
  if (ext === '.pdf' || normalizedMime.includes('pdf')) {
    format = 'pdf';
  } else if (
    ext === '.docx' ||
    normalizedMime.includes('wordprocessingml') ||
    normalizedMime.includes('officedocument')
  ) {
    format = 'docx';
  } else if (ext === '.txt' || normalizedMime.includes('text/plain')) {
    format = 'txt';
  }

  if (!format) {
    return {
      success: false,
      error: `Unsupported document format '${ext || normalizedMime}'. Only PDF (.pdf) and Word (.docx) documents are supported.`,
      code: 'UNSUPPORTED_FORMAT'
    };
  }

  // 3. Perform format-specific text extraction
  let extractedRawText = '';
  let reportedPageCount = null;

  try {
    if (format === 'pdf') {
      // PDF extraction via PDFParse
      let parser = null;
      try {
        parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        extractedRawText = textResult.text || '';
        reportedPageCount = textResult.total || null;
      } catch (pdfErr) {
        const errMsg = (pdfErr.message || '').toLowerCase();
        if (errMsg.includes('password') || errMsg.includes('encrypted') || pdfErr.name === 'PasswordException') {
          return {
            success: false,
            error: 'Document is password-protected or encrypted. Please provide an unencrypted document.',
            code: 'ENCRYPTED_DOCUMENT'
          };
        }
        return {
          success: false,
          error: `Failed to parse PDF document: Corrupted or invalid PDF structure (${pdfErr.message}).`,
          code: 'CORRUPTED_PDF'
        };
      } finally {
        if (parser && typeof parser.destroy === 'function') {
          try {
            await parser.destroy();
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    } else if (format === 'docx') {
      // DOCX extraction via mammoth
      try {
        const mammothResult = await mammoth.extractRawText({ buffer });
        extractedRawText = mammothResult.value || '';
      } catch (docxErr) {
        return {
          success: false,
          error: `Failed to parse Word document: Corrupted or invalid DOCX archive (${docxErr.message}).`,
          code: 'CORRUPTED_DOCX'
        };
      }
    } else if (format === 'txt') {
      // Plain text extraction
      extractedRawText = buffer.toString('utf-8');
      reportedPageCount = 1;
    }
  } catch (unexpectedErr) {
    return {
      success: false,
      error: `Unexpected document extraction failure: ${unexpectedErr.message}`,
      code: 'EXTRACTION_ERROR'
    };
  }

  // 4. Sanitize extracted text (strip control characters and normalize whitespaces)
  const sanitizedText = extractedRawText
    .replace(/\0/g, '') // strip null bytes
    .replace(/\r\n/g, '\n') // normalize newlines
    .replace(/[ \t]+/g, ' ') // collapse horizontal spaces
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();

  // 5. Compute document metrics
  const metrics = computeMetrics(sanitizedText, reportedPageCount);

  // 6. Check for empty readable text content (e.g. scanned image-only PDFs)
  if (metrics.wordCount === 0 || !sanitizedText) {
    return {
      success: false,
      error: 'Document contains no readable text. Scanned or image-only PDFs without an OCR text layer cannot be audited.',
      code: 'NO_READABLE_TEXT',
      format,
      pageCount: reportedPageCount || 1,
      wordCount: 0,
      characterCount: 0
    };
  }

  // 7. Return structured successful extraction result
  return {
    success: true,
    text: sanitizedText,
    format,
    pageCount: metrics.pageCount,
    wordCount: metrics.wordCount,
    characterCount: metrics.characterCount,
    preview: sanitizedText.length > 300 ? sanitizedText.slice(0, 300) + '...' : sanitizedText
  };
}

module.exports = {
  extractDocumentText,
  computeMetrics,
  SUPPORTED_EXTENSIONS
};
