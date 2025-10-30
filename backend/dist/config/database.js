"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPool = exports.pool = void 0;
exports.testConnection = testConnection;
exports.getPoolStats = getPoolStats;
exports.queryWithRetry = queryWithRetry;
exports.checkReplicaHealth = checkReplicaHealth;
exports.closeConnections = closeConnections;
const pg_1 = require("pg");
const env_1 = require("./env");
const logger_util_1 = require("../utils/logger.util");
const basePoolConfig = {
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statement_timeout: 5000,
    ssl: env_1.config.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
};
exports.pool = new pg_1.Pool({
    ...basePoolConfig,
    connectionString: env_1.config.DATABASE_URL,
    max: 100,
    min: 20,
    application_name: 'chat-backend-primary',
});
exports.readPool = new pg_1.Pool({
    ...basePoolConfig,
    connectionString: env_1.config.DATABASE_REPLICA_URL || env_1.config.DATABASE_URL,
    max: 50,
    min: 10,
    application_name: 'chat-backend-replica',
});
exports.pool.on('error', (err, client) => {
    logger_util_1.logger.error('Unexpected error on primary pool client', {
        error: err.message,
        stack: err.stack,
        clientInfo: client ? 'Active client' : 'Idle client',
    });
});
exports.readPool.on('error', (err, client) => {
    logger_util_1.logger.error('Unexpected error on read replica pool client', {
        error: err.message,
        stack: err.stack,
        clientInfo: client ? 'Active client' : 'Idle client',
    });
});
exports.pool.on('connect', () => {
    logger_util_1.logger.debug('New client connected to primary pool');
});
exports.readPool.on('connect', () => {
    logger_util_1.logger.debug('New client connected to read replica pool');
});
exports.pool.on('remove', () => {
    logger_util_1.logger.debug('Client removed from primary pool');
});
exports.readPool.on('remove', () => {
    logger_util_1.logger.debug('Client removed from read replica pool');
});
async function testConnection() {
    try {
        const primaryResult = await exports.pool.query('SELECT 1 as test, current_database() as db, version()');
        logger_util_1.logger.info('Primary database connection successful', {
            database: primaryResult.rows[0].db,
            version: primaryResult.rows[0].version.split(' ')[1],
        });
        const replicaResult = await exports.readPool.query('SELECT 1 as test, current_database() as db');
        logger_util_1.logger.info('Read replica connection successful', {
            database: replicaResult.rows[0].db,
            isReplica: env_1.config.DATABASE_REPLICA_URL ? true : false,
        });
        return true;
    }
    catch (error) {
        logger_util_1.logger.error('Database connection failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return false;
    }
}
function getPoolStats() {
    return {
        primary: {
            totalCount: exports.pool.totalCount,
            idleCount: exports.pool.idleCount,
            waitingCount: exports.pool.waitingCount,
        },
        replica: {
            totalCount: exports.readPool.totalCount,
            idleCount: exports.readPool.idleCount,
            waitingCount: exports.readPool.waitingCount,
        },
    };
}
async function queryWithRetry(queryText, values, useReadPool = false, maxRetries = 3) {
    const targetPool = useReadPool ? exports.readPool : exports.pool;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await targetPool.query(queryText, values);
        }
        catch (error) {
            lastError = error;
            const isConnectionError = lastError.message.includes('connection') ||
                lastError.message.includes('timeout') ||
                lastError.message.includes('ECONNREFUSED');
            if (!isConnectionError || attempt === maxRetries) {
                throw lastError;
            }
            const backoffMs = 100 * Math.pow(2, attempt - 1);
            logger_util_1.logger.warn(`Query failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`, {
                error: lastError.message,
            });
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }
    throw lastError;
}
async function checkReplicaHealth() {
    if (!env_1.config.DATABASE_REPLICA_URL) {
        return true;
    }
    try {
        await exports.readPool.query('SELECT 1');
        const result = await exports.readPool.query(`
      SELECT 
        CASE WHEN pg_is_in_recovery() THEN
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
        ELSE 
          0
        END as lag_seconds
    `);
        const lagSeconds = parseFloat(result.rows[0]?.lag_seconds || '0');
        if (lagSeconds > 10) {
            logger_util_1.logger.warn('Read replica lag detected', { lagSeconds });
            return false;
        }
        return true;
    }
    catch (error) {
        logger_util_1.logger.error('Read replica health check failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
async function closeConnections() {
    logger_util_1.logger.info('Closing database connections...');
    try {
        await Promise.all([
            exports.pool.end(),
            exports.readPool.end(),
        ]);
        logger_util_1.logger.info('Database connections closed successfully');
    }
    catch (error) {
        logger_util_1.logger.error('Error closing database connections', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
//# sourceMappingURL=database.js.map