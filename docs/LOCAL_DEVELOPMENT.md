# Local Development Guide

This guide will help you set up the chat application for local development.

## Prerequisites

- Docker & Docker Compose (for infrastructure services)
- Node.js 20+ and npm
- Git

## Architecture Overview

For local development, we use a hybrid approach:

- **Infrastructure services** (PostgreSQL, Redis, MinIO) run in Docker containers
- **Application code** (backend and frontend) runs locally with hot-reload for faster development

This approach provides:
- ✅ Consistent infrastructure across all developers
- ✅ Fast hot-reload for code changes
- ✅ Easy debugging and development
- ✅ No need to rebuild Docker images on every change

## Quick Start

### 1. Start Infrastructure Services

The `docker compose.dev.yml` file contains only the infrastructure services needed for development:

```bash
# Start PostgreSQL 15, Redis 7, and MinIO
docker compose -f docker compose.dev.yml up -d

# Check that all services are healthy
docker compose -f docker compose.dev.yml ps

# Expected output:
# NAME                    STATUS              PORTS
# chat-postgres-dev       Up (healthy)        0.0.0.0:5432->5432/tcp
# chat-redis-dev          Up (healthy)        0.0.0.0:6379->6379/tcp
# chat-minio-dev          Up (healthy)        0.0.0.0:9000-9001->9000-9001/tcp
# chat-minio-init-dev     Exited (0)
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# The default values in .env.example are already configured
# to work with docker compose.dev.yml

# Run database migrations
npm run migrate

# (Optional) Seed database with test data
npm run seed

# Start development server with hot-reload
npm run dev
```

The backend API will be available at: http://localhost:3000

### 3. Setup Frontend

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server with hot-reload
npm run dev
```

The frontend will be available at: http://localhost:5173

## Infrastructure Services Details

### PostgreSQL 15

- **Host**: localhost
- **Port**: 5432
- **Database**: chatapp
- **User**: chatuser
- **Password**: chatpass (default, can be changed via env var)

Connection string: `postgresql://chatuser:chatpass@localhost:5432/chatapp`

#### Connecting with psql

```bash
docker exec -it chat-postgres-dev psql -U chatuser -d chatapp
```

### Redis 7

- **Host**: localhost
- **Port**: 6379
- **Password**: redispass (default, can be changed via env var)

Connection string: `redis://:redispass@localhost:6379`

#### Connecting with redis-cli

```bash
docker exec -it chat-redis-dev redis-cli -a redispass
```

### MinIO (S3-Compatible Storage)

- **API Endpoint**: http://localhost:9000
- **Console**: http://localhost:9001
- **Access Key**: minioadmin (default)
- **Secret Key**: minioadmin (default)
- **Bucket**: chat-images (automatically created)

Access the MinIO Console at http://localhost:9001 to view uploaded files.

## Development Workflow

### Making Code Changes

#### Backend Changes
- Edit files in `backend/src/`
- The dev server will automatically restart (via ts-node-dev)
- Check the console for any errors

#### Frontend Changes
- Edit files in `frontend/src/`
- Vite will hot-reload changes instantly
- Check the browser console for any errors

### Database Migrations

After modifying the database schema:

```bash
cd backend

# Create a new migration (if using a migration tool)
npm run migrate:create <migration-name>

# Run pending migrations
npm run migrate
```

### Running Tests

#### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting and Type Checking

#### Backend
```bash
cd backend

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# TypeScript type checking
npm run type-check
```

#### Frontend
```bash
cd frontend

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# TypeScript type checking
npm run type-check
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs for all services
docker compose -f docker compose.dev.yml logs

# Check logs for a specific service
docker compose -f docker compose.dev.yml logs postgres
docker compose -f docker compose.dev.yml logs redis
docker compose -f docker compose.dev.yml logs minio
```

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find which process is using the port
# On Linux/Mac:
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# On Windows:
netstat -ano | findstr :5432
```

### Database Connection Issues

1. Verify PostgreSQL is running and healthy:
   ```bash
   docker compose -f docker compose.dev.yml ps postgres
   ```

2. Check PostgreSQL logs:
   ```bash
   docker compose -f docker compose.dev.yml logs postgres
   ```

3. Test connection manually:
   ```bash
   docker exec -it chat-postgres-dev psql -U chatuser -d chatapp
   ```

### Redis Connection Issues

1. Verify Redis is running:
   ```bash
   docker compose -f docker compose.dev.yml ps redis
   ```

2. Test Redis connection:
   ```bash
   docker exec -it chat-redis-dev redis-cli -a redispass ping
   # Should return: PONG
   ```

### MinIO Connection Issues

1. Check if MinIO is healthy:
   ```bash
   docker compose -f docker compose.dev.yml ps minio
   ```

2. Access MinIO console: http://localhost:9001

3. Check if bucket was created:
   ```bash
   docker compose -f docker compose.dev.yml logs minio-init
   ```

### Clean Slate / Reset Everything

If you need to start fresh:

```bash
# Stop all containers
docker compose -f docker compose.dev.yml down

# Remove all data volumes (WARNING: This deletes all data!)
docker compose -f docker compose.dev.yml down -v

# Start fresh
docker compose -f docker compose.dev.yml up -d

# Re-run migrations
cd backend
npm run migrate
```

## Environment Variables

### Backend Environment Variables

See `backend/.env.example` for all available options:

- `NODE_ENV`: Environment (development/production/test)
- `PORT`: Backend server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `S3_ENDPOINT`: MinIO/S3 endpoint
- `JWT_SECRET`: Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (min 32 chars)
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend Environment Variables

See `frontend/.env.example` for all available options:

- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket server URL

## Tips & Best Practices

1. **Use separate terminals**: Run backend and frontend in separate terminal windows for easier debugging

2. **Check healthchecks**: Always verify services are healthy before starting development:
   ```bash
   docker compose -f docker compose.dev.yml ps
   ```

3. **Watch the logs**: Keep terminal windows open to see real-time logs from backend and frontend

4. **Use the MinIO Console**: When debugging file uploads, check http://localhost:9001 to see uploaded files

5. **Database GUI tools**: Use tools like pgAdmin, DBeaver, or TablePlus to inspect the database:
   - Host: localhost
   - Port: 5432
   - Database: chatapp
   - User: chatuser
   - Password: chatpass

6. **Redis GUI tools**: Use RedisInsight or another Redis client to inspect Redis data:
   - Host: localhost
   - Port: 6379
   - Password: redispass

## Switching Between Development Modes

### Infrastructure-Only Mode (Recommended for Development)

```bash
docker compose -f docker compose.dev.yml up -d
# Then run backend and frontend locally
```

### Full-Stack Mode (For Testing Production-Like Setup)

```bash
docker compose up -d
# Everything runs in Docker with built images
```

### Production Mode

```bash
docker compose -f docker compose.prod.yml up -d
# Production configuration with resource limits and replicas
```

## Next Steps

- Read [Architecture Documentation](./arch.md) to understand the system design
- Check [API Documentation](./frd.md) for available endpoints
- Review the codebase structure in `backend/src/` and `frontend/src/`

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review logs: `docker compose -f docker compose.dev.yml logs`
3. Check service health: `docker compose -f docker compose.dev.yml ps`
4. Verify environment variables in `.env` files
5. Ask the team for help!
