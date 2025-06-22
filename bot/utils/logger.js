const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'TechMoneyBot' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat
    }),

    // Daily rotating file
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  ],

  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat
    })
  ],

  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug'
    })
  );
}

// Custom logging methods for specific bot events
logger.botEvent = (event, data = {}) => {
  logger.info(`Bot Event: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

logger.apiCall = (service, endpoint, duration, success = true, error = null) => {
  const level = success ? 'info' : 'error';
  logger[level](`API Call: ${service}/${endpoint}`, {
    service,
    endpoint,
    duration,
    success,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });
};

logger.userAction = (userId, action, data = {}) => {
  logger.info(`User Action: ${action}`, {
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...data
  });
};

logger.searchEvent = (platform, query, results, duration) => {
  logger.info(`Search Event: ${platform}`, {
    platform,
    query: query.substring(0, 100), // Truncate long queries
    resultsCount: results,
    duration,
    timestamp: new Date().toISOString()
  });
};

logger.proposalEvent = (platform, projectId, action, data = {}) => {
  logger.info(`Proposal Event: ${action}`, {
    platform,
    projectId,
    action,
    timestamp: new Date().toISOString(),
    ...data
  });
};

logger.errorWithContext = (error, context = {}) => {
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: new Date().toISOString()
  });
};

logger.performance = (operation, duration, metadata = {}) => {
  logger.debug(`Performance: ${operation}`, {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

logger.security = (event, userId, details = {}) => {
  logger.warn(`Security Event: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    ...details
  });
};

logger.rateLimitHit = (userId, endpoint, limit, windowMs) => {
  logger.warn('Rate limit exceeded', {
    userId,
    endpoint,
    limit,
    windowMs,
    timestamp: new Date().toISOString()
  });
};

logger.cronJob = (jobName, status, duration = null, error = null) => {
  const level = status === 'success' ? 'info' : 'error';
  logger[level](`Cron Job: ${jobName}`, {
    jobName,
    status,
    duration,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });
};

// Middleware for Express.js (if needed)
logger.requestMiddleware = () => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    });

    next();
  };
};

// Stream for Morgan HTTP logger
logger.stream = {
  write: message => {
    logger.info(message.trim());
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  logger.end();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  logger.end();
});

module.exports = logger;
