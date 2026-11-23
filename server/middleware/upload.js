const multer = require('multer');

// Memory storage to avoid writing temporary files to local disk in production
const storage = multer.memoryStorage();

// Allowed MIME types: PNG, JPG, JPEG
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported image type '${file.mimetype}'. Only PNG, JPG, and JPEG images are allowed.`);
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    cb(error, false);
  }
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
});

/**
 * Express middleware wrapper to catch Multer errors cleanly and return structured JSON
 */
const handleUpload = (req, res, next) => {
  multerInstance.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Image file size exceeds the 5 MB limit. Please compress or choose a smaller image.',
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
    next();
  });
};

module.exports = {
  handleUpload,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
