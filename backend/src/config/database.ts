import { Pool } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger.util';

// Primary database pool
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 100, // Maximum connections
  min: 20,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'chat-backend-primary',
});

// Read replica pool (for read-heavy operations)
export const readPool = new Pool({
  connectionString: config.DATABASE_REPLICA_URL || config.DATABASE_URL,
  max: 50,
  min: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'chat-backend-replica',
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

readPool.on('error', (err) => {
  logger.error('Unexpected read replica error', err);
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  await Promise.all([
    pool.end(),
    readPool.end(),
  ]);
  logger.info('Database connections closed');
}
