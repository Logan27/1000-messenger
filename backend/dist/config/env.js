"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3000'),
    DATABASE_URL: zod_1.z.string(),
    DATABASE_REPLICA_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string(),
    S3_ENDPOINT: zod_1.z.string(),
    S3_ACCESS_KEY: zod_1.z.string(),
    S3_SECRET_KEY: zod_1.z.string(),
    S3_BUCKET: zod_1.z.string(),
    S3_PUBLIC_URL: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().default('us-east-1'),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    ENABLE_METRICS: zod_1.z.string().default('true'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});
exports.config = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map