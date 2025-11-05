# WebSocket Events Documentation

Complete reference for WebSocket events in the 1000-messenger application.

## Table of Contents
- [Connection](#connection)
- [Authentication Events](#authentication-events)
- [Message Events](#message-events)
- [Typing Indicators](#typing-indicators)
- [Presence Events](#presence-events)
- [Read Receipts](#read-receipts)
- [Reaction Events](#reaction-events)
- [Chat Events](#chat-events)
- [User Profile Events](#user-profile-events)
- [Error Events](#error-events)

## Connection

### Client → Server: `connect`
Establish WebSocket connection with authentication

**Payload**:
```typescript
{
  auth: {
    token: string  // JWT access token
  }
}
```

**Example**:
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Server → Client: `connect`
Connection established successfully

**Payload**: None

### Server → Client: `disconnect`
Connection closed

**Payload**:
```typescript
{
  reason: string  // Disconnect reason
}
```

**Disconnect Reasons**:
- `io server disconnect` - Server initiated disconnect
- `io client disconnect` - Client initiated disconnect
- `ping timeout` - Connection timeout
- `transport close` - Network error
- `transport error` - Transport error

---

## Authentication Events

### Server → Client: `unauthorized`
Authentication failed

**Payload**:
```typescript
{
  message: string  // Error message
}
```

**Example Response**:
```typescript
{
  message: "Invalid token"
}
```

---

## Message Events

### Client → Server: `message:send`
Send a new message

**Payload**:
```typescript
{
  chatId: string
  content: string
  contentType?: 'text' | 'image' | 'system'
  metadata?: Record<string, unknown>
  replyToId?: string  // ID of message being replied to
}
```

**Example**:
```typescript
socket.emit('message:send', {
  chatId: 'chat-123',
  content: 'Hello, world!',
  contentType: 'text'
});
```

### Server → Client: `message:new`
New message received

**Payload**:
```typescript
{
  id: string
  chatId: string
  senderId: string
  sender: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
  }
  content: string
  contentType: 'text' | 'image' | 'system'
  metadata?: Record<string, unknown>
  replyToId?: string
  replyTo?: Message  // Full replied-to message object
  createdAt: string  // ISO timestamp
  isEdited: boolean
  reactions: Reaction[]
}
```

**Example**:
```typescript
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Add to message list in UI
});
```

### Client → Server: `message:edit`
Edit an existing message

**Payload**:
```typescript
{
  messageId: string
  content: string
}
```

### Server → Client: `message:edited`
Message was edited

**Payload**:
```typescript
{
  messageId: string
  chatId: string
  content: string
  editedAt: string  // ISO timestamp
}
```

### Client → Server: `message:delete`
Delete a message

**Payload**:
```typescript
{
  messageId: string
}
```

### Server → Client: `message:deleted`
Message was deleted

**Payload**:
```typescript
{
  messageId: string
  chatId: string
  deletedAt: string  // ISO timestamp
}
```

---

## Typing Indicators

### Client → Server: `typing:start`
User started typing

**Payload**:
```typescript
{
  chatId: string
}
```

**Example**:
```typescript
const handleTyping = () => {
  socket.emit('typing:start', { chatId: currentChatId });
};
```

### Server → Client: `typing:start`
Another user started typing

**Payload**:
```typescript
{
  chatId: string
  userId: string
  user: {
    id: string
    username: string
    displayName?: string
  }
}
```

### Client → Server: `typing:stop`
User stopped typing

**Payload**:
```typescript
{
  chatId: string
}
```

### Server → Client: `typing:stop`
Another user stopped typing

**Payload**:
```typescript
{
  chatId: string
  userId: string
}
```

**Note**: Typing indicators automatically timeout after 3 seconds on the server.

---

## Presence Events

### Client → Server: `user:online`
User came online (sent automatically on connection)

**Payload**: None (user identified by auth token)

### Server → Client: `user:online`
A contact/participant came online

**Payload**:
```typescript
{
  userId: string
  user: {
    id: string
    username: string
    status: 'online'
    lastSeen: string  // ISO timestamp
  }
}
```

### Client → Server: `user:offline`
User going offline (sent automatically on disconnect)

**Payload**: None

### Server → Client: `user:offline`
A contact/participant went offline

**Payload**:
```typescript
{
  userId: string
  user: {
    id: string
    username: string
    status: 'offline'
    lastSeen: string  // ISO timestamp
  }
}
```

### Server → Client: `user:status`
User status changed (online/away/offline)

**Payload**:
```typescript
{
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen?: string  // ISO timestamp
}
```

---

## Read Receipts

### Client → Server: `message:read`
Mark message as read

**Payload**:
```typescript
{
  messageId: string
  chatId: string
}
```

### Client → Server: `chat:mark-all-read`
Mark all messages in chat as read

**Payload**:
```typescript
{
  chatId: string
}
```

### Server → Client: `message:read`
Message was read by a user

**Payload**:
```typescript
{
  messageId: string
  chatId: string
  readBy: string  // User ID
  readAt: string  // ISO timestamp
  readCount?: {
    total: number  // Total participants
    read: number   // Number who read
  }
}
```

**Example**:
```typescript
socket.on('message:read', (data) => {
  // Update message delivery status in UI
  updateMessageStatus(data.messageId, 'read');
});
```

---

## Reaction Events

### Client → Server: `reaction:add`
Add reaction to message

**Payload**:
```typescript
{
  messageId: string
  emoji: string
}
```

**Example**:
```typescript
socket.emit('reaction:add', {
  messageId: 'msg-123',
  emoji: '👍'
});
```

### Server → Client: `reaction:added`
Reaction was added to message

**Payload**:
```typescript
{
  id: string
  messageId: string
  userId: string
  user: {
    id: string
    username: string
  }
  emoji: string
  createdAt: string  // ISO timestamp
}
```

### Client → Server: `reaction:remove`
Remove reaction from message

**Payload**:
```typescript
{
  reactionId: string
  messageId: string
}
```

### Server → Client: `reaction:removed`
Reaction was removed from message

**Payload**:
```typescript
{
  reactionId: string
  messageId: string
  userId: string
}
```

---

## Chat Events

### Server → Client: `chat:created`
New chat was created (you were added to it)

**Payload**:
```typescript
{
  id: string
  type: 'direct' | 'group'
  name?: string  // For group chats
  participants: Participant[]
  createdAt: string
}
```

### Server → Client: `chat:updated`
Chat details were updated

**Payload**:
```typescript
{
  chatId: string
  name?: string
  avatarUrl?: string
  updatedAt: string
}
```

### Server → Client: `chat:participant:added`
New participant added to group chat

**Payload**:
```typescript
{
  chatId: string
  participant: {
    userId: string
    user: {
      id: string
      username: string
      displayName?: string
    }
    role: 'owner' | 'admin' | 'member'
    joinedAt: string
  }
}
```

### Server → Client: `chat:participant:removed`
Participant removed from group chat

**Payload**:
```typescript
{
  chatId: string
  userId: string
  removedAt: string
}
```

### Server → Client: `chat:participant:left`
Participant left group chat

**Payload**:
```typescript
{
  chatId: string
  userId: string
  leftAt: string
}
```

---

## User Profile Events

### Server → Client: `user:profile:update`
User profile was updated

**Payload**:
```typescript
{
  userId: string
  user: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
    status: 'online' | 'away' | 'offline'
  }
  timestamp: string  // ISO timestamp
}
```

**Example**:
```typescript
socket.on('user:profile:update', (data) => {
  // Update user profile in UI
  if (data.userId === currentUser.id) {
    updateCurrentUserProfile(data.user);
  }
});
```

---

## Error Events

### Server → Client: `error`
Generic error occurred

**Payload**:
```typescript
{
  message: string
  code?: string
  details?: Record<string, unknown>
}
```

**Common Error Codes**:
- `UNAUTHORIZED` - Authentication failed
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid data

**Example**:
```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  showErrorNotification(error.message);
});
```

---

## Event Rooms

WebSocket uses rooms for efficient message routing:

### Room Types

1. **User Room**: `user:{userId}`
   - Personal room for each user
   - Used for: DMs, notifications, presence updates

2. **Chat Room**: `chat:{chatId}`
   - Room for each chat/conversation
   - Used for: Messages, typing indicators, read receipts

3. **Global Events**: No specific room
   - Used for: System-wide announcements

### Automatic Room Joining

When a user connects:
- Joins their user room: `user:{userId}`
- Joins all chat rooms they're a participant in: `chat:{chatId}`

When a user joins/leaves a chat:
- Automatically joined to/removed from chat room

---

## Best Practices

### Connection Management

```typescript
// Auto-reconnect on disconnect
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected, manually reconnect
    socket.connect();
  }
  // Otherwise Socket.IO will automatically reconnect
});

// Handle reconnection
socket.on('connect', () => {
  console.log('Connected to WebSocket');
  // Re-fetch any missed data
});
```

### Error Handling

```typescript
// Always handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show user-friendly error message
});

// Add timeout for emitted events
socket.timeout(5000).emit('message:send', data, (err, response) => {
  if (err) {
    console.error('Timeout sending message');
  }
});
```

### Rate Limiting

WebSocket events are rate-limited:
- **Message events**: 50 per minute per user
- **Typing events**: 10 per minute per chat
- **Reaction events**: 30 per minute per user

### Clean Disconnection

```typescript
// On logout or page unload
window.addEventListener('beforeunload', () => {
  socket.disconnect();
});
```

---

## Testing WebSocket Events

### Using Browser DevTools

```typescript
// In browser console
const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Listen to all events
const originalEmit = socket.emit;
const originalOn = socket.on;

socket.on = function(event, handler) {
  console.log('Registered listener for:', event);
  return originalOn.call(this, event, (...args) => {
    console.log('Received event:', event, args);
    return handler(...args);
  });
};

socket.emit = function(event, ...args) {
  console.log('Emitting event:', event, args);
  return originalEmit.call(this, event, ...args);
};
```

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3001/socket.io/?EIO=4&transport=websocket&token=YOUR_JWT_TOKEN"

# Send events (after connection established)
42["message:send",{"chatId":"chat-123","content":"Hello"}]
```

### Using Socket.IO Client (Node.js)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected');

  // Send message
  socket.emit('message:send', {
    chatId: 'chat-123',
    content: 'Test message'
  });
});

socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

---

## Monitoring

### Server-side Monitoring

```typescript
// Log all events (development only)
io.on('connection', (socket) => {
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    logger.debug(`Emitting to ${socket.id}:`, event, args);
    return originalEmit.call(this, event, ...args);
  };
});

// Track connection count
console.log('Connected clients:', io.engine.clientsCount);

// Track rooms
const rooms = io.sockets.adapter.rooms;
console.log('Active rooms:', Array.from(rooms.keys()));
```

### Metrics to Track

- Active connections
- Events per second
- Average latency
- Error rate by event type
- Room membership counts

---

## See Also

- [Deployment Guide](./deployment.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Architecture Documentation](./arch.md)
