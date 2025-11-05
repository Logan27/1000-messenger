# Quick Start Guide

Get the 1000-messenger application running locally in minutes and validate all features work correctly.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [End-to-End Validation](#end-to-end-validation)
- [Feature Validation Scenarios](#feature-validation-scenarios)
- [Common Commands](#common-commands)
- [Next Steps](#next-steps)

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ and **npm** (for local development)
- **Git** for cloning the repository

## Quick Setup

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/1000-messenger.git
cd 1000-messenger

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Check services are running
docker-compose ps

# 5. Run database migrations
docker-compose exec backend npm run migrate

# 6. (Optional) Seed test data
docker-compose exec backend npm run seed

# 7. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# WebSocket: ws://localhost:3001
```

### Option 2: Local Development

```bash
# 1. Start infrastructure (PostgreSQL, Redis)
docker-compose up postgres redis -d

# 2. Setup backend
cd backend
npm install
cp .env.example .env
npm run migrate
npm run dev

# 3. Setup frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## End-to-End Validation

Complete these scenarios to verify all features work correctly.

### Validation Checklist

Use this checklist to track your validation progress:

- [ ] User Registration & Authentication
- [ ] Contact Management
- [ ] Direct Messaging
- [ ] Group Chat Creation
- [ ] Message Management (Edit/Delete)
- [ ] Typing Indicators
- [ ] Presence Status
- [ ] Read Receipts
- [ ] Message Reactions
- [ ] Image Upload
- [ ] Search (Users & Messages)
- [ ] User Profile Management
- [ ] Deep Linking
- [ ] Browser Notifications

---

## Feature Validation Scenarios

### Scenario 1: User Registration & Authentication (US1)

**Goal**: Verify users can register, login, and authenticate

**Steps**:

1. **Register First User**:
   - Navigate to http://localhost:5173
   - Click "Sign Up"
   - Fill in:
     - Username: `alice`
     - Password: `password123`
     - Password Confirm: `password123`
     - Display Name: `Alice Smith`
   - Click "Create Account"
   - ✅ Should redirect to chat page

2. **Logout**:
   - Click profile icon → Logout
   - ✅ Should redirect to login page

3. **Login**:
   - Enter username: `alice`
   - Enter password: `password123`
   - Click "Sign In"
   - ✅ Should redirect to chat page

4. **Register Second User** (new incognito window):
   - Repeat registration with username: `bob`, display name: `Bob Jones`

**Expected Results**:
- Both users successfully registered
- Can login with correct credentials
- Invalid credentials show error message
- JWT tokens stored in localStorage

**Validation**:
```bash
# Verify users in database
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT id, username, display_name FROM users;"
```

---

### Scenario 2: Contact Management (US2)

**Goal**: Verify users can add and manage contacts

**Steps**:

1. **Search for User**:
   - As Alice, click "Contacts" tab
   - Click "Add Contact"
   - Search for: `bob`
   - ✅ Bob should appear in results

2. **Send Contact Request**:
   - Click "Add" next to Bob
   - ✅ Request should be sent

3. **Accept Contact Request**:
   - Switch to Bob's window
   - Navigate to Contacts
   - ✅ See pending request from Alice
   - Click "Accept"

4. **Verify Contact Added**:
   - Both users should now see each other in contacts list
   - ✅ Contact status should be "accepted"

**Validation**:
```bash
# Verify contacts in database
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT user_id, contact_id, status FROM contacts;"
```

---

### Scenario 3: Direct Messaging (US3)

**Goal**: Verify real-time messaging between two users

**Steps**:

1. **Start Chat**:
   - As Alice, click on Bob in contacts list
   - ✅ Chat window opens

2. **Send Text Message**:
   - Type: "Hello Bob!"
   - Press Enter
   - ✅ Message appears in Alice's chat
   - ✅ Message appears in Bob's chat (real-time)

3. **Send Message with Reply**:
   - As Bob, hover over Alice's message
   - Click reply button
   - Type: "Hi Alice!"
   - Send message
   - ✅ Reply preview shows in message

4. **Send Image**:
   - As Alice, click image upload button
   - Select an image file
   - Add caption: "Check this out"
   - Send
   - ✅ Image appears with thumbnail
   - ✅ Click to open full-size view

**Expected Results**:
- Messages deliver instantly (< 1 second)
- Delivery status updates (sent → delivered)
- Images display correctly
- Reply thread visible

**Validation**:
```bash
# Verify messages in database
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT id, content, content_type, sender_id FROM messages ORDER BY created_at DESC LIMIT 5;"
```

---

### Scenario 4: Group Chat Creation (US4)

**Goal**: Verify group chat functionality

**Steps**:

1. **Create Group**:
   - As Alice, click "+" to create new chat
   - Select "New Group"
   - Enter name: "Project Team"
   - Add Bob as participant
   - Click "Create"
   - ✅ Group chat created

2. **Send Group Message**:
   - Send message: "Welcome to the team!"
   - ✅ Message appears for all participants

3. **Add Participant** (create third user `charlie` first):
   - Click group name → Settings
   - Click "Add Participant"
   - Search and add Charlie
   - ✅ Charlie joins group
   - ✅ System message shows "Charlie was added"

4. **Remove Participant**:
   - As group owner, remove Charlie
   - ✅ System message shows "Charlie was removed"

**Expected Results**:
- Group chats support multiple participants
- All participants see messages
- System messages for join/leave events
- Only owner/admin can manage participants

---

### Scenario 5: Message Management (US5)

**Goal**: Verify edit, delete, and reaction features

**Steps**:

1. **Edit Message**:
   - As Alice, hover over your message
   - Click "⋮" menu → Edit
   - Change text to: "Hello Bob! How are you?"
   - Save
   - ✅ Message updates with "(edited)" label
   - ✅ Bob sees edited message

2. **Delete Message**:
   - Click "⋮" menu → Delete
   - Confirm deletion
   - ✅ Message removed from chat
   - ✅ Message removed for Bob too

3. **Add Reaction**:
   - Hover over Bob's message
   - Click reaction button
   - Select 👍
   - ✅ Reaction appears on message
   - ✅ Bob sees reaction count

4. **Remove Reaction**:
   - Click your reaction again
   - ✅ Reaction removed

**Expected Results**:
- Only message sender can edit/delete
- Edits show timestamp
- Reactions update in real-time
- Multiple users can react with same emoji

---

### Scenario 6: Typing Indicators (US6)

**Goal**: Verify typing indicators work

**Steps**:

1. **Start Typing**:
   - As Alice, click in message input
   - Start typing (don't send)
   - ✅ Bob sees "Alice is typing..." below chat

2. **Stop Typing**:
   - Stop typing for 3 seconds
   - ✅ Typing indicator disappears for Bob

3. **Multiple Typers**:
   - Both Alice and Bob start typing
   - ✅ Each sees the other's typing indicator

**Expected Results**:
- Typing indicator appears < 500ms
- Indicator auto-hides after 3s inactivity
- Works in both direct and group chats

---

### Scenario 7: Presence Status (US6)

**Goal**: Verify online/offline status tracking

**Steps**:

1. **Online Status**:
   - Both Alice and Bob logged in
   - ✅ Both show green "online" status in contacts

2. **Away Status**:
   - As Alice, go to Profile → Set status to "Away"
   - ✅ Bob sees Alice as "🟡 away"

3. **Offline Status**:
   - Alice closes browser/logs out
   - ✅ Bob sees Alice as "⚫ offline"
   - ✅ Last seen timestamp updates

**Expected Results**:
- Status updates in real-time
- Last seen shows when user went offline
- Status persists across sessions

---

### Scenario 8: Read Receipts (US7)

**Goal**: Verify message read status

**Steps**:

1. **Send Unread Message**:
   - As Alice (in chat with Bob)
   - Bob switches to different chat
   - Alice sends: "Are you there?"
   - ✅ Alice sees single checkmark (sent)

2. **Message Delivered**:
   - ✅ Changes to double checkmark (delivered)

3. **Message Read**:
   - Bob switches back to Alice's chat
   - ✅ Alice sees blue double checkmark (read)

4. **Group Read Receipts**:
   - In group chat, send message
   - ✅ Shows "Read by 2 of 3" when partially read

**Expected Results**:
- ✓ = Sent
- ✓✓ = Delivered
- ✓✓ (blue) = Read
- Group chats show read count

---

### Scenario 9: Search (US8)

**Goal**: Verify search functionality

**Steps**:

1. **Search Users**:
   - Click Search icon
   - Go to "Users" tab
   - Search: "bob"
   - ✅ Bob appears in results
   - Click result → Opens user profile

2. **Search Messages**:
   - Go to "Messages" tab
   - Search: "hello"
   - ✅ All messages containing "hello" appear
   - ✅ Shows chat context
   - Click result → Jumps to message

**Expected Results**:
- Search is case-insensitive
- Results update as you type
- Highlighting of search terms
- Fast search (<500ms)

---

### Scenario 10: User Profile Management (US9)

**Goal**: Verify profile editing

**Steps**:

1. **Edit Profile**:
   - Click profile icon → Profile
   - Click "Edit Profile"
   - Change display name to: "Alice Johnson"
   - Change status to: "Away"
   - Click "Save Changes"
   - ✅ Profile updates

2. **Upload Avatar**:
   - Click "Change Avatar"
   - Select image file
   - ✅ Avatar preview updates
   - Save changes
   - ✅ Avatar appears in chat

3. **Verify Updates Propagate**:
   - Switch to Bob's window
   - ✅ Bob sees Alice's new name and avatar (real-time)

**Expected Results**:
- Profile changes save correctly
- Changes broadcast to all contacts
- Avatar displays in all contexts

---

### Scenario 11: Deep Linking (US10)

**Goal**: Verify direct URLs work

**Steps**:

1. **Chat Deep Link**:
   - In a chat, click the share icon
   - Copy chat link
   - Open link in new tab
   - ✅ Opens directly to that chat

2. **Message Deep Link**:
   - Right-click message → Copy link
   - Open in new tab
   - ✅ Scrolls to and highlights specific message

3. **User Profile Deep Link**:
   - Share user profile link: `/user/bob-id`
   - Open link
   - ✅ Opens Bob's profile page

**Expected Results**:
- Links work for authenticated users
- Unauthenticated users redirect to login
- Message highlighting for 3 seconds
- Proper access control (can't view unauthorized chats)

---

### Scenario 12: Browser Notifications (US11)

**Goal**: Verify desktop notifications

**Steps**:

1. **Grant Permission**:
   - On login, browser prompts for notification permission
   - Click "Allow"
   - ✅ Permission granted

2. **Receive Notification**:
   - Switch to different tab/window
   - Have Bob send message to Alice
   - ✅ Desktop notification appears
   - ✅ Shows sender name and message preview

3. **Click Notification**:
   - Click the notification
   - ✅ Focuses window and opens chat

4. **Do Not Disturb**:
   - Go to Profile → Enable DND
   - ✅ Notifications stop appearing

**Expected Results**:
- Notifications only when tab inactive
- Click opens chat
- DND mode works
- Notification sound (optional)

---

## Performance Validation

### Load Test Scenario

Test with 100+ messages:

```bash
# Use provided load test script
cd tools/performance-test
npm install
npm run load-test -- --users=10 --messages=100
```

**Expected Results**:
- Message delivery < 100ms (p95)
- WebSocket connection stable
- No memory leaks
- Database queries optimized

### Metrics to Monitor

```bash
# Check container stats
docker stats

# Check database connections
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
docker-compose exec redis redis-cli INFO memory
```

---

## Common Commands

### Reset Database
```bash
docker-compose exec backend npm run migrate:down
docker-compose exec backend npm run migrate:up
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Filter for errors
docker-compose logs backend | grep ERROR
```

### Seed Test Data
```bash
docker-compose exec backend npm run seed
```

### Run Tests
```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

## Troubleshooting

### Services Won't Start

```bash
# Check what's using the ports
netstat -tulpn | grep -E "3000|5173|5432|6379"

# Stop all containers and restart
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run migrate
```

### WebSocket Not Connecting

```bash
# Check backend logs
docker-compose logs backend | grep -i websocket

# Test WebSocket endpoint
wscat -c ws://localhost:3001
```

For more issues, see [Troubleshooting Guide](./troubleshooting.md).

---

## Next Steps

After completing validation:

1. **Customize Configuration**: Edit `.env` for your environment
2. **Setup Production**: See [Deployment Guide](./deployment.md)
3. **Explore API**: Check [WebSocket Events](./websocket-events.md)
4. **Contribute**: Read `CONTRIBUTING.md` for development guidelines

## Success Criteria

All scenarios should pass with:
- ✅ No console errors
- ✅ Real-time updates < 1 second
- ✅ All CRUD operations working
- ✅ Data persists across page reloads
- ✅ WebSocket connection stable
- ✅ No memory leaks (run for 1+ hour)

---

**Congratulations!** If all validation scenarios pass, your 1000-messenger installation is working correctly.
