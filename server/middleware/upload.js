const path = require('path');
const multer = require('multer');

// Memory storage to avoid writing temporary files to local disk in production
const storage = multer.memoryStorage();

// Allowed MIME types and sizes
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB for image creatives

const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
  'application/x-zip-compressed',
  'application/zip',
  'text/plain'
];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB for documents

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Reject legacy .doc format with clear structured feedback
  if (ext === '.doc' || mime === 'application/msword') {
    const error = new Error('Legacy Word format (.doc) is not supported. Please save or export your document as .docx or .pdf before uploading.');
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    return cb(error, false);
  }

  const isImageExt = ['.png', '.jpg', '.jpeg'].includes(ext);
  const isImageMime = ALLOWED_MIME_TYPES.includes(mime);

  const isDocExt = ALLOWED_DOCUMENT_EXTENSIONS.includes(ext);
  const isDocMime = ALLOWED_DOCUMENT_MIME_TYPES.includes(mime);

  // Field: image
  if (file.fieldname === 'image') {
    if (isImageMime && isImageExt) {
      return cb(null, true);
    }
    const error = new Error(`Unsupported image type '${file.mimetype}'. Only PNG, JPG, and JPEG images are allowed.`);
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    return cb(error, false);
  }

  // Field: document
  if (file.fieldname === 'document') {
    if (isDocExt && (isDocMime || isDocExt)) {
      return cb(null, true);
    }
    const error = new Error(`Unsupported document type '${file.mimetype || ext}'. Only PDF (.pdf) and Word (.docx) documents are allowed.`);
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    return cb(error, false);
  }

  // Field: file (general upload)
  if ((isImageMime && isImageExt) || (isDocExt && isDocMime) || isDocExt) {
    return cb(null, true);
  }

  const error = new Error(`Unsupported file type '${file.mimetype || ext}'. Only PDF (.pdf), Word (.docx) documents and PNG, JPG images are allowed.`);
  error.code = 'INVALID_FILE_TYPE';
  error.statusCode = 400;
  return cb(error, false);
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE, // 10 MB maximum ceiling
    files: 2
  },
  fileFilter
});

/**
 * Express middleware wrapper to catch Multer errors cleanly and return structured JSON
 */
const handleUpload = (req, res, next) => {
  multerInstance.fields([
    { name: 'image', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'File size exceeds allowed limit (10 MB for documents, 5 MB for images).',
            code: 'FILE_TOO_LARGE'
          }
        });
      }
      if (err.code === 'INVALID_FILE_TYPE' || err.statusCode === 400) {
        return res.status(400).json({
          success: false,
          error: {
            message: err.message,
            code: 'INVALID_FILE_TYPE'
          }
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          message: `Upload processing error: ${err.message}`,
          code: 'UPLOAD_ERROR'
        }
      });
    }

    // Normalize attached files onto req object
    if (req.files?.image?.[0]) {
      req.file = req.files.image[0];
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Image file size exceeds the 5 MB limit. Please compress or choose a smaller image.',
            code: 'FILE_TOO_LARGE'
          }
        });
      }
    }

    if (req.files?.document?.[0]) {
      req.documentFile = req.files.document[0];
      if (req.documentFile.size > MAX_DOCUMENT_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Document file size exceeds the 10 MB limit. Please upload a smaller document.',
            code: 'FILE_TOO_LARGE'
          }
        });
      }
    }

    if (req.files?.file?.[0]) {
      const f = req.files.file[0];
      const ext = path.extname(f.originalname || '').toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        req.file = f;
        if (req.file.size > MAX_FILE_SIZE) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Image file size exceeds the 5 MB limit. Please compress or choose a smaller image.',
              code: 'FILE_TOO_LARGE'
            }
          });
        }
      } else {
        req.documentFile = f;
        if (req.documentFile.size > MAX_DOCUMENT_FILE_SIZE) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Document file size exceeds the 10 MB limit. Please upload a smaller document.',
              code: 'FILE_TOO_LARGE'
            }
          });
        }
      }
    }

    next();
  });
};

module.exports = {
  handleUpload,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE
};
