# Backend Docker Configuration

This document describes the Docker setup for the Real-Time Messenger Backend API.

## Overview

The backend uses a multi-stage Docker build to create an optimized production image with minimal size and security hardening.

## Dockerfile Structure

### Stage 1: Builder
- Base: `node:20.11-alpine`
- Purpose: Build TypeScript source and generate Prisma client
- Includes: All dependencies (dev + production) required for building

### Stage 2: Production
- Base: `node:20.11-alpine`
- Purpose: Minimal runtime image with only production dependencies
- Features:
  - Non-root user (`nodejs:nodejs`, UID/GID 1001)
  - Tini init system for proper signal handling
  - Health check endpoint monitoring
  - Security updates applied
  - Database migration support

## Building the Image

### Basic Build
```bash
cd backend
docker build -t chat-backend:latest .
```

### Build with Custom Tag
```bash
docker build -t chat-backend:v1.0.0 .
```

### Build with Build Arguments (if needed)
```bash
docker build --build-arg NODE_ENV=production -t chat-backend:latest .
```

## Running the Container

### Using Docker Run

```bash
docker run -d \
  --name chat-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/chatapp" \
  -e REDIS_URL="redis://:pass@redis:6379" \
  -e JWT_SECRET="your-secret-key" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e S3_ENDPOINT="http://minio:9000" \
  -e S3_ACCESS_KEY="minioadmin" \
  -e S3_SECRET_KEY="minioadmin" \
  -e S3_BUCKET="chat-images" \
  -e FRONTEND_URL="http://localhost:5173" \
  chat-backend:latest
```

### Using Docker Compose
See the root `docker-compose.yml` for the complete setup with all dependencies.

```bash
# From project root
docker-compose up -d backend
```

## Environment Variables

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for access tokens (min 32 characters)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens (min 32 characters)
- `S3_ENDPOINT` - MinIO/S3 endpoint URL
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name for images
- `FRONTEND_URL` - Frontend URL for CORS

### Optional Variables
- `NODE_ENV` - Environment mode (default: production)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)
- `RUN_MIGRATIONS` - Set to "true" to run Prisma migrations on startup
- `S3_PUBLIC_URL` - Public URL for S3 bucket (defaults to S3_ENDPOINT)
- `AWS_REGION` - AWS region for S3 (default: us-east-1)

### Migration Support
To run database migrations automatically when the container starts:

```bash
docker run -e RUN_MIGRATIONS=true ...
```

Or in docker-compose.yml:
```yaml
environment:
  RUN_MIGRATIONS: "true"
```

## Health Check

The container includes a built-in health check that monitors the `/health` endpoint:

- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 40 seconds (allows startup time)
- **Retries**: 3 attempts before marking unhealthy

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' chat-backend
```

## Security Features

1. **Non-root User**: Application runs as `nodejs` user (UID 1001)
2. **Minimal Base Image**: Alpine Linux for reduced attack surface
3. **Security Updates**: Latest security patches applied during build
4. **Tini Init System**: Proper signal handling and zombie process reaping
5. **Read-only Filesystem Ready**: Application doesn't write to filesystem
6. **No Secrets in Image**: All sensitive data via environment variables

## Best Practices

### Production Deployment

1. **Always use specific tags**, not `:latest`:
   ```bash
   docker build -t chat-backend:v1.2.3 .
   ```

2. **Use secrets management** for sensitive environment variables:
   - Kubernetes: Use Secrets
   - Docker Swarm: Use Docker Secrets
   - AWS ECS: Use Parameter Store or Secrets Manager

3. **Run with resource limits**:
   ```bash
   docker run --memory=1g --cpus=1 ...
   ```

4. **Mount volumes for persistent data** (if needed):
   ```bash
   docker run -v /host/logs:/app/logs ...
   ```

5. **Use health checks** in orchestration:
   - Kubernetes: Configure liveness and readiness probes
   - Docker Swarm: Health checks are automatic

### Development

For development, use docker-compose with volume mounts for hot-reloading:
```bash
docker-compose -f docker-compose.dev.yml up
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs chat-backend

# Check specific issues
docker logs --tail 50 chat-backend
```

### Health check failing
```bash
# Test health endpoint manually
docker exec chat-backend curl http://localhost:3000/health
```

### Database connection issues
```bash
# Verify DATABASE_URL is correct
docker exec chat-backend printenv DATABASE_URL

# Test database connectivity
docker exec chat-backend nc -zv postgres 5432
```

### Permission issues
```bash
# Check running user
docker exec chat-backend whoami
# Should output: nodejs
```

## Image Optimization

The production image is optimized for size and security:

- **Multi-stage build**: Separates build tools from runtime
- **Layer caching**: Dependency installation cached separately
- **Minimal dependencies**: Only production npm packages
- **Alpine base**: Smallest possible base image
- **No build artifacts**: TypeScript and source code not in final image

Expected image size: ~300-400 MB

Check image size:
```bash
docker images chat-backend
```

## Kubernetes Deployment

For Kubernetes deployment, see `/k8s/backend-deployment.yaml`.

Key considerations:
- Use ConfigMaps for non-sensitive configuration
- Use Secrets for sensitive data
- Configure resource requests and limits
- Set up horizontal pod autoscaling
- Use readiness and liveness probes

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Build Docker image
  run: docker build -t chat-backend:${{ github.sha }} ./backend

- name: Push to registry
  run: |
    docker tag chat-backend:${{ github.sha }} registry.example.com/chat-backend:${{ github.sha }}
    docker push registry.example.com/chat-backend:${{ github.sha }}
```

## Additional Resources

- [Backend README](./README.md) - Application documentation
- [Prisma Documentation](https://www.prisma.io/docs) - Database migrations
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
