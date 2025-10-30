# 1000-Messenger - Real-Time Chat Application

A modern, scalable messenger application built for team communication with real-time messaging, group chats, and rich media sharing. Designed to be cloud-agnostic and horizontally scalable to support 1,000+ concurrent users.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Performance Testing](#performance-testing)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

1000-Messenger is a production-ready, real-time chat application that provides:

- **User Management**: Self-registration with secure authentication
- **Direct Messaging**: One-on-one conversations with persistent history
- **Group Chats**: Support for groups with up to 300 participants
- **Rich Content**: Text formatting (bold, italic) and image sharing
- **Real-Time Updates**: WebSocket-based instant message delivery
- **Reliable Delivery**: Message queuing for offline users with guaranteed delivery
- **Search**: Full-text search across all messages
- **Deep Linking**: Direct URLs to specific chats and messages
- **Multi-Device**: Synchronized message delivery across devices

Built with scalability, reliability, and developer experience in mind.

## Features

### ✅ Core Features

- **Authentication & Authorization**
  - User registration and login with JWT tokens
  - Session persistence across browser restarts
  - Rate limiting for security (5 attempts per 15 minutes)
  - Refresh token support for extended sessions

- **Contact Management**
  - Search users by username
  - Send and accept contact requests
  - View online/offline status
  - Contact list with real-time status updates

- **Direct Messaging**
  - One-on-one chats with contacts
  - Text messages up to 10,000 characters
  - Text formatting (bold, italic)
  - Image sharing (JPEG, PNG, GIF, WebP, up to 10MB)
  - Message editing and deletion
  - Reply to specific messages

- **Group Chats**
  - Create groups with custom names and avatars
  - Add/remove participants (up to 300 members)
  - Group owner management
  - System notifications for member changes
  - Full message history for new members

- **Real-Time Features**
  - Instant message delivery (< 100ms)
  - Typing indicators
  - Online/offline presence
  - Read receipts
  - Delivery status indicators (sent, delivered, read)

- **Message Features**
  - Edit sent messages (with "edited" indicator)
  - Delete messages (soft delete with placeholder)
  - Emoji reactions
  - Reply to specific messages with quotes
  - Message pagination with infinite scroll (50 messages per page)

- **Search & Navigation**
  - Full-text search across all messages
  - Filter search by specific chat
  - Deep links to chats and messages
  - User profile pages

## Tech Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 20 LTS | JavaScript runtime |
| Language | TypeScript | 5+ | Type-safe development |
| Framework | Express.js | 4.18+ | HTTP server framework |
| WebSocket | Socket.IO | 4.7+ | Real-time bidirectional communication |
| Database | PostgreSQL | 15+ | Relational database with ACID compliance |
| Cache/Pub-Sub | Redis | 7+ | Session management and real-time synchronization |
| Object Storage | MinIO/S3 | Latest | Image and file storage |
| ORM | Prisma | 6+ | Type-safe database client |
| Validation | Zod | 3+ | Schema validation |
| Authentication | jsonwebtoken | 9+ | JWT token generation |
| Password Hashing | bcrypt | 5+ | Secure password storage |
| Image Processing | Sharp | 0.32+ | Image resize and thumbnail generation |
| Testing | Jest | 29+ | Unit and integration testing |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 18+ | UI framework |
| Language | TypeScript | 5+ | Type-safe development |
| Build Tool | Vite | 4+ | Fast development and build |
| State Management | Zustand | 4+ | Lightweight state management |
| HTTP Client | Axios | 1.6+ | API requests |
| WebSocket Client | Socket.IO Client | 4.7+ | Real-time communication |
| Routing | React Router | 6+ | Client-side routing |
| Styling | TailwindCSS | 3+ | Utility-first CSS framework |
| Icons | Heroicons | 2+ | SVG icon library |
| Date Utilities | date-fns | 2+ | Date manipulation |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker 24+ | Container runtime |
| Orchestration | Docker Compose / Kubernetes | Service orchestration |
| Load Balancer | Nginx | Reverse proxy and load balancing |
| Monitoring | Prometheus + Grafana (optional) | Metrics and visualization |

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Web Browser (React SPA)                              │  │
│  │  • WebSocket Client (Socket.IO)                       │  │
│  │  • REST API Client (Axios)                            │  │
│  │  • State Management (Zustand)                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓
                   HTTPS / WebSocket (WSS)
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              LOAD BALANCER / GATEWAY                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Nginx / ALB                                          │  │
│  │  • SSL Termination                                    │  │
│  │  • WebSocket Upgrade Support                          │  │
│  │  • Sticky Sessions (for WebSocket)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Horizontal Scaling)          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Backend 1  │    │  Backend 2  │    │  Backend N  │     │
│  │  Node.js    │    │  Node.js    │    │  Node.js    │     │
│  │  Socket.IO  │    │  Socket.IO  │    │  Socket.IO  │     │
│  │  Express    │    │  Express    │    │  Express    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │                    │                      │
         ├────────────────────┼──────────────────────┤
         ↓                    ↓                      ↓
┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐
│  REDIS CLUSTER  │  │   PostgreSQL     │  │ Object Storage │
│  • Pub/Sub      │  │   • Users        │  │  • Images      │
│  • Sessions     │  │   • Messages     │  │  • Thumbnails  │
│  • Cache        │  │   • Chats        │  │  (MinIO/S3)    │
│  • Queues       │  │   • Contacts     │  │                │
└─────────────────┘  └──────────────────┘  └────────────────┘
```

### Key Design Principles

- **Horizontal Scalability**: Multiple backend instances with Redis Pub/Sub for WebSocket synchronization
- **Reliable Delivery**: Redis Streams + PostgreSQL delivery tracking ensures no message loss
- **Cloud Agnostic**: Runs locally with Docker or in any cloud (AWS, GCP, Azure)
- **WebSocket with Fallback**: Automatic fallback to long-polling if WebSocket fails
- **Zero Data Loss**: All data persists to PostgreSQL with ACID compliance

For detailed architecture documentation, see [docs/arch.md](./docs/arch.md).

## Prerequisites

Before you begin, ensure you have the following installed:

### Required for Docker Setup (Recommended)

- **Docker** 24+ ([Installation Guide](https://docs.docker.com/get-docker/))
- **Docker Compose** (usually included with Docker Desktop)

### Required for Local Development

- **Node.js** 20+ LTS ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Docker & Docker Compose** (for infrastructure services)

### Optional Tools

- **Git** (for version control)
- **pgAdmin** or **psql** (for database management)
- **Redis Insight** (for Redis visualization)
- **Postman** or **Thunder Client** (for API testing)

## Quick Start

### Option 1: Full Docker Compose Setup (Easiest)

Run the entire application stack (backend, frontend, and all services) in Docker:

```bash
# Clone the repository
git clone <repository-url>
cd 1000-messenger

# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

**Access the application:**
- Frontend: http://localhost
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Option 2: Verify Your Development Environment

Run the verification script to check if your environment is ready:

```bash
./scripts/verify-dev-setup.sh
```

This will check:
- Docker and Docker Compose installation
- Node.js and npm versions
- Running services status
- Environment file configuration
- Dependencies installation

## Local Development

For the best development experience with hot-reload, run only infrastructure services in Docker and run backend/frontend locally:

### Step 1: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker compose -f docker-compose.dev.yml up -d

# Verify services are healthy
docker compose -f docker-compose.dev.yml ps

# View logs if needed
docker compose -f docker-compose.dev.yml logs -f
```

**Access infrastructure services:**
- PostgreSQL: `localhost:5432`
  - Database: `chatapp`
  - User: `chatuser`
  - Password: `chatpass`
- Redis: `localhost:6379`
  - Password: `redispass`
- MinIO Console: http://localhost:9001
  - Credentials: `minioadmin/minioadmin`
- MinIO API: http://localhost:9000

### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env if needed (defaults work with docker-compose.dev.yml)
# nano .env  # or use your preferred editor

# Run database migrations
npm run migrate

# Optional: Seed database with test data
npm run seed

# Start development server (with hot-reload)
npm run dev
```

The backend will run at: **http://localhost:3000**

**Available backend commands:**
```bash
npm run dev              # Start development server with hot-reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server
npm run migrate          # Run database migrations
npm run seed             # Seed database with test data
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

### Step 3: Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env if needed (defaults work with backend on localhost:3000)
# nano .env  # or use your preferred editor

# Start development server (with hot-reload)
npm run dev
```

The frontend will run at: **http://localhost:5173**

**Available frontend commands:**
```bash
npm run dev              # Start development server with hot-reload
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

### Step 4: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory. Use `backend/.env.example` as a template.

**Required Variables:**

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatapp

# Redis
REDIS_URL=redis://:redispass@localhost:6379

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# S3/MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=chat-images
S3_PUBLIC_URL=http://localhost:9000
AWS_REGION=us-east-1

# CORS
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Production Security:**
- Change all default passwords and secrets
- Use strong, randomly generated secrets for JWT keys
- Use environment-specific values (never commit secrets to Git)

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory. Use `frontend/.env.example` as a template.

```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000

# Feature Flags (optional)
VITE_ENABLE_NOTIFICATIONS=true
```

## Database Setup

### Automatic Migration (Recommended)

When you run `npm run migrate` in the backend, it automatically:
1. Creates all required tables
2. Sets up indexes for performance
3. Establishes foreign key relationships
4. Applies any pending migrations

```bash
cd backend
npm run migrate
```

### Manual Migration

If you need to run migrations manually using SQL:

```bash
# Connect to PostgreSQL
psql -h localhost -U chatuser -d chatapp

# Run migration files from backend/src/database/migrations/
\i backend/src/database/migrations/001_initial_schema.sql
```

### Database Schema Overview

The application uses the following main tables:
- **users** - User accounts and profiles
- **contacts** - Contact relationships between users
- **chats** - Chat room metadata (direct and group)
- **chat_participants** - User membership in chats
- **messages** - All chat messages
- **message_delivery** - Delivery tracking and read receipts
- **message_reactions** - Emoji reactions to messages
- **attachments** - Image and file metadata

For detailed schema documentation, see [specs/001-messenger-app/data-model.md](./specs/001-messenger-app/data-model.md).

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test structure:**
- `tests/unit/` - Unit tests for services, utilities, and helpers
- `tests/integration/` - Integration tests for API endpoints and database operations

### Frontend Tests

```bash
cd frontend

# Run tests (if configured)
npm test
```

### End-to-End Testing

For comprehensive testing across the entire stack, use the performance testing tool:

```bash
cd tools/performance-test
npm install

# Run load test
NUM_USERS=100 MSG_PER_SEC=10 DURATION=30 npm test
```

## Deployment

### Docker Compose Production

For production deployment with Docker Compose:

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down
```

### Kubernetes Deployment

For Kubernetes deployment:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply configurations
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check pod status
kubectl get pods -n chat-app

# Check service status
kubectl get services -n chat-app

# View logs
kubectl logs -n chat-app -l app=backend -f
```

### Environment-Specific Configuration

**Production Checklist:**
- [ ] Change all default passwords and secrets
- [ ] Configure proper SSL/TLS certificates
- [ ] Set up database backups and point-in-time recovery
- [ ] Configure Redis persistence (AOF + RDB)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure log aggregation (ELK stack or similar)
- [ ] Set up proper rate limiting
- [ ] Configure CORS for your domain
- [ ] Set up CDN for static assets
- [ ] Configure S3/MinIO for production storage

## Performance Testing

Test the application under load to verify performance requirements:

```bash
cd tools/performance-test
npm install

# Run load test with custom parameters
NUM_USERS=1000 MSG_PER_SEC=50 DURATION=60 npm test

# Run with default parameters (100 users, 10 msg/sec, 30 seconds)
npm test
```

**Performance Targets:**
- 1,000 concurrent WebSocket connections
- 50 messages/second sustained throughput (100 msg/sec spikes)
- Average latency < 100ms
- 95th percentile < 300ms
- 99th percentile < 500ms
- 99.9% message delivery success rate

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and invalidate tokens |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | Get user's chats |
| POST | `/api/chats/direct` | Create or get direct chat |
| POST | `/api/chats/group` | Create group chat |
| GET | `/api/chats/:id` | Get chat details |
| PUT | `/api/chats/:id` | Update chat (name, avatar) |
| DELETE | `/api/chats/:id` | Delete chat |

### Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats/:id/messages` | Get messages (paginated) |
| POST | `/api/chats/:id/messages` | Send message |
| PUT | `/api/messages/:id` | Edit message |
| DELETE | `/api/messages/:id` | Delete message |
| POST | `/api/messages/:id/reactions` | Add reaction |
| DELETE | `/api/messages/:id/reactions/:emoji` | Remove reaction |

### Contact Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | Get contacts list |
| GET | `/api/contacts/requests` | Get pending contact requests |
| POST | `/api/contacts/requests` | Send contact request |
| POST | `/api/contacts/requests/:id/accept` | Accept contact request |
| DELETE | `/api/contacts/requests/:id` | Reject contact request |
| DELETE | `/api/contacts/:id` | Remove contact |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| GET | `/api/users/search` | Search users |
| GET | `/api/users/:id` | Get user profile |

### WebSocket Events

**Client → Server:**
- `message:send` - Send a message
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark message as read

**Server → Client:**
- `message:new` - New message received
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `message:delivered` - Message delivery confirmation
- `message:read` - Message read receipt
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:online` - User came online
- `presence:offline` - User went offline

For complete API documentation, see [docs/frd.md](./docs/frd.md).

## Troubleshooting

### Common Issues

#### Port Already in Use

If you see "port already in use" errors:

```bash
# Check what's using the port (Linux/Mac)
lsof -i :3000   # Backend port
lsof -i :5173   # Frontend port
lsof -i :5432   # PostgreSQL port

# Kill the process or change the port in .env
```

#### Docker Services Not Starting

```bash
# Check Docker service status
docker compose -f docker-compose.dev.yml ps

# View service logs
docker compose -f docker-compose.dev.yml logs postgres
docker compose -f docker-compose.dev.yml logs redis
docker compose -f docker-compose.dev.yml logs minio

# Restart services
docker compose -f docker-compose.dev.yml restart

# Clean restart (removes volumes - DATA LOSS!)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

#### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Check PostgreSQL logs
docker compose -f docker-compose.dev.yml logs postgres

# Test connection manually
docker exec -it chat-postgres-dev psql -U chatuser -d chatapp

# Verify DATABASE_URL in backend/.env matches your setup
```

#### Redis Connection Errors

```bash
# Check if Redis is running
docker compose -f docker-compose.dev.yml ps redis

# Test Redis connection
docker exec -it chat-redis-dev redis-cli -a redispass ping

# Should return: PONG
```

#### MinIO/S3 Upload Errors

```bash
# Check MinIO status
docker compose -f docker-compose.dev.yml ps minio

# Access MinIO console
# http://localhost:9001 (minioadmin/minioadmin)

# Verify bucket exists
docker exec -it chat-minio-dev mc ls chatminio/
# Should show: chat-images
```

#### Migration Failures

```bash
cd backend

# Drop and recreate database (DATA LOSS!)
npm run prisma:migrate:reset

# Or run migrations manually
npm run migrate
```

#### Hot Reload Not Working

```bash
# Backend: Check if ts-node-dev is running
# Frontend: Clear Vite cache
cd frontend
rm -rf node_modules/.vite
npm run dev
```

#### WebSocket Connection Issues

- Check if backend is running on the correct port
- Verify `VITE_WS_URL` in frontend `.env` matches backend URL
- Check browser console for WebSocket connection errors
- Ensure firewall/proxy allows WebSocket connections
- For production, ensure Nginx is configured for WebSocket upgrade

### Getting Help

If you encounter issues not covered here:

1. Check the [architecture documentation](./docs/arch.md)
2. Review the [specification](./specs/001-messenger-app/spec.md)
3. Check the [data model documentation](./specs/001-messenger-app/data-model.md)
4. Review service logs for error messages
5. Ensure all environment variables are correctly set

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Write or update tests
4. Ensure all tests pass: `npm test`
5. Ensure code is properly formatted: `npm run format`
6. Ensure no linting errors: `npm run lint`
7. Ensure TypeScript compiles: `npm run type-check`
8. Commit your changes with clear commit messages
9. Create a pull request

### Code Style

- **TypeScript**: Follow existing patterns, use strong typing
- **Formatting**: Use Prettier (runs automatically with `npm run format`)
- **Linting**: Follow ESLint rules (check with `npm run lint`)
- **Testing**: Write tests for new features and bug fixes
- **Commits**: Use clear, descriptive commit messages

### Project Structure

```
├── backend/              # Backend Node.js/TypeScript application
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── websocket/    # WebSocket handlers
│   │   ├── utils/        # Utility functions
│   │   └── database/     # Migrations and seeds
│   └── tests/            # Backend tests
├── frontend/             # Frontend React/TypeScript application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand state stores
│   │   ├── services/     # API and WebSocket services
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utility functions
│   └── tests/            # Frontend tests
├── k8s/                  # Kubernetes manifests
├── docs/                 # Documentation
├── specs/                # Feature specifications
├── scripts/              # Utility scripts
└── tools/                # Development tools (performance tests, etc.)
```

## License

MIT License - see [LICENSE](./LICENSE) file for details

---

## Additional Resources

- **Architecture Documentation**: [docs/arch.md](./docs/arch.md)
- **Functional Requirements**: [docs/frd.md](./docs/frd.md)
- **Feature Specification**: [specs/001-messenger-app/spec.md](./specs/001-messenger-app/spec.md)
- **Data Model**: [specs/001-messenger-app/data-model.md](./specs/001-messenger-app/data-model.md)
- **Implementation Plan**: [specs/001-messenger-app/plan.md](./specs/001-messenger-app/plan.md)

---

**Built with ❤️ for team communication**
