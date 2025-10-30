import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_REPLICA_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string(),

  // S3/MinIO
  S3_ENDPOINT: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_PUBLIC_URL: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // CORS
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Monitoring
  ENABLE_METRICS: z.string().default('true'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});

export const config = envSchema.parse(process.env);
