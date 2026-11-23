/**
 * In-Memory Media Store
 * 
 * Safe demo-compatible image buffer store for active review and Gemini multimodal analysis.
 * Avoids storing large binary blobs in MongoDB or writing temporary local disk files in production.
 *
 * NOTE / DEMO LIMITATION:
 * This in-memory store retains uploaded image creative buffers for the duration of the server runtime
 * (with an LRU cap of 50 items to protect memory). Persistent production archiving would integrate an
 * enterprise object store (such as AWS S3 or Google Cloud Storage).
 */

const MAX_STORED_ASSETS = 50;

class MediaStore {
  constructor() {
    this.store = new Map();
  }

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

  /**
   * Remove cached image
   * @param {string} submissionId 
   */
  delete(submissionId) {
    if (!submissionId) return;
    this.store.delete(submissionId.toString());
  }

  /**
   * Clear all items (useful for test resets)
   */
  clear() {
    this.store.clear();
  }
}

// Export singleton instance
const mediaStore = new MediaStore();
module.exports = mediaStore;
