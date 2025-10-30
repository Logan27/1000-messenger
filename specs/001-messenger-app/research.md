# Research & Technical Decisions: Real-Time Messenger Application

**Date**: October 28, 2025  
**Feature**: Real-Time Messenger Application  
**Status**: Completed - All technical decisions documented

## Purpose

This document consolidates all architectural decisions, technology choices, and best practices for implementing the messenger application. Since the architecture is already defined and partially implemented, this serves as the authoritative reference for the technical approach.

---

## 1. Technology Stack Decisions

### 1.1 Backend Runtime & Language

**Decision**: Node.js 20 LTS with TypeScript 5+

**Rationale**:
- **WebSocket Support**: Node.js excels at handling concurrent WebSocket connections through its event-driven architecture
- **Single Language**: JavaScript/TypeScript across frontend and backend reduces context switching
- **Rich Ecosystem**: Mature libraries for Socket.IO, Express, Prisma, and Redis integration
- **Performance**: V8 engine provides excellent performance for I/O-bound operations like chat
- **Type Safety**: TypeScript adds compile-time type checking, reducing runtime errors

**Alternatives Considered**:
- **Python (FastAPI)**: Slower WebSocket performance, less mature Socket.IO alternative
- **Go**: Excellent performance but smaller ecosystem, steeper learning curve
- **Java (Spring Boot)**: More verbose, heavier resource footprint

**Best Practices**:
- Use strict TypeScript configuration (`strict: true`)
- Enable ESLint and Prettier for code consistency
- Implement repository pattern for data access abstraction
- Use dependency injection for testability
- Follow async/await patterns, avoid callback hell

---

### 1.2 Real-Time Communication

**Decision**: Socket.IO 4.6+ for WebSocket with automatic fallback to HTTP long-polling

**Rationale**:
- **Automatic Fallback**: Gracefully degrades to long-polling when WebSocket unavailable
- **Multi-Server Support**: Built-in Redis adapter for horizontal scaling
- **Event-Based**: Clean event-driven API for bidirectional communication
- **Room Management**: Native support for chat rooms and targeted broadcasts
- **Battle-Tested**: Widely adopted with proven reliability

**Alternatives Considered**:
- **Native WebSocket API**: Requires manual fallback implementation, no room management
- **Server-Sent Events (SSE)**: Unidirectional only, not suitable for chat
- **gRPC Streaming**: Overly complex, requires HTTP/2, less browser support

**Implementation Pattern**:
```typescript
// Multi-server synchronization via Redis Pub/Sub
const io = new Server(httpServer, {
  adapter: createAdapter(redisPubClient, redisSubClient),
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
});

// Sticky sessions required at load balancer level
// Nginx: hash $remote_addr consistent;
```

**Best Practices**:
- Authenticate WebSocket connections using JWT tokens
- Implement heartbeat mechanism to detect stale connections
- Use room-based architecture (user rooms, chat rooms)
- Publish critical events to Redis for cross-server delivery
- Implement exponential backoff for client reconnections

---

### 1.3 Database Layer

**Decision**: PostgreSQL 15+ with Prisma 5+ ORM

**Rationale**:
- **ACID Compliance**: Guarantees data integrity for financial-grade reliability
- **Full-Text Search**: Native support via `tsvector` and GIN indexes
- **JSON Support**: JSONB type for flexible metadata storage
- **Read Replicas**: Built-in streaming replication for horizontal scaling
- **Mature Ecosystem**: Excellent tooling, monitoring, and community support

**Prisma Advantages**:
- Type-safe database client generated from schema
- Automatic migrations with rollback capability
- Connection pooling out of the box
- Query optimization and N+1 prevention

**Alternatives Considered**:
- **MongoDB**: Lacks ACID guarantees, eventual consistency issues
- **MySQL**: Weaker full-text search, less robust JSON support
- **DynamoDB**: Vendor lock-in, complex pricing, limited querying

**Schema Design Principles**:
- Normalize data to 3NF to prevent anomalies
- Use UUIDs for primary keys (better for distributed systems)
- Create composite indexes for common query patterns
- Partition large tables (messages) by date for performance
- Use foreign key constraints for referential integrity

**Best Practices**:
- Separate read and write connection pools
- Use read replicas for heavy read operations
- Implement cursor-based pagination for real-time data
- Create covering indexes to avoid table lookups
- Monitor slow queries with `pg_stat_statements`

---

### 1.4 Caching & Pub/Sub Layer

**Decision**: Redis 7+ Cluster (3 masters + 3 replicas)

**Rationale**:
- **Pub/Sub**: Essential for synchronizing WebSocket events across backend servers
- **Session Storage**: Fast session retrieval with automatic expiration
- **Message Queue**: Redis Streams for reliable message delivery
- **Cache Layer**: Sub-millisecond read performance for hot data
- **High Availability**: Cluster mode provides automatic failover

**Use Cases**:
1. **Pub/Sub**: Broadcast WebSocket events to all backend instances
2. **Sessions**: Store JWT refresh tokens with TTL
3. **Online Users**: Track active users with sorted sets
4. **Message Queue**: Queue messages for offline users (Redis Streams)
5. **Rate Limiting**: Sliding window counters for abuse prevention
6. **Cache**: User profiles, chat metadata, message lists (5-60 min TTL)

**Alternatives Considered**:
- **Memcached**: No pub/sub, no persistence, limited data structures
- **RabbitMQ**: Overkill for pub/sub, unnecessary complexity
- **Kafka**: Too heavy for this scale, complex operations

**Best Practices**:
- Use Redis Cluster for horizontal scaling (16,384 hash slots)
- Implement cache-aside pattern with lazy loading
- Set appropriate TTLs based on data volatility
- Monitor memory usage and eviction policies
- Use pipelining for bulk operations

---

### 1.5 Object Storage

**Decision**: MinIO (S3-compatible) with CDN integration

**Rationale**:
- **S3 Compatibility**: Easy migration to AWS S3/CloudFlare R2 if needed
- **Self-Hosted**: Cloud-agnostic, runs on local infrastructure
- **CDN-Friendly**: Direct integration with CloudFlare/CloudFront
- **Scalable**: Distributed architecture handles petabytes
- **Cost-Effective**: No per-request charges like AWS S3

**Image Processing Strategy**:
```
Upload → Validate → Process (Sharp) → Generate 3 sizes → Store → Return URLs
         (type,   (resize,          (original,            (MinIO) (signed)
          size)    compress)         medium,
                                     thumbnail)
```

**Alternatives Considered**:
- **File System**: Not scalable, no CDN integration, backup complexity
- **Database BLOBs**: Poor performance, bloats database
- **AWS S3 Direct**: Vendor lock-in, higher costs at scale

**Best Practices**:
- Generate signed URLs with expiration for security
- Create multiple image sizes at upload time (avoid on-demand)
- Use sharp library for fast, memory-efficient processing
- Implement multipart upload for large files
- Set up lifecycle policies for archival/deletion

---

## 2. Architecture Patterns

### 2.1 Backend Architecture

**Decision**: Layered Architecture (Routes → Controllers → Services → Repositories)

**Rationale**:
- **Separation of Concerns**: Each layer has single responsibility
- **Testability**: Easy to mock dependencies for unit tests
- **Maintainability**: Changes isolated to specific layers
- **Scalability**: Can extract services to microservices if needed

**Layer Responsibilities**:
```
Routes       → Define HTTP endpoints, apply middleware
Controllers  → Parse requests, validate input, format responses
Services     → Business logic, orchestrate operations
Repositories → Data access, query construction
```

**Best Practices**:
- Keep controllers thin (delegation only)
- Put business logic in services
- Use dependency injection for loose coupling
- Return domain objects from services, not DB records
- Handle errors at appropriate layer (validation → controller, business → service)

---

### 2.2 Real-Time Message Flow

**Decision**: Event-driven architecture with Redis Pub/Sub for multi-server synchronization

**Message Delivery Flow**:
```
1. Client sends message via WebSocket
2. Backend validates and persists to PostgreSQL (ACID transaction)
3. Backend publishes event to Redis Pub/Sub
4. All backend servers receive pub/sub notification
5. Servers emit to connected clients in target chat room
6. Undelivered messages queued in Redis Streams
7. Offline users receive on reconnection
8. Acknowledgments update delivery status in PostgreSQL
```

**Why This Pattern**:
- **Reliability**: PostgreSQL persistence ensures zero message loss
- **Scalability**: Redis Pub/Sub enables horizontal backend scaling
- **Performance**: In-memory pub/sub provides <10ms broadcast latency
- **Resilience**: Redis Streams ensure offline message delivery

**Best Practices**:
- Always persist before publishing to pub/sub
- Use idempotent message IDs to handle duplicates
- Implement retry logic with exponential backoff
- Dead letter queue for failed deliveries after max retries
- Monitor queue depth for performance issues

---

### 2.3 Authentication & Authorization

**Decision**: JWT-based authentication with access + refresh token pattern

**Token Strategy**:
- **Access Token**: Short-lived (15 minutes), contains user ID and permissions
- **Refresh Token**: Long-lived (7 days), stored in Redis, rotated on use
- **Storage**: Access token in memory, refresh token in httpOnly cookie

**Security Measures**:
- bcrypt password hashing (12 rounds)
- Rate limiting on auth endpoints (5 attempts / 15 min)
- Token rotation prevents replay attacks
- Redis blacklist for immediate token revocation

**Authorization Levels**:
1. **Public**: Registration, login (no auth)
2. **Authenticated**: Basic operations (valid access token)
3. **Contact-Verified**: Direct messaging (mutual contact required)
4. **Group Member**: Group operations (membership verified)
5. **Group Owner/Admin**: Management operations (role-based)

**Best Practices**:
- Never store passwords in plain text (bcrypt only)
- Use environment variables for JWT secrets (min 32 chars)
- Implement refresh token rotation on every use
- Set short access token expiration (15 min max)
- Validate permissions at every API endpoint

---

## 3. Scalability Decisions

### 3.1 Horizontal Scaling Strategy

**Decision**: Stateless backend servers with sticky sessions for WebSocket

**Architecture**:
```
Load Balancer (Sticky Sessions) → Backend 1, 2, 3, N
                                   ↓ ↓ ↓
                        Redis Pub/Sub (Synchronization)
                        PostgreSQL (Shared State)
```

**Scaling Triggers**:
- **CPU > 70%**: Add backend instance
- **Memory > 80%**: Add backend instance
- **Active Connections > 300/instance**: Add backend instance

**Target Capacity**:
- 1,000 concurrent users = 3-4 backend instances
- Each instance handles ~300 WebSocket connections
- PostgreSQL: 1 primary + 2 read replicas
- Redis: 3-node cluster (HA)

**Best Practices**:
- Use Kubernetes HPA (Horizontal Pod Autoscaler)
- Configure sticky sessions at load balancer (hash by client IP)
- Monitor connection distribution across instances
- Test failover scenarios (kill instance during peak)
- Set up blue-green deployment for zero-downtime releases

---

### 3.2 Database Scaling Strategy

**Decision**: Read-write split with read replicas + connection pooling

**Read/Write Split**:
```typescript
// Write operations → Primary
const writePool = new Pool({ connectionString: PRIMARY_URL, max: 100 });

// Read operations → Replicas (round-robin)
const readPool = new Pool({ connectionString: REPLICA_URL, max: 50 });
```

**Connection Pool Sizing**:
```
Formula: (CPU cores × 2) + disk spindles
Example: (4 cores × 2) + 2 = 10 connections per backend
With 3 backends: 30 total connections to primary
```

**Performance Optimizations**:
- Composite indexes on `(chat_id, created_at DESC)` for message queries
- GIN index on message content for full-text search
- Partitioning messages table by month
- Archive messages older than 1 year to cold storage

**Best Practices**:
- Monitor replication lag (<1 second acceptable)
- Use connection pooling (never direct connections)
- Implement query timeout (5 seconds max)
- Log slow queries (>100ms) for optimization
- Regular VACUUM and ANALYZE for index maintenance

---

### 3.3 Caching Strategy

**Decision**: Multi-layer cache (In-Memory → Redis → PostgreSQL)

**Cache Hierarchy**:
```
Layer 1: In-Memory (Node.js) - LRU cache, 5-60 sec TTL
Layer 2: Redis - Distributed cache, 5-60 min TTL  
Layer 3: PostgreSQL - Source of truth
```

**What to Cache**:
- **User profiles**: 1 hour TTL (Redis)
- **Chat metadata**: 5 min TTL (Redis)
- **Message lists**: 5 min TTL (Redis)
- **Online users**: 1 min TTL (Redis)
- **Contact lists**: 10 min TTL (Redis)

**Cache Invalidation**:
- Write-through: Update cache on write operations
- Time-based: Automatic expiration via TTL
- Event-based: Publish cache invalidation via Redis Pub/Sub

**Best Practices**:
- Never cache user-specific sensitive data without encryption
- Use cache-aside pattern for reads (check cache → DB → set cache)
- Implement cache warming for critical data on startup
- Monitor cache hit ratio (target: >80%)
- Set appropriate TTLs based on data volatility

---

## 4. Security Decisions

### 4.1 Input Validation & Sanitization

**Decision**: Multi-layer validation (Client → Server → Database)

**Validation Layers**:
1. **Frontend**: Zod schemas for immediate feedback
2. **Backend API**: Zod middleware for request validation
3. **Database**: Constraints and check constraints

**Sanitization**:
```typescript
// HTML sanitization for message content
import sanitizeHtml from 'sanitize-html';

const sanitized = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong', 'u'],
  allowedAttributes: {},
  disallowedTagsMode: 'escape',
});
```

**Protection Against**:
- **XSS**: Sanitize HTML, set CSP headers, escape output
- **SQL Injection**: Parameterized queries only (Prisma/pg)
- **NoSQL Injection**: Validate input types, no eval()
- **Path Traversal**: Whitelist file paths, no user-controlled paths
- **CSRF**: SameSite cookies, CORS configuration

**Best Practices**:
- Validate all user input at API boundary
- Whitelist allowed values, don't blacklist
- Use schema validation libraries (Zod, Joi)
- Sanitize HTML before storage and display
- Set security headers (Helmet.js)

---

### 4.2 Rate Limiting Strategy

**Decision**: Multiple rate limits based on operation sensitivity

**Rate Limits**:
```typescript
// Authentication: Prevent brute force
authLimiter: 5 attempts / 15 minutes per username

// Messaging: Prevent spam
messageLimiter: 10 messages / second per user

// Contact Requests: Prevent abuse
contactLimiter: 50 requests / day per user

// API General: Prevent DoS
apiLimiter: 100 requests / minute per user

// Image Upload: Prevent resource exhaustion
uploadLimiter: 10 uploads / minute per user
```

**Implementation**:
- Use Redis for distributed rate limiting
- Sliding window algorithm for accuracy
- Return 429 status with Retry-After header
- Log rate limit violations for abuse detection

**Best Practices**:
- Set limits based on actual usage patterns
- Provide clear error messages with limits
- Implement temporary lockouts for repeated violations
- Monitor rate limit hit rates
- Adjust limits based on production metrics

---

## 5. Performance Optimizations

### 5.1 Database Query Optimization

**Decisions**:

**1. Composite Indexes for Common Queries**:
```sql
-- Message retrieval (most common query)
CREATE INDEX idx_messages_chat_created 
ON messages(chat_id, created_at DESC)
INCLUDE (sender_id, content)
WHERE is_deleted = FALSE;
```

**2. Full-Text Search Index**:
```sql
-- GIN index for fast text search
CREATE INDEX idx_messages_search 
ON messages USING gin(to_tsvector('english', content))
WHERE is_deleted = FALSE;
```

**3. Cursor-Based Pagination**:
```typescript
// Better for real-time data than offset pagination
async getMessages(chatId: string, cursor?: Date, limit = 50) {
  return prisma.message.findMany({
    where: {
      chatId,
      createdAt: cursor ? { lt: cursor } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
```

**4. N+1 Query Prevention**:
```typescript
// Bad: N+1 queries
const messages = await getMessages(chatId);
for (const msg of messages) {
  msg.sender = await getUser(msg.senderId); // N queries!
}

// Good: Single JOIN query
const messages = await prisma.message.findMany({
  where: { chatId },
  include: { sender: true }, // Single query with JOIN
});
```

**Best Practices**:
- Use EXPLAIN ANALYZE to verify index usage
- Create covering indexes to avoid table lookups
- Avoid SELECT *, fetch only needed columns
- Use database connection pooling
- Monitor slow query log (>100ms threshold)

---

### 5.2 Image Processing Optimization

**Decision**: Generate multiple sizes at upload time using Sharp

**Processing Pipeline**:
```typescript
import sharp from 'sharp';

async function processImage(buffer: Buffer) {
  const [original, medium, thumbnail] = await Promise.all([
    // Original (optimized)
    sharp(buffer)
      .jpeg({ quality: 85, progressive: true })
      .toBuffer(),
    
    // Medium (800px)
    sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer(),
    
    // Thumbnail (300px)
    sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer(),
  ]);
  
  return { original, medium, thumbnail };
}
```

**Why Sharp**:
- 4-5x faster than ImageMagick
- Lower memory footprint
- Native Node.js module (libvips)
- Handles all required formats (JPEG, PNG, WebP, GIF)

**Best Practices**:
- Process images asynchronously (background queue)
- Set max image size limits (10MB)
- Validate image format before processing
- Store processed images, never reprocess on-demand
- Use progressive JPEG for better perceived performance

---

## 6. Testing Strategy

### 6.1 Testing Pyramid Approach

**Distribution**:
- **Unit Tests**: 60% (Fast, isolated, business logic)
- **Integration Tests**: 30% (API + Database interactions)
- **E2E Tests**: 10% (Critical user flows only)

**Tools**:
- **Backend Unit**: Jest 29+, Supertest for API tests
- **Frontend Unit**: Vitest 1+, React Testing Library
- **E2E**: Playwright for critical paths
- **Load Testing**: Custom tool (1000 users, 50 msg/sec)

**Coverage Goals**:
- **Overall**: 75% minimum
- **Services**: 85% (business logic critical)
- **Repositories**: 80% (data access critical)
- **Controllers**: 70% (mostly delegation)

**Best Practices**:
- Write tests before implementation (TDD for critical paths)
- Mock external dependencies (database, Redis, S3)
- Test error paths, not just happy paths
- Run tests in CI/CD pipeline (block PRs on failure)
- Monitor test execution time (<5 min total)

---

### 6.2 Load Testing Requirements

**Test Scenario**: 1,000 concurrent users, 50 messages/second, 60 seconds

**Success Criteria**:
- Message delivery success rate: >99.9%
- Average latency: <100ms
- P95 latency: <300ms
- P99 latency: <500ms
- Zero server crashes or errors
- Database connections stable
- Redis memory usage acceptable

**Implementation**:
```typescript
// tools/performance-test/load-test.ts
class LoadTest {
  async run() {
    // Connect 1000 WebSocket clients
    // Send 50 messages/sec distributed across users
    // Measure latency for each message
    // Calculate percentiles and success rate
  }
}
```

**Best Practices**:
- Run load tests in staging environment
- Simulate realistic user behavior (bursts, pauses)
- Monitor all system components during test
- Gradually ramp up load (0 → 1000 over 5 minutes)
- Test failure scenarios (kill server mid-test)

---

## 7. Deployment & Operations

### 7.1 Deployment Strategy

**Decision**: Blue-Green deployment with Kubernetes

**Process**:
1. Deploy new version (green) alongside current (blue)
2. Run smoke tests on green deployment
3. Switch Ingress/Service to point to green
4. Monitor metrics for 15 minutes
5. If issues: Rollback to blue (< 30 seconds)
6. If successful: Delete blue deployment

**Why Blue-Green**:
- Zero downtime deployments
- Instant rollback capability
- Full testing of new version before cutover
- No database migration issues (forward-compatible migrations)

**Best Practices**:
- Automate deployment via CI/CD (GitHub Actions)
- Run database migrations before deployment
- Use feature flags for gradual rollouts
- Implement health checks for readiness probes
- Monitor error rates during deployment

---

### 7.2 Monitoring & Alerting

**Decision**: Prometheus + Grafana + Winston logging

**Metrics to Monitor**:
- **Application**: Request rate, latency, error rate
- **WebSocket**: Active connections, message throughput
- **Database**: Query time, connection pool usage, replication lag
- **Redis**: Memory usage, hit rate, command latency
- **Infrastructure**: CPU, memory, disk, network

**Critical Alerts**:
- API error rate >1% for 5 minutes
- Average latency >200ms for 5 minutes
- WebSocket connections dropping >10/min
- Database replication lag >5 seconds
- Redis memory >80% capacity

**Best Practices**:
- Use structured logging (JSON format)
- Set up log aggregation (ELK stack optional)
- Create actionable alerts (avoid alert fatigue)
- Define SLOs and SLIs
- Set up on-call rotation with escalation

---

## 8. Assumptions & Constraints

### 8.1 Assumptions

1. **Users have modern browsers**: Chrome, Firefox, Safari, Edge (no IE11 support)
2. **Stable internet**: Graceful degradation for poor connections, but real-time features require connectivity
3. **Object storage available**: MinIO/S3-compatible storage configured
4. **English primary language**: Internationalization out of scope for v1
5. **Web-only platform**: Native mobile apps not in scope
6. **No video/voice**: Text and images only for v1
7. **Username-based auth**: No email verification required
8. **Indefinite retention**: Messages stored forever unless explicitly deleted
9. **Group size limit**: 300 participants sufficient for use cases
10. **Self-hosted deployment**: No SaaS/multi-tenancy requirements

### 8.2 Constraints

1. **Performance**: Must support 1,000 concurrent users with <100ms latency
2. **Scale**: Must handle 50 messages/second sustained
3. **Reliability**: 99.9% message delivery rate required
4. **Data integrity**: Zero message loss after server acknowledgment
5. **Security**: Industry-standard authentication and encryption
6. **Rate limits**: Prevent abuse without impacting legitimate users
7. **Image size**: 10MB max per image, 5 images per message
8. **Message length**: 10,000 characters maximum
9. **Search scope**: Full-text search on recent 3 months
10. **Deployment**: Must run on Kubernetes or Docker Compose

---

## 9. Implementation Priorities

### Phase 1: Core Foundation (Weeks 1-4)
✅ User authentication (registration, login, JWT)
✅ Contact management (add, accept, reject, remove)
✅ Direct messaging (send, receive, persistence)
✅ Basic UI (chat list, message window, input)

**Focus**: Get basic messaging working reliably

### Phase 2: Real-Time Features (Weeks 5-8)
- WebSocket integration (Socket.IO)
- Multi-server sync (Redis Pub/Sub)
- Typing indicators
- Read receipts
- Online/offline status

**Focus**: Make it feel responsive and real-time

### Phase 3: Rich Content (Weeks 9-10)
- Image upload and processing (Sharp)
- Thumbnail generation
- Text formatting (bold, italic)
- Message editing and deletion
- Emoji reactions

**Focus**: Enhanced user experience

### Phase 4: Groups & Search (Weeks 11-12)
- Group chat creation
- Group management (add/remove participants)
- Full-text message search
- Deep linking support

**Focus**: Collaboration features

### Phase 5: Production Ready (Weeks 13-14)
- Load testing and optimization
- Security hardening
- Monitoring and alerting
- Documentation
- Deployment automation

**Focus**: Production stability and operations

---

## 10. Open Questions & Risks

### Open Questions

None - All technical decisions have been made based on the comprehensive architecture document. The system design is complete and ready for implementation.

### Identified Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket scaling issues at 1000 users | High | Medium | Load test early, implement Redis Pub/Sub, monitor connection distribution |
| Database write contention | High | Low | Use read replicas, optimize indexes, partition messages table |
| Redis memory exhaustion | Medium | Medium | Set eviction policies, monitor usage, configure max memory limits |
| Image storage costs | Medium | Low | Implement compression, set retention policies, use CDN caching |
| Complex multi-server debugging | Medium | High | Implement distributed tracing, structured logging, request IDs |

---

## Conclusion

All technical decisions for the Real-Time Messenger Application have been documented and justified. The architecture is designed to meet all functional and non-functional requirements while maintaining scalability, reliability, and security.

**Key Strengths**:
- ✅ Proven technology stack (Node.js, PostgreSQL, Redis, Socket.IO)
- ✅ Horizontal scalability without single points of failure
- ✅ Comprehensive security measures
- ✅ Clear performance targets with monitoring
- ✅ Cloud-agnostic design

**Next Steps**:
1. Proceed to Phase 1: Generate data-model.md
2. Define API contracts in /contracts/
3. Update agent context for development
4. Begin implementation following phased approach

**Document Status**: ✅ Complete - Ready for Phase 1
