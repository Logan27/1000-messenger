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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerUrl = exports.isTest = exports.isDevelopment = exports.isProduction = exports.JWT_CONFIG = exports.config = void 0;
const dotenv = __importStar(require("dotenv"));
const zod_1 = require("zod");
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development')
        .describe('Node environment'),
    PORT: zod_1.z
        .string()
        .regex(/^\d+$/, 'PORT must be a valid number')
        .default('3000')
        .transform(Number)
        .describe('Server port'),
    DATABASE_URL: zod_1.z
        .string()
        .url('DATABASE_URL must be a valid PostgreSQL connection URL')
        .startsWith('postgresql://', 'DATABASE_URL must start with postgresql://')
        .describe('Primary PostgreSQL database connection URL'),
    DATABASE_REPLICA_URL: zod_1.z
        .string()
        .url('DATABASE_REPLICA_URL must be a valid PostgreSQL connection URL')
        .startsWith('postgresql://', 'DATABASE_REPLICA_URL must start with postgresql://')
        .optional()
        .describe('Optional read replica database connection URL'),
    REDIS_URL: zod_1.z
        .string()
        .regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://')
        .describe('Redis connection URL for caching and pub/sub'),
    S3_ENDPOINT: zod_1.z
        .string()
        .url('S3_ENDPOINT must be a valid URL')
        .describe('S3/MinIO endpoint URL'),
    S3_ACCESS_KEY: zod_1.z
        .string()
        .min(1, 'S3_ACCESS_KEY is required')
        .describe('S3/MinIO access key'),
    S3_SECRET_KEY: zod_1.z
        .string()
        .min(1, 'S3_SECRET_KEY is required')
        .describe('S3/MinIO secret key'),
    S3_BUCKET: zod_1.z
        .string()
        .min(3, 'S3_BUCKET must be at least 3 characters')
        .max(63, 'S3_BUCKET must not exceed 63 characters')
        .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, 'S3_BUCKET must contain only lowercase letters, numbers, dots, and hyphens')
        .describe('S3/MinIO bucket name for storing files'),
    S3_PUBLIC_URL: zod_1.z
        .string()
        .url('S3_PUBLIC_URL must be a valid URL')
        .optional()
        .describe('Public URL for accessing stored files (CDN or S3 endpoint)'),
    AWS_REGION: zod_1.z
        .string()
        .default('us-east-1')
        .describe('AWS region for S3 (also used by MinIO for compatibility)'),
    JWT_SECRET: zod_1.z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters for security')
        .refine((val) => val !== 'your-super-secret-jwt-key-min-32-characters-long', 'JWT_SECRET must be changed from the example value in production')
        .describe('Secret key for signing access tokens (expires in 15 minutes)'),
    JWT_REFRESH_SECRET: zod_1.z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security')
        .refine((val) => val !== 'your-super-secret-refresh-key-min-32-characters', 'JWT_REFRESH_SECRET must be changed from the example value in production')
        .describe('Secret key for signing refresh tokens (expires in 7 days)'),
    FRONTEND_URL: zod_1.z
        .string()
        .url('FRONTEND_URL must be a valid URL')
        .default('http://localhost:5173')
        .describe('Frontend application URL for CORS configuration'),
    ENABLE_METRICS: zod_1.z
        .string()
        .transform((val) => val.toLowerCase() === 'true')
        .default('true')
        .describe('Enable Prometheus metrics endpoint'),
    LOG_LEVEL: zod_1.z
        .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
        .default('info')
        .describe('Winston logging level'),
}).refine((data) => data.JWT_SECRET !== data.JWT_REFRESH_SECRET, {
    message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different for security',
    path: ['JWT_REFRESH_SECRET'],
});
let config;
try {
    exports.config = config = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
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
exports.JWT_CONFIG = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000,
    REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
};
const isProduction = () => config.NODE_ENV === 'production';
exports.isProduction = isProduction;
const isDevelopment = () => config.NODE_ENV === 'development';
exports.isDevelopment = isDevelopment;
const isTest = () => config.NODE_ENV === 'test';
exports.isTest = isTest;
const getServerUrl = () => {
    const protocol = (0, exports.isProduction)() ? 'https' : 'http';
    const host = (0, exports.isProduction)() ? 'api.example.com' : 'localhost';
    return `${protocol}://${host}:${config.PORT}`;
};
exports.getServerUrl = getServerUrl;
//# sourceMappingURL=env.js.map