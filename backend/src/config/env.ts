/**
 * Environment Variables Configuration
 * 
 * This module loads and validates all environment variables required by the application.
 * Uses Zod for type-safe validation with descriptive error messages.
 * 
 * All environment variables must be defined in .env file (copy from env.example)
 * 
 * @module config/env
 */

import * as dotenv from 'dotenv';
import { z } from 'zod';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env') });

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // -----------------------------------------------------------------------------
  // Application Settings
  // -----------------------------------------------------------------------------
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node environment'),
  
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a valid number')
    .default('3000')
    .transform(Number)
    .describe('Server port'),

  // -----------------------------------------------------------------------------
  // Database - PostgreSQL
  // -----------------------------------------------------------------------------
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection URL')
    .startsWith('postgresql://', 'DATABASE_URL must start with postgresql://')
    .describe('Primary PostgreSQL database connection URL'),
  
  DATABASE_REPLICA_URL: z
    .string()
    .url('DATABASE_REPLICA_URL must be a valid PostgreSQL connection URL')
    .startsWith('postgresql://', 'DATABASE_REPLICA_URL must start with postgresql://')
    .optional()
    .describe('Optional read replica database connection URL'),

  // -----------------------------------------------------------------------------
  // Cache & Pub/Sub - Redis
  // -----------------------------------------------------------------------------
  REDIS_URL: z
    .string()
    .regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://')
    .describe('Redis connection URL for caching and pub/sub'),

  // -----------------------------------------------------------------------------
  // Object Storage - S3/MinIO
  // -----------------------------------------------------------------------------
  S3_ENDPOINT: z
    .string()
    .url('S3_ENDPOINT must be a valid URL')
    .describe('S3/MinIO endpoint URL'),
  
  S3_ACCESS_KEY: z
    .string()
    .min(1, 'S3_ACCESS_KEY is required')
    .describe('S3/MinIO access key'),
  
  S3_SECRET_KEY: z
    .string()
    .min(1, 'S3_SECRET_KEY is required')
    .describe('S3/MinIO secret key'),
  
  S3_BUCKET: z
    .string()
    .min(3, 'S3_BUCKET must be at least 3 characters')
    .max(63, 'S3_BUCKET must not exceed 63 characters')
    .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, 'S3_BUCKET must contain only lowercase letters, numbers, dots, and hyphens')
    .describe('S3/MinIO bucket name for storing files'),
  
  S3_PUBLIC_URL: z
    .string()
    .url('S3_PUBLIC_URL must be a valid URL')
    .optional()
    .describe('Public URL for accessing stored files (CDN or S3 endpoint)'),
  
  AWS_REGION: z
    .string()
    .default('us-east-1')
    .describe('AWS region for S3 (also used by MinIO for compatibility)'),

  // -----------------------------------------------------------------------------
  // Authentication & Security - JWT
  // -----------------------------------------------------------------------------
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .refine(
      (val) => val !== 'your-super-secret-jwt-key-min-32-characters-long',
      'JWT_SECRET must be changed from the example value in production'
    )
    .describe('Secret key for signing access tokens (expires in 15 minutes)'),
  
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security')
    .refine(
      (val) => val !== 'your-super-secret-refresh-key-min-32-characters',
      'JWT_REFRESH_SECRET must be changed from the example value in production'
    )
    .describe('Secret key for signing refresh tokens (expires in 7 days)'),

  // -----------------------------------------------------------------------------
  // CORS Configuration
  // -----------------------------------------------------------------------------
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid URL')
    .default('http://localhost:5173')
    .describe('Frontend application URL for CORS configuration'),

  // -----------------------------------------------------------------------------
  // Monitoring & Logging
  // -----------------------------------------------------------------------------
  ENABLE_METRICS: z
    .string()
    .transform((val) => val.toLowerCase() === 'true')
    .default('true')
    .describe('Enable Prometheus metrics endpoint'),
  
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info')
    .describe('Winston logging level'),
}).refine(
  (data) => data.JWT_SECRET !== data.JWT_REFRESH_SECRET,
  {
    message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different for security',
    path: ['JWT_REFRESH_SECRET'],
  }
);

/**
 * Validated environment variables
 * 
 * This object is the single source of truth for all environment configuration.
 * All values are validated and transformed according to the schema.
 * 
 * @throws {ZodError} If any environment variable fails validation
 */
let config: z.infer<typeof envSchema>;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment variable validation failed:');
    console.error('');
    
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      console.error(`  ${path}: ${err.message}`);
    });
    
    console.error('');
    console.error('💡 Please check your .env file and ensure all required variables are set correctly.');
    console.error('   See env.example for reference.');
    console.error('');
    
    process.exit(1);
  }
  
  throw error;
}

export { config };

/**
 * Type of the validated configuration object
 * Useful for type checking in other modules
 */
export type Config = z.infer<typeof envSchema>;

/**
 * JWT configuration constants
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',    // 15 minutes
  REFRESH_TOKEN_EXPIRY: '7d',     // 7 days
  ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000,      // 15 minutes in milliseconds
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
} as const;

/**
 * Helper function to check if running in production
 */
export const isProduction = (): boolean => config.NODE_ENV === 'production';

/**
 * Helper function to check if running in development
 */
export const isDevelopment = (): boolean => config.NODE_ENV === 'development';

/**
 * Helper function to check if running in test environment
 */
export const isTest = (): boolean => config.NODE_ENV === 'test';

/**
 * Get the server URL based on configuration
 */
export const getServerUrl = (): string => {
  const protocol = isProduction() ? 'https' : 'http';
  const host = isProduction() ? 'api.example.com' : 'localhost';
  return `${protocol}://${host}:${config.PORT}`;
};
