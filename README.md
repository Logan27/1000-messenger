# Chat Application - Skype Alternative

A modern, scalable chat application with real-time messaging, group chats, and file sharing.

## Features

- ✅ User registration and authentication
- ✅ Direct messaging (1-on-1)
- ✅ Group chats (up to 300 participants)
- ✅ Real-time messaging with WebSocket (fallback to polling)
- ✅ Message formatting (bold, italic)
- ✅ Image sharing
- ✅ Message reactions
- ✅ Read receipts
- ✅ Typing indicators
- ✅ Message search
- ✅ Deep links to chats and messages
- ✅ Multi-device support
- ✅ Persistent message history

## Tech Stack

### Backend
- Node.js 20+ with TypeScript
- Express.js
- Socket.IO (WebSocket with fallback)
- PostgreSQL 15
- Redis 7
- MinIO / AWS S3

### Frontend
- React 18+ with TypeScript
- Zustand (state management)
- Socket.IO Client
- TailwindCSS
- Vite

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker Compose (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd chat-application

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

Access the application:

- Frontend: http://localhost
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001

### Local Development

#### Backend
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env

# Start development server
npm run dev
```

## Deployment

### Docker Swarm
```bash
docker stack deploy -c docker-compose.prod.yml chat-app
```

### Kubernetes
```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n chat-app
```

## Performance Testing
```bash
cd tools/performance-test
npm install

# Run load test
NUM_USERS=1000 MSG_PER_SEC=50 DURATION=60 npm test
```

## API Documentation

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- POST /api/auth/refresh - Refresh access token

### Chats
- GET /api/chats - Get user's chats
- POST /api/chats/direct - Create direct chat
- POST /api/chats/group - Create group chat
- GET /api/chats/:id - Get chat details
- POST /api/chats/:id/messages - Send message

See full API documentation in /docs/api.md

## Architecture

- **Horizontal Scaling**: Multiple backend instances with Redis Pub/Sub
- **Reliable Delivery**: Redis Streams + PostgreSQL delivery tracking
- **Cloud Agnostic**: Runs locally with Docker or in any cloud (AWS, GCP, Azure)
- **WebSocket with Fallback**: Automatic fallback to long-polling

## License

MIT
