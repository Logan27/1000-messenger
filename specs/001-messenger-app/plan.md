# Implementation Plan: Real-Time Messenger Application

**Branch**: `001-messenger-app` | **Date**: October 28, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-messenger-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a production-ready, real-time messenger application supporting 1,000 concurrent users with reliable message delivery, group chats up to 300 participants, and rich content sharing (text formatting, images). The system uses a horizontally scalable Node.js backend with WebSocket support, PostgreSQL for persistent storage, Redis for real-time pub/sub and caching, and object storage (MinIO/S3) for images. The frontend is a React SPA with real-time updates via Socket.IO client.

## Technical Context

**Language/Version**: 
- Backend: Node.js 20 LTS with TypeScript 5+
- Frontend: React 18+ with TypeScript 5+

**Primary Dependencies**: 
- Backend: Express.js 4.18+, Socket.IO 4.6+, Prisma 5+ (ORM), bcrypt 5+ (auth), jsonwebtoken 9+ (JWT), sharp 0.33+ (image processing), Zod 3+ (validation)
- Frontend: Vite 5+ (build), Zustand 4+ (state), Axios 1.6+ (HTTP), Socket.IO Client 4.6+ (WebSocket), React Router 6+, TailwindCSS 3+ (styling)

**Storage**: 
- Database: PostgreSQL 15+ (primary data store with ACID compliance, read replicas for scaling)
- Cache/Pub-Sub: Redis 7+ cluster (session management, real-time synchronization, message queues)
- Object Storage: MinIO/S3-compatible storage (image files with thumbnail generation)

**Testing**: 
- Backend: Jest 29+ (unit/integration), Supertest 6+ (API testing)
- Frontend: Vitest 1+ (unit), React Testing Library 14+ (component testing)
- Load Testing: Custom tool in tools/performance-test/ for 1000 concurrent users at 50 msg/sec

**Target Platform**: 
- Backend: Linux containers (Docker 24+) on Kubernetes 1.28+ or Docker Compose for dev
- Frontend: Modern web browsers (Chrome, Firefox, Safari, Edge - no IE11), responsive design supporting 320px minimum width
- Deployment: Cloud-agnostic (supports local infrastructure or any cloud provider)

**Project Type**: Web application (separated frontend/backend with shared contracts)

**Performance Goals**: 
- 1,000 concurrent WebSocket connections
- 50 messages/second sustained (100 msg/sec spikes)
- Average latency < 100ms (p95 < 300ms, p99 < 500ms)
- Message delivery: 99.9% success rate
- Database/API uptime: 99.9%+

**Constraints**: 
- WebSocket primary transport with HTTP long-polling fallback
- Message persistence survives server restarts (zero data loss)
- Horizontal scaling without single points of failure
- Sticky sessions required for WebSocket load balancing
- Rate limiting: 5 login attempts/15min, 10 messages/sec/user, 50 contact requests/day
- Image limits: 10MB max, 5 images/message, formats: JPEG/PNG/GIF/WebP

**Scale/Scope**: 
- Target Users: 10,000-100,000 registered users, 1,000 concurrent active
- Message Volume: 1M-10M+ messages with indefinite retention
- Groups: Up to 300 participants per group
- Message Length: 10,000 characters max
- Search Index: 3 months of recent messages for fast search

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: The project constitution template is not yet populated. Applying standard software development best practices for this evaluation.

### ✅ Architecture Principles

- **Separation of Concerns**: ✅ PASS - Clear separation between frontend, backend, database, cache, and storage layers
- **Stateless Services**: ✅ PASS - Backend servers are stateless; WebSocket state synchronized via Redis Pub/Sub
- **Horizontal Scalability**: ✅ PASS - All components designed to scale horizontally (app servers, DB replicas, Redis cluster)
- **No Single Points of Failure**: ✅ PASS - Load balancer, multiple backend instances, DB replicas, Redis cluster, distributed storage

### ✅ Code Quality Standards

- **Type Safety**: ✅ PASS - TypeScript used throughout frontend and backend
- **Testing Strategy**: ✅ PASS - Unit tests (Jest/Vitest), integration tests (Supertest), component tests (RTL), load tests defined
- **Input Validation**: ✅ PASS - Zod schemas for validation, sanitize-html for XSS prevention, parameterized queries for SQL injection
- **Error Handling**: ✅ PASS - Structured error responses, proper HTTP status codes, logging with Winston

### ✅ Security Requirements

- **Authentication**: ✅ PASS - JWT with access (15min) and refresh (7 days) tokens
- **Authorization**: ✅ PASS - Route-level middleware, chat membership verification, contact relationship checks
- **Data Protection**: ✅ PASS - bcrypt password hashing (12 rounds), HTTPS/TLS, secure session storage in Redis
- **Rate Limiting**: ✅ PASS - Multiple rate limits defined (login, messaging, contact requests, API calls, uploads)
- **Input Sanitization**: ✅ PASS - HTML sanitization, file type validation, size limits enforced

### ✅ Performance Standards

- **Response Time**: ✅ PASS - Targets defined: avg <100ms, p95 <300ms, p99 <500ms
- **Throughput**: ✅ PASS - 50 msg/sec sustained, 100 msg/sec spikes
- **Concurrency**: ✅ PASS - 1,000 concurrent WebSocket connections supported
- **Caching Strategy**: ✅ PASS - Multi-layer cache (in-memory, Redis, PostgreSQL), cache-aside and write-through patterns

### ✅ Data Management

- **Persistence**: ✅ PASS - PostgreSQL ACID compliance, transaction integrity, zero data loss on crashes
- **Backup/Recovery**: ✅ PASS - Automated backups, point-in-time recovery, data retention policies defined
- **Data Model**: ✅ PASS - Normalized schema with proper indexes, foreign keys, constraints
- **Migration Strategy**: ✅ PASS - Prisma migrations for schema changes

### ⚠️ Complexity Considerations

- **Multi-Project Structure**: ⚠️ JUSTIFIED - Requires separation of frontend/backend for independent deployment and scaling
- **Multiple Storage Systems**: ⚠️ JUSTIFIED - Each storage serves distinct purpose: PostgreSQL (structured data), Redis (real-time/cache), MinIO/S3 (large files)
- **WebSocket + REST**: ⚠️ JUSTIFIED - WebSocket for real-time bidirectional communication, REST for standard CRUD operations

### 📋 Pre-Design Checklist

- [x] All technical dependencies identified and versioned
- [x] Performance requirements quantified with specific metrics
- [x] Security requirements documented and testable
- [x] Scalability strategy defined with concrete numbers
- [x] Data persistence and integrity mechanisms specified
- [x] Testing strategy covers all layers (unit, integration, e2e, load)
- [x] Deployment architecture designed for high availability
- [x] No unresolved NEEDS CLARIFICATION in Technical Context

**Status**: ✅ **APPROVED** - All gates passed. Ready to proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-messenger-app/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── openapi.yaml     # OpenAPI 3.0 specification
├── checklists/
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

backend/
├── src/
│   ├── app.ts                      # Express app setup
│   ├── server.ts                   # Server entry point
│   ├── config/                     # Configuration modules
│   │   ├── constants.ts
│   │   ├── database.ts             # PostgreSQL connection
│   │   ├── env.ts                  # Environment variables
│   │   ├── redis.ts                # Redis connection
│   │   └── storage.ts              # MinIO/S3 configuration
│   ├── controllers/                # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── contact.controller.ts
│   │   ├── health.controller.ts
│   │   ├── message.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── error.middleware.ts     # Error handling
│   │   ├── rate-limit.middleware.ts
│   │   ├── security.middleware.ts  # Helmet, CORS, etc.
│   │   └── validation.middleware.ts # Zod validation
│   ├── repositories/               # Data access layer
│   │   ├── chat.repository.ts
│   │   ├── contact.repository.ts
│   │   ├── message.repository.ts
│   │   └── user.repository.ts
│   ├── services/                   # Business logic
│   │   ├── auth.service.ts
│   │   ├── message.service.ts
│   │   ├── session.service.ts
│   │   ├── storage.service.ts      # Image upload/processing
│   │   └── user.service.ts
│   ├── routes/                     # API routes
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── health.routes.ts
│   │   ├── message.routes.ts
│   │   └── user.routes.ts
│   ├── websocket/                  # WebSocket logic
│   │   ├── socket.manager.ts       # Connection management
│   │   ├── handlers/               # Event handlers
│   │   │   ├── message.handler.ts
│   │   │   ├── presence.handler.ts
│   │   │   ├── read-receipt.handler.ts
│   │   │   └── typing.handler.ts
│   │   └── middleware/
│   │       └── socket-auth.middleware.ts
│   ├── queues/                     # Message delivery queues
│   │   └── message-delivery.queue.ts
│   ├── utils/                      # Utility functions
│   │   ├── jwt.util.ts
│   │   ├── logger.util.ts
│   │   ├── password.util.ts
│   │   └── validators.util.ts
│   └── database/
│       └── migrations/             # Database migrations
│           └── 001_initial_schema.sql
├── tests/
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── load/                       # Load/performance tests
├── Dockerfile
├── package.json
├── tsconfig.json
└── env.example

frontend/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component
│   ├── components/                 # React components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── chat/
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── Message.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── contacts/
│   │   │   ├── ContactList.tsx
│   │   │   ├── ContactRequest.tsx
│   │   │   └── UserSearch.tsx
│   │   ├── groups/
│   │   │   ├── GroupCreate.tsx
│   │   │   ├── GroupSettings.tsx
│   │   │   └── ParticipantList.tsx
│   │   └── common/
│   │       ├── Avatar.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── pages/                      # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ContactsPage.tsx
│   │   └── ProfilePage.tsx
│   ├── store/                      # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── contactStore.ts
│   │   └── userStore.ts
│   ├── services/                   # API/WebSocket services
│   │   ├── api.service.ts          # Axios HTTP client
│   │   └── websocket.service.ts    # Socket.IO client
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useWebSocket.ts
│   │   └── useInfiniteScroll.ts
│   ├── config/                     # Configuration
│   │   └── index.ts
│   ├── types/                      # TypeScript types
│   │   ├── api.types.ts
│   │   ├── chat.types.ts
│   │   └── user.types.ts
│   └── utils/                      # Utility functions
│       ├── date.utils.ts
│       ├── format.utils.ts
│       └── validation.utils.ts
├── public/
│   └── index.html
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── nginx.conf                      # Nginx config for production
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js

# Infrastructure
docker-compose.yml                  # Local development setup
docker-compose.prod.yml             # Production setup

k8s/                                # Kubernetes manifests
├── namespace.yaml
├── backend-deployment.yaml
├── frontend-deployment.yaml
├── postgres-statefulset.yaml
├── redis-statefulset.yaml
├── ingress.yaml
└── configmaps/

docs/                               # Project documentation
├── arch.md                         # Architecture documentation
└── frd.md                          # Functional requirements

tools/                              # Development tools
└── performance-test/               # Load testing tool
    ├── load-test.ts
    └── package.json
```

**Structure Decision**: Web application structure selected with clear frontend/backend separation. This architecture supports:
- Independent deployment and scaling of frontend/backend
- Technology-specific optimizations (Node.js for backend, Vite for frontend build)
- Team specialization (frontend developers, backend developers)
- Different release cycles if needed
- Easy migration to microservices if required in future

The backend follows a layered architecture (routes → controllers → services → repositories) for maintainability and testability. The frontend uses component-based architecture with centralized state management via Zustand.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Multi-project structure (frontend + backend) | Independent deployment, scaling, and development workflows; frontend needs CDN deployment, backend needs container orchestration | Monolithic architecture would couple deployment cycles, prevent independent scaling, and make frontend optimization (static hosting, CDN) impossible |
| Multiple storage systems (PostgreSQL + Redis + MinIO/S3) | Each serves distinct, non-overlapping purpose with specific requirements | PostgreSQL alone: Cannot handle real-time pub/sub at scale or cache hot data efficiently; Redis alone: No ACID guarantees or persistent storage; File system: No scalability or CDN integration for images |
| Dual communication patterns (REST + WebSocket) | REST for CRUD operations (idempotent, cacheable), WebSocket for real-time bidirectional communication (typing indicators, instant delivery) | REST alone: Requires constant polling, wastes bandwidth, adds latency; WebSocket alone: Overcomplicates simple CRUD operations, harder to cache, debug, and test |

**Justification Summary**: The complexity is essential for meeting the non-functional requirements (1000 concurrent users, <100ms latency, 99.9% uptime, horizontal scaling). Each component addresses specific technical constraints that simpler alternatives cannot satisfy at the required scale and performance level.
