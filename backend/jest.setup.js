// Jest setup file - runs before tests
// Set up environment variables for tests

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_ACCESS_KEY = 'minioadmin';
process.env.S3_SECRET_KEY = 'minioadmin';
process.env.S3_BUCKET = 'test-bucket';
process.env.S3_PUBLIC_URL = 'http://localhost:9000';
process.env.AWS_REGION = 'us-east-1';
process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-chars';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.ENABLE_METRICS = 'false';
process.env.LOG_LEVEL = 'error';
