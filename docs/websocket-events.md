# WebSocket Events Documentation

Complete reference for all WebSocket events in the 1000-Messenger application.

## Connection

### Authentication

WebSocket connections require authentication via JWT token.

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Connection Events

#### `connect`
Emitted when successfully connected to the server.

```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

#### `disconnect`
Emitted when disconnected from the server.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### `connect_error`
Emitted when connection fails.

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

---

## Message Events

### Client → Server

#### `message:send`
Send a new message to a chat.

**Payload:**
```typescript
{
  chatId: string;
  content: string;
  contentType?: 'text' | 'image';
  replyToId?: string;
  metadata?: object;
}
```

**Example:**
```javascript
socket.emit('message:send', {
  chatId: 'chat-uuid-123',
  content: 'Hello, world!',
  contentType: 'text'
});
```

#### `message:edit`
Edit an existing message.

**Payload:**
```typescript
{
  messageId: string;
  content: string;
}
```

**Example:**
```javascript
socket.emit('message:edit', {
  messageId: 'message-uuid-456',
  content: 'Updated message content'
});
```

#### `message:delete`
Delete a message (soft delete).

**Payload:**
```typescript
{
  messageId: string;
}
```

**Example:**
```javascript
socket.emit('message:delete', {
  messageId: 'message-uuid-456'
});
```

#### `message:read`
Mark messages as read.

**Payload:**
```typescript
{
  chatId: string;
  messageIds: string[];
}
```

**Example:**
```javascript
socket.emit('message:read', {
  chatId: 'chat-uuid-123',
  messageIds: ['msg-1', 'msg-2', 'msg-3']
});
```

### Server → Client

#### `message:new`
Receive a new message.

**Payload:**
```typescript
{
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'system';
  metadata: object;
  replyToId?: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}
```

**Example:**
```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});
```

#### `message:edited`
Receive notification that a message was edited.

**Payload:**
```typescript
{
  id: string;
  chatId: string;
  content: string;
  isEdited: true;
  editedAt: string;
}
```

#### `message:deleted`
Receive notification that a message was deleted.

**Payload:**
```typescript
{
  id: string;
  chatId: string;
  content: '[Deleted]';
  isDeleted: true;
  deletedAt: string;
}
```

#### `message:delivered`
Receive confirmation that your message was delivered.

**Payload:**
```typescript
{
  messageId: string;
  chatId: string;
  status: 'delivered';
  deliveredAt: string;
}
```

#### `message:read`
Receive notification that your message was read.

**Payload:**
```typescript
{
  messageId: string;
  chatId: string;
  userId: string;
  readAt: string;
}
```

---

## Presence Events

### Client → Server

#### `presence:update`
Update your online status.

**Payload:**
```typescript
{
  status: 'online' | 'away' | 'offline';
}
```

**Example:**
```javascript
socket.emit('presence:update', {
  status: 'away'
});
```

### Server → Client

#### `user:status`
Receive updates when a contact's status changes.

**Payload:**
```typescript
{
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}
```

**Example:**
```javascript
socket.on('user:status', (data) => {
  console.log(`User ${data.userId} is now ${data.status}`);
  // Update contact list UI
});
```

---

## Typing Indicators

### Client → Server

#### `typing:start`
Indicate that you're typing in a chat.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example:**
```javascript
// Start typing
socket.emit('typing:start', {
  chatId: 'chat-uuid-123'
});
```

#### `typing:stop`
Indicate that you stopped typing.

**Payload:**
```typescript
{
  chatId: string;
}
```

**Example:**
```javascript
// Stop typing
socket.emit('typing:stop', {
  chatId: 'chat-uuid-123'
});
```

### Server → Client

#### `user:typing`
Receive notification that a user is typing.

**Payload:**
```typescript
{
  chatId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}
```

**Example:**
```javascript
socket.on('user:typing', (data) => {
  if (data.isTyping) {
    console.log(`${data.username} is typing...`);
  } else {
    console.log(`${data.username} stopped typing`);
  }
});
```

---

## Reaction Events

### Client → Server

#### `reaction:add`
Add a reaction to a message.

**Payload:**
```typescript
{
  messageId: string;
  emoji: string;
}
```

**Example:**
```javascript
socket.emit('reaction:add', {
  messageId: 'message-uuid-456',
  emoji: '👍'
});
```

#### `reaction:remove`
Remove your reaction from a message.

**Payload:**
```typescript
{
  reactionId: string;
  messageId: string;
}
```

### Server → Client

#### `reaction:added`
Receive notification of a new reaction.

**Payload:**
```typescript
{
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}
```

#### `reaction:removed`
Receive notification that a reaction was removed.

**Payload:**
```typescript
{
  id: string;
  messageId: string;
  userId: string;
}
```

---

## Chat Events

### Client → Server

#### `chat:join`
Join a chat room (automatic on connect for all user's chats).

**Payload:**
```typescript
{
  chatId: string;
}
```

#### `chat:leave`
Leave a chat room.

**Payload:**
```typescript
{
  chatId: string;
}
```

### Server → Client

#### `chat:created`
Receive notification that you were added to a new chat.

**Payload:**
```typescript
{
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Array<{
    id: string;
    username: string;
  }>;
  createdAt: string;
}
```

#### `chat:updated`
Receive notification that chat details were updated.

**Payload:**
```typescript
{
  id: string;
  name?: string;
  avatarUrl?: string;
  updatedAt: string;
}
```

#### `chat:deleted`
Receive notification that a chat was deleted.

**Payload:**
```typescript
{
  id: string;
  deletedAt: string;
}
```

#### `chat:participant_added`
Receive notification that a participant was added.

**Payload:**
```typescript
{
  chatId: string;
  participant: {
    id: string;
    username: string;
    role: 'member' | 'admin' | 'owner';
  };
}
```

#### `chat:participant_removed`
Receive notification that a participant was removed.

**Payload:**
```typescript
{
  chatId: string;
  userId: string;
}
```

---

## Contact Events

### Server → Client

#### `contact:request`
Receive a new contact request.

**Payload:**
```typescript
{
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}
```

#### `contact:accepted`
Receive notification that your contact request was accepted.

**Payload:**
```typescript
{
  id: string;
  contactId: string;
  contact: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: 'online' | 'away' | 'offline';
  };
  acceptedAt: string;
}
```

#### `contact:removed`
Receive notification that a contact was removed.

**Payload:**
```typescript
{
  contactId: string;
}
```

---

## Error Events

### Server → Client

#### `error`
Receive error notifications.

**Payload:**
```typescript
{
  event: string;  // The event that caused the error
  message: string;
  code?: string;
}
```

**Example:**
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Display error to user
});
```

---

## Room Management

### Automatic Room Joining

When a user connects, they are automatically joined to:
- `user:<userId>` - Personal room for direct notifications
- `chat:<chatId>` - All chats they're a participant in

### Manual Room Operations

```javascript
// Join a specific chat room
socket.emit('chat:join', { chatId: 'chat-uuid-123' });

// Leave a chat room
socket.emit('chat:leave', { chatId: 'chat-uuid-123' });
```

---

## Best Practices

### 1. Handle Disconnections

```javascript
socket.on('disconnect', () => {
  // Queue messages locally
  // Retry connection
  setTimeout(() => {
    socket.connect();
  }, 1000);
});
```

### 2. Implement Typing Timeout

```javascript
let typingTimer;

messageInput.addEventListener('keyup', () => {
  clearTimeout(typingTimer);
  socket.emit('typing:start', { chatId });

  typingTimer = setTimeout(() => {
    socket.emit('typing:stop', { chatId });
  }, 3000);
});
```

### 3. Acknowledge Message Delivery

```javascript
socket.emit('message:send', messageData, (response) => {
  if (response.success) {
    console.log('Message sent:', response.messageId);
  } else {
    console.error('Failed to send message:', response.error);
  }
});
```

### 4. Debounce Status Updates

```javascript
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const updateStatus = debounce((status) => {
  socket.emit('presence:update', { status });
}, 1000);
```

---

## Rate Limits

- **Messages**: 10 per second per user
- **Typing indicators**: 1 per 3 seconds per chat
- **Status updates**: 1 per 5 seconds per user
- **Reactions**: 5 per second per user

Exceeding these limits will result in temporary throttling.

---

## Testing WebSocket Events

### Using Socket.IO Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected');

  // Send test message
  socket.emit('message:send', {
    chatId: 'test-chat-id',
    content: 'Test message'
  });
});

socket.on('message:new', (msg) => {
  console.log('Received:', msg);
});
```

### Using Browser DevTools

```javascript
// In browser console
window.socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('accessToken') }
});

window.socket.on('message:new', console.log);
```

---

## Event Flow Examples

### Sending a Message

```
Client A                    Server                     Client B
   |                          |                           |
   |--message:send----------->|                           |
   |                          |---message:new------------>|
   |<-message:delivered-------|                           |
   |                          |<--message:read------------|
   |<-message:read------------|                           |
```

### Typing Indicator

```
Client A                    Server                     Client B
   |                          |                           |
   |--typing:start----------->|                           |
   |                          |---user:typing------------>|
   |                (3 seconds no activity)               |
   |--typing:stop------------>|                           |
   |                          |---user:typing (false)---->|
```

### Contact Request

```
Client A                    Server                     Client B
   |                          |                           |
   |--POST /contacts--------->|                           |
   |                          |---contact:request-------->|
   |                          |<--PUT /contacts/accept----|
   |<-contact:accepted--------|                           |
```

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
