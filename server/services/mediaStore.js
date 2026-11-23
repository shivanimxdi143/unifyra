/**
 * In-Memory Media & Document Store
 *
 * Safe demo-compatible buffer store for active review, image creative auditing,
 * and uploaded document inspection. Avoids storing large binary blobs in MongoDB or
 * writing temporary local disk files in production.
 *
 * NOTE / DEMO LIMITATION:
 * This in-memory store retains uploaded image and document buffers for the duration
 * of the server runtime (with an LRU cap of 50 items each to protect memory).
 * Server restarts clear this cache. Persistent production archiving would integrate an
 * enterprise object store (such as AWS S3 or Google Cloud Storage).
 */

const MAX_STORED_ASSETS = 50;

class MediaStore {
  constructor() {
    this.store = new Map(); // Image creative cache
    this.documentStore = new Map(); // Document file cache
  }

  // ==========================================
  // Image Creative Cache Methods
  // ==========================================

  /**
   * Save an image buffer associated with a submission
   * @param {string} submissionId
   * @param {Object} mediaData
   * @param {Buffer} mediaData.buffer - Raw image bytes
   * @param {string} mediaData.mimeType - MIME type e.g. 'image/png'
   * @param {string} mediaData.originalName - Uploaded file name
   * @param {number} mediaData.size - Byte length
   */
  set(submissionId, mediaData) {
    if (!submissionId || !mediaData || !mediaData.buffer) return;

    const idStr = submissionId.toString();

    // If limit reached, delete oldest entry (first key in insertion order)
    if (this.store.size >= MAX_STORED_ASSETS && !this.store.has(idStr)) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(idStr, {
      buffer: mediaData.buffer,
      mimeType: mediaData.mimeType || 'image/jpeg',
      originalName: mediaData.originalName || 'marketing-creative.jpg',
      size: mediaData.size || mediaData.buffer.length,
      uploadedAt: new Date()
    });
  }

  /**
   * Retrieve cached image data
   * @param {string} submissionId
   * @returns {Object|null}
   */
  get(submissionId) {
    if (!submissionId) return null;
    return this.store.get(submissionId.toString()) || null;
  }

  /**
   * Check if image exists
   * @param {string} submissionId
   * @returns {boolean}
   */
  has(submissionId) {
    if (!submissionId) return false;
    return this.store.has(submissionId.toString());
  }

  // ==========================================
  // Document Cache Methods
  // ==========================================

  /**
   * Save a document buffer associated with a submission
   * @param {string} submissionId
   * @param {Object} docData
   * @param {Buffer} docData.buffer - Raw document bytes
   * @param {string} docData.mimeType - MIME type e.g. 'application/pdf'
   * @param {string} docData.originalName - Uploaded document file name
   * @param {number} docData.size - Byte length
   * @param {string} docData.fileFormat - Document format e.g. 'pdf', 'docx'
   */
  setDocument(submissionId, docData) {
    if (!submissionId || !docData || !docData.buffer) return;

    const idStr = submissionId.toString();

    if (this.documentStore.size >= MAX_STORED_ASSETS && !this.documentStore.has(idStr)) {
      const oldestKey = this.documentStore.keys().next().value;
      this.documentStore.delete(oldestKey);
    }

    this.documentStore.set(idStr, {
      buffer: docData.buffer,
      mimeType: docData.mimeType || 'application/pdf',
      originalName: docData.originalName || 'document.pdf',
      fileFormat: docData.fileFormat || 'pdf',
      size: docData.size || docData.buffer.length,
      uploadedAt: new Date()
    });
  }

  /**
   * Retrieve cached document data
   * @param {string} submissionId
   * @returns {Object|null}
   */
  getDocument(submissionId) {
    if (!submissionId) return null;
    return this.documentStore.get(submissionId.toString()) || null;
  }

  /**
   * Check if document exists in cache
   * @param {string} submissionId
   * @returns {boolean}
   */
  hasDocument(submissionId) {
    if (!submissionId) return false;
    return this.documentStore.has(submissionId.toString());
  }

  /**
   * Remove cached document
   * @param {string} submissionId
   */
  deleteDocument(submissionId) {
    if (!submissionId) return;
    this.documentStore.delete(submissionId.toString());
  }

  // ==========================================
  // Lifecycle & Cleanup
  // ==========================================

  /**
   * Remove all cached media for a submission
   * @param {string} submissionId
   */
  delete(submissionId) {
    if (!submissionId) return;
    const idStr = submissionId.toString();
    this.store.delete(idStr);
    this.documentStore.delete(idStr);
  }

  /**
   * Clear all items across image and document stores
   */
  clear() {
    this.store.clear();
    this.documentStore.clear();
  }
}

// Export singleton instance
const mediaStore = new MediaStore();
module.exports = mediaStore;
