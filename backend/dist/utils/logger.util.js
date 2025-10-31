"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurity = exports.logWebSocket = exports.logQuery = exports.logRequest = exports.createChildLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
const productionFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }), winston_1.default.format.json());
const developmentFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${service}] ${level}: ${message}`;
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
        const filteredMeta = Object.entries(meta).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && !(typeof value === 'object' && Object.keys(value).length === 0)) {
                acc[key] = value;
            }
            return acc;
        }, {});
        if (Object.keys(filteredMeta).length > 0) {
            log += `\n${JSON.stringify(filteredMeta, null, 2)}`;
        }
    }
    return log;
}));
const fileTransportOptions = {
    maxsize: 10485760,
    maxFiles: 14,
    tailable: true,
    format: productionFormat,
};
exports.logger = winston_1.default.createLogger({
    level: env_1.config.LOG_LEVEL || 'info',
    format: productionFormat,
    defaultMeta: {
        service: 'chat-backend',
        env: env_1.config.NODE_ENV,
    },
    transports: [
        new winston_1.default.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            ...fileTransportOptions,
        }),
        new winston_1.default.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            ...fileTransportOptions,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            ...fileTransportOptions,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            ...fileTransportOptions,
        }),
    ],
    exitOnError: false,
});
if (env_1.config.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: developmentFormat,
    }));
    exports.logger.exceptions.handle(new winston_1.default.transports.Console({
        format: developmentFormat,
    }));
    exports.logger.rejections.handle(new winston_1.default.transports.Console({
        format: developmentFormat,
    }));
}
if (env_1.config.NODE_ENV === 'test') {
    exports.logger.transports.forEach((transport) => {
        transport.silent = true;
    });
}
const createChildLogger = (metadata) => {
    return exports.logger.child(metadata);
};
exports.createChildLogger = createChildLogger;
const logRequest = (method, url, statusCode, duration, metadata) => {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
    exports.logger.log(level, `${method} ${url} ${statusCode} - ${duration}ms`, {
        type: 'http',
        method,
        url,
        statusCode,
        duration,
        ...metadata,
    });
};
exports.logRequest = logRequest;
const logQuery = (query, duration, metadata) => {
    const level = duration > 1000 ? 'warn' : 'debug';
    exports.logger.log(level, `Query executed in ${duration}ms`, {
        type: 'database',
        query: query.substring(0, 100),
        duration,
        ...metadata,
    });
};
exports.logQuery = logQuery;
const logWebSocket = (event, userId, metadata) => {
    exports.logger.debug(`WebSocket: ${event}`, {
        type: 'websocket',
        event,
        userId,
        ...metadata,
    });
};
exports.logWebSocket = logWebSocket;
const logSecurity = (message, metadata) => {
    exports.logger.warn(message, {
        type: 'security',
        ...metadata,
    });
};
exports.logSecurity = logSecurity;
Object.assign(exports.logger, {
    security: exports.logSecurity,
});
exports.default = exports.logger;
//# sourceMappingURL=logger.util.js.map