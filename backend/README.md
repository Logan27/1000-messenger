# Chat Backend API

Node.js backend service with TypeScript 5+ for the chat application.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3.2+
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5+
- **Cache**: Redis 7
- **Storage**: MinIO / AWS S3
- **Testing**: Jest
- **Linting**: ESLint with TypeScript support

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── repositories/     # Database access layer
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── websocket/        # WebSocket handlers
│   ├── queues/           # Message queue handlers
│   ├── database/         # Database migrations
│   ├── generated/        # Generated code (Prisma client, etc.)
│   ├── app.ts            # Express app setup
│   └── server.ts         # Entry point
├── prisma/
│   ├── schema.prisma     # Prisma schema definition
│   └── migrations/       # Prisma migrations (generated)
├── tests/                # Test files
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── prisma.config.ts      # Prisma configuration
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest configuration
├── .eslintrc.json        # ESLint configuration
├── Dockerfile            # Docker image definition
└── env.example           # Environment variables template

```

## Setup

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15
- Redis 7
- MinIO or AWS S3

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

### Docker Setup

For containerized deployment, see [DOCKER.md](./DOCKER.md) for detailed instructions.

Quick start with Docker:

```bash
# Build Docker image
docker build -t chat-backend:latest .

# Run with Docker Compose (recommended for development)
cd ..
docker-compose up -d backend
```

### Development

```bash
# Run development server (with auto-reload)
npm run dev

# Run TypeScript type checking
npm run type-check

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Build

```bash
# Compile TypeScript to JavaScript
npm run build

# Run production server
npm run start
```

### Database

```bash
# Run SQL migrations (initial schema)
npm run migrate

# Generate Prisma client (run after schema changes)
npm run prisma:generate

# Run Prisma migrations (development)
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database with test data
npm run seed
```

**Note**: The `npm run migrate` command runs SQL migrations from `src/database/migrations/` which includes the initial schema. For ongoing development, use Prisma migrations with `npm run prisma:migrate`.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage report
npm test:coverage
```

## Environment Variables

See `env.example` for all available environment variables:

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT access tokens
- `JWT_REFRESH_SECRET`: Secret for JWT refresh tokens
- `FRONTEND_URL`: Frontend URL for CORS
- `S3_ENDPOINT`: MinIO/S3 endpoint
- `S3_ACCESS_KEY`: S3 access key
- `S3_SECRET_KEY`: S3 secret key
- `S3_BUCKET`: S3 bucket name

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Chats

- `GET /api/chats` - Get user's chats
- `POST /api/chats/direct` - Create direct chat
- `POST /api/chats/group` - Create group chat
- `GET /api/chats/:id` - Get chat details
- `PUT /api/chats/:id` - Update chat
- `DELETE /api/chats/:id` - Delete chat

### Messages

- `GET /api/chats/:chatId/messages` - Get messages
- `POST /api/chats/:chatId/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/react` - Add reaction
- `DELETE /api/messages/:id/react` - Remove reaction

### Contacts

- `GET /api/contacts` - Get contacts
- `POST /api/contacts/request` - Send contact request
- `POST /api/contacts/accept/:id` - Accept request
- `POST /api/contacts/reject/:id` - Reject request
- `DELETE /api/contacts/:id` - Remove contact

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID

### Health

- `GET /api/health` - Health check
- `GET /api/health/ready` - Readiness check

## WebSocket Events

### Client → Server

- `message:send` - Send message
- `message:typing` - Typing indicator
- `message:read` - Mark message as read
- `presence:update` - Update online status

### Server → Client

- `message:new` - New message received
- `message:updated` - Message edited
- `message:deleted` - Message deleted
- `message:reaction` - New reaction
- `message:delivered` - Message delivered
- `message:read` - Message read
- `user:typing` - User is typing
- `user:presence` - User presence updated
- `chat:updated` - Chat updated

## Architecture

- **Layered Architecture**: Controllers → Services → Repositories
- **Dependency Injection**: Services and repositories injected via constructors
- **WebSocket Manager**: Centralized Socket.IO management with Redis adapter
- **Message Queue**: Redis Streams for reliable message delivery
- **Caching**: Redis for session and presence caching
- **Security**: Helmet, rate limiting, input validation, SQL injection protection
- **Logging**: Winston with structured logging

## Scripts

### Development
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server

### Prisma / Database
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run Prisma migrations (development)
- `npm run prisma:migrate:deploy` - Deploy migrations (production)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run migrate` - Run database migrations (legacy)
- `npm run seed` - Seed database

### Testing
- `npm test` - Run tests
- `npm test:watch` - Run tests in watch mode
- `npm test:coverage` - Run tests with coverage

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## License

MIT
