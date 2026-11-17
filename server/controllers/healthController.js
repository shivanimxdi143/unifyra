const mongoose = require('mongoose');

/**
 * Maps Mongoose readyState integer to human-readable string
 */
const readyStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * @route   GET /api/health
 * @desc    Get server and database operational health status
 * @access  Public
 */
const getHealthStatus = (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbStatus = readyStateMap[readyState] || 'unknown';
  const isDbConnected = readyState === 1;

  const healthData = {
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'Unifyra Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      readyState: readyState,
      name: mongoose.connection.name || null
    }
  };

  // Return 200 even if database is connecting/disconnected, with degraded status indication
  res.status(200).json(healthData);
};

module.exports = {
  getHealthStatus
};
