const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRoutes = require('./routes/healthRoutes');
const guidelineRoutes = require('./routes/guidelineRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting single origin, comma-separated origins, and Vercel preview domains
const allowedOrigins = (process.env.CLIENT_URL || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, health checks, curl, Postman)
    if (!origin) return callback(null, true);

    // If wildcard allowed, allow all
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Check exact origin or Vercel preview domain (*.vercel.app)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      if (allowed.includes('vercel.app') && origin.endsWith('.vercel.app')) {
        return true;
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/guidelines', guidelineRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Not Found handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
