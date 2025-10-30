/**
 * Logger Utility using Winston
 * 
 * Provides structured logging for the chat backend with:
 * - Multiple log levels (error, warn, info, http, verbose, debug, silly)
 * - File rotation for production logs
 * - Console logging for development
 * - Request tracing support
 * - Error stack trace capture
 * - JSON structured logging for production
 * - Human-readable colorized logs for development
 * 
 * Usage:
 * ```typescript
 * import { logger } from './utils/logger.util';
 * 
 * logger.info('User logged in', { userId, username });
 * logger.error('Database connection failed', error);
 * logger.debug('Query executed', { query, duration });
 * ```
 * 
 * @module utils/logger
 */

import winston from 'winston';
import { config } from '../config/env';
import * as fs from 'fs';
import * as path from 'path';

// Ensure logs directory exists
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for production: JSON with timestamp and error details
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
  winston.format.json()
);

/**
 * Custom format for development: Colorized with readable formatting
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${service}] ${level}: ${message}`;
    
    // Add metadata if present
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      // Filter out empty objects and undefined values
      const filteredMeta = Object.entries(meta).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && !(typeof value === 'object' && Object.keys(value).length === 0)) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      if (Object.keys(filteredMeta).length > 0) {
        log += `\n${JSON.stringify(filteredMeta, null, 2)}`;
      }
    }
    
    return log;
  })
);

/**
 * File transport configuration with rotation
 * Logs are rotated daily and kept for 14 days
 */
const fileTransportOptions = {
  maxsize: 10485760, // 10MB
  maxFiles: 14, // Keep 14 days of logs
  tailable: true,
  format: productionFormat,
};

/**
 * Main Winston logger instance
 * 
 * Configured with appropriate transports based on environment:
 * - Production: File-based logging with JSON format
 * - Development: Console logging with colorized output
 * - Test: Minimal logging to avoid test output noise
 */
export const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: productionFormat,
  defaultMeta: { 
    service: 'chat-backend',
    env: config.NODE_ENV,
  },
  transports: [
    // Error log: Only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      ...fileTransportOptions,
    }),
    
    // Combined log: All levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      ...fileTransportOptions,
    }),
  ],
  
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      ...fileTransportOptions,
    }),
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      ...fileTransportOptions,
    }),
  ],
  
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Add console transport for non-production environments
 * Uses colorized, human-readable format
 */
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: developmentFormat,
  }));
  
  // Also log exceptions to console in development
  logger.exceptions.handle(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
  
  logger.rejections.handle(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
}

/**
 * Suppress logging during tests to avoid cluttering test output
 */
if (config.NODE_ENV === 'test') {
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

/**
 * Create a child logger with additional default metadata
 * 
 * Useful for adding context-specific information to all logs
 * from a particular module or request.
 * 
 * @param metadata - Additional metadata to include in all logs
 * @returns Child logger instance
 * 
 * @example
 * ```typescript
 * const requestLogger = createChildLogger({ requestId: 'abc-123' });
 * requestLogger.info('Processing request'); // Includes requestId in metadata
 * ```
 */
export const createChildLogger = (metadata: Record<string, any>) => {
  return logger.child(metadata);
};

/**
 * Log an HTTP request
 * 
 * Helper function to log HTTP requests with consistent formatting
 * 
 * @param method - HTTP method
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param duration - Request duration in milliseconds
 * @param metadata - Additional metadata
 * 
 * @example
 * ```typescript
 * logRequest('GET', '/api/users', 200, 45, { userId: '123' });
 * ```
 */
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  
  logger.log(level, `${method} ${url} ${statusCode} - ${duration}ms`, {
    type: 'http',
    method,
    url,
    statusCode,
    duration,
    ...metadata,
  });
};

/**
 * Log a database query
 * 
 * Helper function to log database queries for performance monitoring
 * 
 * @param query - SQL query or operation name
 * @param duration - Query duration in milliseconds
 * @param metadata - Additional metadata
 * 
 * @example
 * ```typescript
 * logQuery('SELECT * FROM users WHERE id = $1', 12, { userId: '123' });
 * ```
 */
export const logQuery = (
  query: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  
  logger.log(level, `Query executed in ${duration}ms`, {
    type: 'database',
    query: query.substring(0, 100), // Truncate long queries
    duration,
    ...metadata,
  });
};

/**
 * Log a WebSocket event
 * 
 * Helper function to log WebSocket events with consistent formatting
 * 
 * @param event - Event name
 * @param userId - User ID associated with the event
 * @param metadata - Additional metadata
 * 
 * @example
 * ```typescript
 * logWebSocket('message:send', '123', { chatId: '456', messageId: '789' });
 * ```
 */
export const logWebSocket = (
  event: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  logger.debug(`WebSocket: ${event}`, {
    type: 'websocket',
    event,
    userId,
    ...metadata,
  });
};

// Export the logger as default
export default logger;
