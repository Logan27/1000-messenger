# 1000-Messenger Quick Start Guide

Get the 1000-Messenger application up and running in 5 minutes.

## Prerequisites

- **Docker** & Docker Compose installed
- **Node.js** 20+ (for local development)
- **Git**

## Quick Start (Docker)

### 1. Clone and Start

```bash
# Clone repository
git clone https://github.com/your-org/1000-messenger.git
cd 1000-messenger

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Run Migrations

```bash
docker-compose exec backend npm run db:migrate
```

### 3. Access the Application

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **MinIO Console**: http://localhost:9001 (admin/minioadmin)

---

## End-to-End Validation Scenarios

### Scenario 1: User Registration and Login

**Goal**: Verify users can register and login.

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "Test123!",
    "passwordConfirm": "Test123!",
    "displayName": "Alice"
  }'

# Expected: 201 Created with user object and tokens
```

**✓ Success Criteria**:
- Returns 201 status
- Returns user object with id, username, displayName
- Returns accessToken and refreshToken

### Scenario 2: Send Direct Message

**Goal**: Verify two users can exchange messages.

**Steps**:
1. Register two users (Alice and Bob)
2. Alice sends contact request to Bob
3. Bob accepts request
4. Alice creates direct chat
5. Alice sends message
6. Bob receives message in real-time

```bash
# 1. Register Alice
ALICE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Test123!","passwordConfirm":"Test123!"}' \
  | jq -r '.accessToken')

# 2. Register Bob
BOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"Test123!","passwordConfirm":"Test123!"}')

BOB_TOKEN=$(echo $BOB_RESPONSE | jq -r '.accessToken')
BOB_ID=$(echo $BOB_RESPONSE | jq -r '.user.id')

# 3. Alice sends contact request to Bob
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"contactId\":\"$BOB_ID\"}"

# 4. Bob accepts (get contact ID first)
CONTACT_ID=$(curl -s http://localhost:3000/api/contacts/pending \
  -H "Authorization: Bearer $BOB_TOKEN" \
  | jq -r '.requests[0].id')

curl -X PUT http://localhost:3000/api/contacts/$CONTACT_ID/accept \
  -H "Authorization: Bearer $BOB_TOKEN"

# 5. Alice creates direct chat
CHAT_ID=$(curl -s -X POST http://localhost:3000/api/chats/direct \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"participantId\":\"$BOB_ID\"}" \
  | jq -r '.id')

# 6. Alice sends message
curl -X POST http://localhost:3000/api/chats/$CHAT_ID/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello Bob!","contentType":"text"}'

# 7. Bob receives messages
curl http://localhost:3000/api/chats/$CHAT_ID/messages \
  -H "Authorization: Bearer $BOB_TOKEN"
```

**✓ Success Criteria**:
- Contact request sent and accepted
- Direct chat created
- Message sent and received
- Message appears in both users' chat

### Scenario 3: Group Chat

**Goal**: Verify group chat functionality.

**Steps**:
1. Create group with 3 users
2. Send message to group
3. All members receive message

```bash
# (Assuming Alice, Bob, and Charlie tokens)

# Create group
curl -X POST http://localhost:3000/api/chats/group \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "participantIds": ["'$BOB_ID'", "'$CHARLIE_ID'"]
  }'
```

**✓ Success Criteria**:
- Group created successfully
- All participants can see group
- Messages broadcast to all members

### Scenario 4: Image Upload

**Goal**: Verify image upload and display.

```bash
# Upload image
curl -X POST http://localhost:3000/api/attachments/upload \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@test-image.jpg"

# Send message with image
curl -X POST http://localhost:3000/api/chats/$CHAT_ID/messages \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this image!",
    "contentType": "image",
    "metadata": {
      "images": [{
        "url": "http://localhost:9000/messenger-files/...",
        "thumbnailUrl": "http://localhost:9000/messenger-files/...",
        "originalUrl": "http://localhost:9000/messenger-files/..."
      }]
    }
  }'
```

**✓ Success Criteria**:
- Image uploaded successfully
- Thumbnail generated
- Image displayed in message

### Scenario 5: Real-Time Features

**Goal**: Verify WebSocket real-time functionality.

**Test in Browser Console**:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Send typing indicator
socket.emit('typing:start', { chatId: 'CHAT_ID' });

// Listen for typing
socket.on('user:typing', (data) => {
  console.log('User typing:', data);
});
```

**✓ Success Criteria**:
- WebSocket connects successfully
- Messages received in real-time
- Typing indicators work
- Online/offline status updates

### Scenario 6: Search Functionality

**Goal**: Verify message and user search.

```bash
# Search messages
curl "http://localhost:3000/api/messages/search?query=hello" \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Search users
curl "http://localhost:3000/api/users/search?query=bob" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**✓ Success Criteria**:
- Search returns relevant results
- Results highlighted correctly
- Can navigate to messages from results

---

## Performance Validation

### Load Test

```bash
cd tools/performance-test
npm install
npm run test:load
```

**Expected Results**:
```
✓ PASS - Target message rate (50-100 msg/s)
✓ PASS - P95 latency < 300ms
✓ PASS - P99 latency < 500ms
✓ PASS - Error rate < 1%
✓ PASS - All users connected

✓ ALL CHECKS PASSED
```

---

## Health Checks

### Backend Health

```bash
curl http://localhost:3000/api/health
```

**Expected**:
```json
{
  "status": "healthy",
  "database": { "connected": true },
  "redis": { "connected": true },
  "uptime": 123.45
}
```

### Database Check

```bash
docker-compose exec postgres psql -U messenger_user messenger -c "SELECT COUNT(*) FROM users;"
```

### Redis Check

```bash
docker-compose exec redis redis-cli ping
# Expected: PONG
```

### MinIO Check

```bash
curl http://localhost:9000/minio/health/live
# Expected: 200 OK
```

---

## Common Issues

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or change port
PORT=3001 docker-compose up -d backend
```

### Database Connection Failed

```bash
# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Frontend Not Loading

```bash
# Rebuild frontend
cd frontend
npm run build

# Restart container
docker-compose restart frontend
```

---

## Clean Slate Reset

To start fresh:

```bash
# Stop and remove all containers
docker-compose down -v

# Remove all data
rm -rf backend/node_modules frontend/node_modules
rm -rf postgres-data redis-data minio-data

# Restart
docker-compose up -d
docker-compose exec backend npm run db:migrate
```

---

## Next Steps

1. **Explore API**: Visit http://localhost:3000/docs
2. **Read Docs**: Check `/docs/` directory
3. **Deploy**: See `docs/deployment.md`
4. **Troubleshoot**: See `docs/troubleshooting.md`

---

## Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost | - |
| Backend API | http://localhost:3000 | - |
| API Docs | http://localhost:3000/docs | - |
| PostgreSQL | localhost:5432 | messenger_user / password |
| Redis | localhost:6379 | - |
| MinIO | http://localhost:9001 | admin / minioadmin |

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
