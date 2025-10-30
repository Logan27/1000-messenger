"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_CONFIG = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("./env");
exports.s3Client = new client_s3_1.S3Client({
    region: env_1.config.AWS_REGION,
    endpoint: env_1.config.S3_ENDPOINT,
    credentials: {
        accessKeyId: env_1.config.S3_ACCESS_KEY,
        secretAccessKey: env_1.config.S3_SECRET_KEY,
    },
    forcePathStyle: true,
});
exports.S3_CONFIG = {
    bucket: env_1.config.S3_BUCKET,
    region: env_1.config.AWS_REGION,
    publicUrl: env_1.config.S3_PUBLIC_URL,
};
//# sourceMappingURL=storage.js.map