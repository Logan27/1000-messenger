# Docker Compose Setup Guide

This document describes the Docker Compose configurations available for the chat application.

## Overview

The project provides three Docker Compose configurations for different use cases:

1. **docker-compose.dev.yml** - Infrastructure-only for local development
2. **docker-compose.yml** - Full-stack local development/testing
3. **docker-compose.prod.yml** - Production deployment configuration

## Infrastructure Services

All configurations include these core infrastructure services with the specified versions:

### PostgreSQL 15
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Database**: chatapp
- **User**: chatuser
- **Password**: chatpass (configurable via `POSTGRES_PASSWORD`)
- **Features**: 
  - Health checks for service readiness
  - Persistent volume for data
  - Automatic initialization with migrations
  - Connection pooling support

### Redis 7
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Password**: redispass (configurable via `REDIS_PASSWORD`)
- **Features**:
  - AOF (Append Only File) persistence enabled
  - Password authentication
  - Health checks
  - Persistent volume for data
  - Used for pub/sub, session storage, and caching

### MinIO (S3-Compatible Storage)
- **Image**: `minio/minio:latest`
- **Ports**: 
  - 9000 (API)
  - 9001 (Console)
- **Credentials**:
  - User: minioadmin (configurable via `MINIO_ROOT_USER`)
  - Password: minioadmin (configurable via `MINIO_ROOT_PASSWORD`)
- **Features**:
  - S3-compatible object storage
  - Web-based console for management
  - Automatic bucket creation (`chat-images`)
  - Public download policy for images
  - Persistent volume for data

## Configuration Files

### docker-compose.dev.yml

**Purpose**: Infrastructure-only setup for active development

**Use Case**: When you want to run backend and frontend locally with hot-reload while having databases in Docker

**Services**:
- PostgreSQL 15
- Redis 7
- MinIO
- MinIO initialization container

**Usage**:
```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# Check status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

**Advantages**:
- ✅ Fast iteration - no Docker rebuilds
- ✅ Easy debugging with IDE
- ✅ Hot-reload for code changes
- ✅ Direct access to logs
- ✅ Lower resource usage

### docker-compose.yml

**Purpose**: Complete application stack for local testing

**Use Case**: When you want to test the complete application as it would run in production, or demonstrate the app without setting up local development environment

**Services**:
- PostgreSQL 15
- Redis 7
- MinIO
- MinIO initialization container
- Backend API (built from source)
- Frontend (built from source)
- Nginx load balancer

**Usage**:
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Access Points**:
- Frontend: http://localhost
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001
- Nginx Load Balancer: http://localhost:8080

**Advantages**:
- ✅ Production-like environment
- ✅ Easy to share and demonstrate
- ✅ No local Node.js required
- ✅ Tests full Docker build process

### docker-compose.prod.yml

**Purpose**: Production deployment with resource limits and scaling

**Use Case**: Deploying to production with Docker Swarm or similar orchestration

**Features**:
- Resource limits (CPU, memory)
- Resource reservations
- Multiple backend replicas
- Restart policies
- Health checks

**Usage**:
```bash
# Deploy with Docker Swarm
docker stack deploy -c docker-compose.prod.yml chat-app
```

## Environment Variables

All Docker Compose files support environment variable overrides for configuration.

### Common Variables

```bash
# PostgreSQL
POSTGRES_PASSWORD=chatpass

# Redis
REDIS_PASSWORD=redispass

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Backend (docker-compose.yml only)
JWT_SECRET=your-very-long-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
```

### Using .env File

Create a `.env` file in the project root:

```env
# Example .env file
POSTGRES_PASSWORD=mysecurepassword
REDIS_PASSWORD=myredispassword
MINIO_ROOT_USER=myminioadmin
MINIO_ROOT_PASSWORD=myminiopassword
JWT_SECRET=my-super-secret-jwt-key-at-least-32-chars-long
JWT_REFRESH_SECRET=my-super-secret-refresh-key-at-least-32-chars-long
```

## Networking

All services within each Docker Compose configuration share a private network:

- **docker-compose.dev.yml**: `chat-dev-network`
- **docker-compose.yml**: `chat-network`

Services can communicate with each other using service names as hostnames:
- Backend connects to PostgreSQL at: `postgres:5432`
- Backend connects to Redis at: `redis:6379`
- Backend connects to MinIO at: `minio:9000`

## Volumes

Persistent data is stored in Docker volumes to survive container restarts:

### docker-compose.dev.yml
- `postgres_dev_data` - PostgreSQL data
- `redis_dev_data` - Redis data
- `minio_dev_data` - MinIO/S3 storage

### docker-compose.yml
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data
- `minio_data` - MinIO/S3 storage

### Managing Volumes

```bash
# List volumes
docker volume ls

# Inspect a volume
docker volume inspect project_postgres_dev_data

# Remove all volumes (WARNING: deletes all data!)
docker compose -f docker-compose.dev.yml down -v

# Backup PostgreSQL data
docker exec chat-postgres-dev pg_dump -U chatuser chatapp > backup.sql

# Restore PostgreSQL data
cat backup.sql | docker exec -i chat-postgres-dev psql -U chatuser -d chatapp
```

## Health Checks

All infrastructure services include health checks to ensure they're ready before dependent services start:

### PostgreSQL
- Command: `pg_isready -U chatuser -d chatapp`
- Interval: 10s
- Timeout: 5s
- Retries: 5

### Redis
- Command: `redis-cli --pass PASSWORD ping`
- Interval: 10s
- Timeout: 5s
- Retries: 5

### MinIO
- Command: `curl -f http://localhost:9000/minio/health/live`
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Troubleshooting

### Services Won't Start

```bash
# Check service status
docker compose -f docker-compose.dev.yml ps

# View service logs
docker compose -f docker-compose.dev.yml logs [service-name]

# Check container details
docker inspect [container-name]
```

### Port Conflicts

If ports are already in use, you can either:

1. Stop the conflicting service
2. Change the port mapping in docker-compose file:
   ```yaml
   ports:
     - "5433:5432"  # Map PostgreSQL to 5433 instead of 5432
   ```

### Data Reset

To completely reset all data:

```bash
# Stop services and remove volumes
docker compose -f docker-compose.dev.yml down -v

# Start fresh
docker compose -f docker-compose.dev.yml up -d
```

### MinIO Bucket Not Created

Check the initialization logs:

```bash
docker compose -f docker-compose.dev.yml logs minio-init
```

If the bucket wasn't created, you can create it manually:

```bash
docker exec -it chat-minio-dev sh
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc mb myminio/chat-images
mc anonymous set download myminio/chat-images
```

## Performance Tuning

### PostgreSQL

For better performance, you can customize PostgreSQL settings:

```yaml
postgres:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_MAX_CONNECTIONS: 100
```

### Redis

For production workloads:

```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru --appendonly yes
```

## Security Considerations

### Development (docker-compose.dev.yml)
- Uses default passwords for convenience
- Exposes ports to localhost
- Suitable for local development only

### Production (docker-compose.prod.yml)
- **Always** change default passwords
- Use secrets management (Docker secrets, Kubernetes secrets, etc.)
- Use environment-specific configurations
- Implement network policies
- Enable TLS/SSL
- Regular security updates

### Best Practices
1. Never commit `.env` files to version control
2. Use strong, unique passwords in production
3. Rotate credentials regularly
4. Limit network exposure
5. Enable audit logging
6. Regular backups
7. Monitor resource usage

## Upgrade Guide

### PostgreSQL
To upgrade PostgreSQL versions:

1. Backup data: `pg_dump`
2. Stop services: `docker compose down`
3. Update image version in docker-compose file
4. Remove old volume (optional)
5. Start services: `docker compose up -d`
6. Restore data if needed

### Redis
Redis upgrades are usually seamless:

1. Stop services: `docker compose down`
2. Update image version
3. Start services: `docker compose up -d`

### MinIO
MinIO upgrades handle migrations automatically:

1. Stop services
2. Update image to specific version tag (recommended)
3. Start services

## References

- [PostgreSQL Docker Documentation](https://hub.docker.com/_/postgres)
- [Redis Docker Documentation](https://hub.docker.com/_/redis)
- [MinIO Docker Documentation](https://min.io/docs/minio/container/index.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Architecture Documentation](./arch.md)
- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
