import { Pool, PoolConfig, QueryResult } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger.util';

/**
 * Database Configuration with Connection Pooling
 *
 * This module provides PostgreSQL connection pools optimized for:
 * - 1,000 concurrent users
 * - 50 messages/second sustained (100 msg/sec spikes)
 * - <100ms average latency (p95 <300ms, p99 <500ms)
 *
 * Architecture:
 * - Primary pool: Write operations and transactions
 * - Read replica pool: Read-heavy operations for horizontal scaling
 */

// Base pool configuration
const basePoolConfig: Partial<PoolConfig> = {
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Fail fast on connection timeout
  // Query timeout to prevent runaway queries affecting p95/p99 latency
  statement_timeout: 5000, // 5 second query timeout
  // SSL configuration for production
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
};

// Primary database pool for writes and transactions
export const pool = new Pool({
  ...basePoolConfig,
  connectionString: config.DATABASE_URL,
  max: 100, // Maximum connections for write operations
  min: 20, // Minimum idle connections to maintain
  application_name: 'chat-backend-primary',
});

// Read replica pool for read-heavy operations
export const readPool = new Pool({
  ...basePoolConfig,
  connectionString: config.DATABASE_REPLICA_URL || config.DATABASE_URL,
  max: 50, // Lower max for read operations
  min: 10, // Lower min for read replicas
  application_name: 'chat-backend-replica',
});

// Pool monitoring and error handling
pool.on('error', (err, client) => {
  logger.error('Unexpected error on primary pool client', {
    error: err.message,
    stack: err.stack,
    clientInfo: client ? 'Active client' : 'Idle client',
  });
});

readPool.on('error', (err, client) => {
  logger.error('Unexpected error on read replica pool client', {
    error: err.message,
    stack: err.stack,
    clientInfo: client ? 'Active client' : 'Idle client',
  });
});

pool.on('connect', () => {
  logger.debug('New client connected to primary pool');
});

readPool.on('connect', () => {
  logger.debug('New client connected to read replica pool');
});

pool.on('remove', () => {
  logger.debug('Client removed from primary pool');
});

readPool.on('remove', () => {
  logger.debug('Client removed from read replica pool');
});

/**
 * Test database connections for both primary and replica
 * @returns Promise that resolves to true if both connections succeed
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Test primary connection
    const primaryResult = await pool.query('SELECT 1 as test, current_database() as db, version()');
    logger.info('Primary database connection successful', {
      database: primaryResult.rows[0].db,
      version: primaryResult.rows[0].version.split(' ')[1],
    });

    // Test read replica connection
    const replicaResult = await readPool.query('SELECT 1 as test, current_database() as db');
    logger.info('Read replica connection successful', {
      database: replicaResult.rows[0].db,
      isReplica: config.DATABASE_REPLICA_URL ? true : false,
    });

    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Get connection pool statistics for monitoring
 * @returns Pool statistics for primary and replica pools
 */
export function getPoolStats() {
  return {
    primary: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
    replica: {
      totalCount: readPool.totalCount,
      idleCount: readPool.idleCount,
      waitingCount: readPool.waitingCount,
    },
  };
}

/**
 * Execute a query with automatic retry logic for transient failures
 * @param queryText SQL query text
 * @param values Query parameters
 * @param useReadPool Whether to use read replica (default: false)
 * @param maxRetries Maximum retry attempts (default: 3)
 * @returns Query result
 */
export async function queryWithRetry(
  queryText: string,
  values?: any[],
  useReadPool = false,
  maxRetries = 3
): Promise<QueryResult> {
  const targetPool = useReadPool ? readPool : pool;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await targetPool.query(queryText, values);
    } catch (error) {
      lastError = error as Error;

      // Only retry on connection errors, not query errors
      const isConnectionError =
        lastError.message.includes('connection') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('ECONNREFUSED');

      if (!isConnectionError || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const backoffMs = 100 * Math.pow(2, attempt - 1);
      logger.warn(`Query failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`, {
        error: lastError.message,
      });
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

/**
 * Check if read replica is healthy and in sync
 * @returns Promise that resolves to true if replica is healthy
 */
export async function checkReplicaHealth(): Promise<boolean> {
  if (!config.DATABASE_REPLICA_URL) {
    return true; // No replica configured, skip check
  }

  try {
    // Check if replica is accepting queries
    await readPool.query('SELECT 1');

    // Check replication lag (PostgreSQL specific)
    const result = await readPool.query(`
      SELECT 
        CASE WHEN pg_is_in_recovery() THEN
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
        ELSE 
          0
        END as lag_seconds
    `);

    const lagSeconds = parseFloat(result.rows[0]?.lag_seconds || '0');

    if (lagSeconds > 10) {
      logger.warn('Read replica lag detected', { lagSeconds });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Read replica health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Gracefully close all database connections
 * Waits for active queries to complete before closing
 */
export async function closeConnections(): Promise<void> {
  logger.info('Closing database connections...');

  try {
    // End both pools in parallel
    await Promise.all([pool.end(), readPool.end()]);

    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
