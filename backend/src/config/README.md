# Backend Configuration

This directory contains all configuration modules for the backend application.

## Configuration Modules

### env.ts
Environment variable configuration using Zod schema validation.

**Environment Variables:**
- `NODE_ENV`: Application environment (development, production, test)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_REPLICA_URL`: Optional read replica connection string
- `REDIS_URL`: Redis connection string
- `S3_ENDPOINT`: MinIO/S3 endpoint URL
- `S3_ACCESS_KEY`: Storage access key
- `S3_SECRET_KEY`: Storage secret key
- `S3_BUCKET`: Storage bucket name
- `S3_PUBLIC_URL`: Public URL for accessing stored files
- `AWS_REGION`: AWS region (default: us-east-1)
- `JWT_SECRET`: JWT secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET`: JWT secret for refresh tokens (min 32 chars)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `ENABLE_METRICS`: Enable Prometheus metrics (default: true)
- `LOG_LEVEL`: Logging level (default: info)

### database.ts
PostgreSQL connection pool configuration.

**Features:**
- Primary database pool (100 max connections)
- Read replica pool (50 max connections)
- Connection health checking
- Graceful shutdown support
- Error logging

**Usage:**
```typescript
import { pool, readPool, testConnection, closeConnections } from './config/database';

// Write operations
await pool.query('INSERT INTO users...');

// Read operations (uses replica if configured)
await readPool.query('SELECT * FROM users...');

// Health check
const isHealthy = await testConnection();

// Graceful shutdown
await closeConnections();
```

### redis.ts
Redis client configuration for caching, pub/sub, and session storage.

**Features:**
- Main Redis client for general operations
- Pub/Sub clients for WebSocket broadcasting
- Automatic reconnection with exponential backoff
- Connection health checking
- Graceful shutdown support

**Usage:**
```typescript
import { redisClient, redisPubClient, redisSubClient, connectRedis, closeRedis } from './config/redis';

// Initialize
await connectRedis();

// Cache operations
await redisClient.set('key', 'value');
const value = await redisClient.get('key');

// Pub/Sub
await redisPubClient.publish('channel', 'message');
await redisSubClient.subscribe('channel', (message) => {
  console.log(message);
});

// Graceful shutdown
await closeRedis();
```

### storage.ts
MinIO/S3 object storage configuration for image and file uploads.

**Features:**
- S3-compatible client (works with MinIO and AWS S3)
- Automatic bucket creation and verification
- CORS configuration for browser uploads
- Health checking
- Path and size configuration presets
- Storage information reporting

**Configuration:**
```typescript
export const S3_CONFIG = {
  bucket: string,                    // Bucket name
  region: string,                    // AWS region
  publicUrl: string | undefined,     // Public URL for file access
  endpoint: string,                  // S3/MinIO endpoint
  
  // Image storage paths
  paths: {
    images: 'images',                // User-uploaded images
    avatars: 'avatars',              // Profile avatars
    attachments: 'attachments',      // Message attachments
  },
  
  // Image size configurations
  imageSizes: {
    original: { quality: 85, progressive: true },
    medium: { maxWidth: 800, maxHeight: 800, quality: 80 },
    thumbnail: { width: 300, height: 300, quality: 75 },
  },
  
  // URL expiration for signed URLs (seconds)
  signedUrlExpiry: 3600,             // 1 hour
  
  // CORS configuration
  cors: [...],
};
```

**Usage:**
```typescript
import { s3Client, S3_CONFIG, initializeStorage, healthCheck, getStorageInfo } from './config/storage';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize storage (call on server startup)
await initializeStorage();
// - Tests connection
// - Creates bucket if it doesn't exist
// - Configures CORS

// Upload a file
const command = new PutObjectCommand({
  Bucket: S3_CONFIG.bucket,
  Key: 'path/to/file.jpg',
  Body: buffer,
  ContentType: 'image/jpeg',
});
await s3Client.send(command);

// Health check
const health = await healthCheck();
// Returns: { healthy: boolean, message: string }

// Get storage information
const info = getStorageInfo();
// Returns: { type: 'MinIO' | 'S3', bucket, region, endpoint }
```

**MinIO vs AWS S3:**

The configuration automatically detects MinIO vs AWS S3 based on the endpoint:
- MinIO: Endpoint contains 'minio' (e.g., http://localhost:9000)
- AWS S3: Endpoint is AWS S3 URL or doesn't contain 'minio'

Key differences handled automatically:
- `forcePathStyle: true` for MinIO compatibility
- Bucket location constraint only for AWS S3 (not us-east-1)
- CORS configuration may not be supported by all MinIO configurations

**Local Development with MinIO:**
```bash
# Using Docker Compose (see docker-compose.yml)
docker-compose up -d minio

# Access MinIO Console
open http://localhost:9001

# Default credentials (change in production!)
# Username: minioadmin
# Password: minioadmin
```

**Production AWS S3:**
```env
S3_ENDPOINT=https://s3.us-west-2.amazonaws.com
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_BUCKET=your-production-bucket
S3_PUBLIC_URL=https://your-cdn-domain.com  # Optional CDN
AWS_REGION=us-west-2
```

### constants.ts
Application-wide constants for limits, statuses, and enums.

**Categories:**
- `LIMITS`: Size and rate limits
- `MESSAGE_STATUS`: Message delivery states
- `CHAT_TYPE`: Direct vs group chats
- `CONTACT_STATUS`: Contact relationship states
- `USER_STATUS`: Online/offline/away states
- `PARTICIPANT_ROLE`: Chat membership roles

## Initialization Order

The configuration modules must be initialized in the correct order during server startup:

1. **Environment Variables** (`env.ts`) - Loaded automatically via dotenv
2. **Database** (`database.ts`) - Test connection with `testConnection()`
3. **Redis** (`redis.ts`) - Connect with `connectRedis()`
4. **Storage** (`storage.ts`) - Initialize with `initializeStorage()`
5. **Application** - Create Express app and start server

See `src/server.ts` for the complete initialization sequence.

## Health Checks

All infrastructure components provide health check capabilities:

```typescript
// Database
const dbHealthy = await testConnection();

// Redis
await redisClient.ping();

// Storage
const storageHealth = await healthCheck();
console.log(storageHealth); // { healthy: boolean, message: string }
```

Health checks are exposed via the `/health/ready` endpoint:
```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "redis": true,
    "storage": true
  },
  "timestamp": "2025-10-28T10:30:00.000Z"
}
```

Detailed health information is available at `/health/detailed`:
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "healthy": true,
      "message": "Database connection successful"
    },
    "redis": {
      "healthy": true,
      "message": "Redis connection successful"
    },
    "storage": {
      "healthy": true,
      "message": "Storage service is healthy",
      "info": {
        "type": "MinIO",
        "bucket": "chat-images",
        "region": "us-east-1",
        "endpoint": "http://localhost:9000"
      }
    }
  },
  "timestamp": "2025-10-28T10:30:00.000Z",
  "uptime": 3600.5
}
```

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, randomly generated secrets for JWT tokens
- Rotate credentials periodically
- Use different credentials for each environment

### Storage Security
- Use IAM roles in production (AWS)
- Enable bucket encryption at rest
- Use signed URLs for private content
- Configure bucket policies to restrict access
- Enable versioning for important data
- Set up lifecycle policies for cleanup

### Database Security
- Use SSL/TLS connections in production
- Implement connection pooling limits
- Use read replicas for read-heavy operations
- Enable query logging for auditing
- Regular backup and recovery testing

### Redis Security
- Enable AUTH with strong passwords
- Use SSL/TLS in production
- Restrict network access
- Monitor for suspicious activity
- Set appropriate memory limits

## Troubleshooting

### Storage Issues

**Bucket does not exist:**
```
Error: Bucket chat-images does not exist
```
Solution: The bucket is created automatically during initialization. Check logs for errors during startup.

**Access denied:**
```
Error: Access Denied
```
Solution: Verify S3_ACCESS_KEY and S3_SECRET_KEY are correct. For MinIO, ensure credentials match MINIO_ROOT_USER and MINIO_ROOT_PASSWORD.

**Connection refused:**
```
Error: connect ECONNREFUSED
```
Solution: Ensure MinIO/S3 service is running. For Docker, check `docker-compose logs minio`.

**CORS errors:**
```
CORS policy: No 'Access-Control-Allow-Origin' header
```
Solution: CORS is configured automatically. Some MinIO configurations may not support CORS. Check logs for warnings.

### Database Issues

**Connection timeout:**
```
Error: Connection timeout
```
Solution: Check DATABASE_URL is correct. Verify PostgreSQL is running. Check network connectivity.

**Too many connections:**
```
Error: too many clients already
```
Solution: Increase PostgreSQL max_connections or reduce pool size in database.ts.

### Redis Issues

**Connection refused:**
```
Error: connect ECONNREFUSED
```
Solution: Verify Redis is running. Check REDIS_URL format: `redis://:password@host:port`.

**Authentication failed:**
```
Error: NOAUTH Authentication required
```
Solution: Include password in REDIS_URL: `redis://:yourpassword@host:port`.

## Performance Tuning

### Database
- Adjust pool sizes based on load (see database.ts)
- Use read replicas for heavy read workloads
- Enable connection pooling
- Monitor query performance

### Redis
- Use Redis cluster for high availability
- Implement caching strategies
- Monitor memory usage
- Set appropriate TTLs

### Storage
- Use CDN for public assets (S3_PUBLIC_URL)
- Implement signed URLs with reasonable expiry
- Compress images before upload
- Use appropriate bucket policies
- Enable transfer acceleration (AWS S3)

## References

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Node-Redis Client](https://github.com/redis/node-redis)
