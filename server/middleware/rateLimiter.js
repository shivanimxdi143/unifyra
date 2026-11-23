/**
 * Lightweight in-memory rate limiter for Gemini AI analysis endpoints.
 * Protects Gemini API quota without external Redis dependencies.
 */

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 30; // Max 30 analysis requests per minute per IP

const requestCounts = new Map();

// Periodic cleanup of expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.startTime > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // unref so timer doesn't prevent Node from exiting cleanly

/**
 * Rate limiting middleware for analysis routes
 */
const analysisRateLimiter = (req, res, next) => {
  // Use client IP (respecting reverse proxies like Render / Cloudflare)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(clientIp);

  if (!record || now - record.startTime > WINDOW_MS) {
    // New window
    requestCounts.set(clientIp, {
      count: 1,
      startTime: now
    });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((record.startTime + WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: {
        message: `Too many AI analysis requests. Please wait ${retryAfterSeconds} seconds before trying again to protect Gemini API quotas.`
      }
    });
  }

  record.count += 1;
  next();
};

/**
 * Rate limiting middleware for AI drift refinement suggestions (max 10 requests per minute)
 */
const driftSuggestionLimiter = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const key = `drift_${clientIp}`;
  const now = Date.now();

  const record = requestCounts.get(key);

  if (!record || now - record.startTime > WINDOW_MS) {
    requestCounts.set(key, { count: 1, startTime: now });
    return next();
  }

  if (record.count >= 10) {
    const retryAfterSeconds = Math.ceil((record.startTime + WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: {
        message: `Too many guideline suggestion requests. Please wait ${retryAfterSeconds} seconds before requesting new AI suggestions.`
      }
    });
  }

  record.count += 1;
  next();
};

module.exports = {
  analysisRateLimiter,
  driftSuggestionLimiter
};
