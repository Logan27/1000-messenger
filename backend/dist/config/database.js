"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPool = exports.pool = void 0;
exports.testConnection = testConnection;
exports.closeConnections = closeConnections;
const pg_1 = require("pg");
const env_1 = require("./env");
const logger_util_1 = require("../utils/logger.util");
exports.pool = new pg_1.Pool({
    connectionString: env_1.config.DATABASE_URL,
    max: 100,
    min: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    application_name: 'chat-backend-primary',
});
exports.readPool = new pg_1.Pool({
    connectionString: env_1.config.DATABASE_REPLICA_URL || env_1.config.DATABASE_URL,
    max: 50,
    min: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    application_name: 'chat-backend-replica',
});
exports.pool.on('error', err => {
    logger_util_1.logger.error('Unexpected database error', err);
});
exports.readPool.on('error', err => {
    logger_util_1.logger.error('Unexpected read replica error', err);
});
async function testConnection() {
    try {
        await exports.pool.query('SELECT 1');
        logger_util_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_util_1.logger.error('Database connection failed', error);
        return false;
    }
}
async function closeConnections() {
    await Promise.all([exports.pool.end(), exports.readPool.end()]);
    logger_util_1.logger.info('Database connections closed');
}
//# sourceMappingURL=database.js.map