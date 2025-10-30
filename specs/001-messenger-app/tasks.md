# Tasks: Real-Time Messenger Application

**Input**: Design documents from `/specs/001-messenger-app/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are NOT included in this task list unless explicitly requested in future iterations.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, etc.)
- Exact file paths included in descriptions

## Path Conventions

This is a web application with separated frontend/backend:
- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`
- Infrastructure: `k8s/`, `docker-compose.yml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize backend Node.js project with TypeScript 5+ in backend/ with package.json
- [ ] T002 Install backend dependencies: express@4.18+, socket.io@4.6+, @prisma/client@5+, bcrypt@5+, jsonwebtoken@9+, zod@3+, sharp@0.33+, helmet, cors, winston
- [ ] T003 Configure TypeScript in backend/tsconfig.json with strict mode enabled
- [ ] T004 [P] Initialize frontend React project with Vite 5+ in frontend/ with package.json
- [ ] T005 [P] Install frontend dependencies: react@18+, zustand@4+, axios@1.6+, socket.io-client@4.6+, react-router-dom@6+, tailwindcss@3+
- [ ] T006 [P] Configure TypeScript in frontend/tsconfig.json
- [ ] T007 [P] Configure TailwindCSS in frontend/tailwind.config.js
- [ ] T008 [P] Setup ESLint and Prettier for backend in backend/.eslintrc.json
- [ ] T009 [P] Setup ESLint and Prettier for frontend in frontend/.eslintrc.json
- [ ] T010 Create docker-compose.yml for local development (PostgreSQL 15, Redis 7, MinIO)
- [ ] T011 Create backend/env.example with all required environment variables
- [ ] T012 [P] Create frontend/.env.example with API and WebSocket URLs
- [ ] T013 Initialize Prisma in backend/ with prisma init
- [ ] T014 Create backend/Dockerfile for containerized deployment
- [ ] T015 [P] Create frontend/Dockerfile with nginx configuration
- [ ] T016 [P] Create frontend/nginx.conf for production serving
- [ ] T017 [P] Create k8s/namespace.yaml for Kubernetes deployment
- [ ] T018 Create README.md with project setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Infrastructure

- [ ] T019 Define Prisma schema in backend/prisma/schema.prisma with all 9 entities (users, contacts, chats, chat_participants, messages, attachments, message_reactions, message_delivery, unread_messages)
- [ ] T020 Create initial database migration in backend/database/migrations/001_initial_schema.sql
- [ ] T021 Setup database configuration in backend/src/config/database.ts with connection pooling
- [ ] T022 [P] Setup Redis configuration in backend/src/config/redis.ts for pub/sub and caching
- [ ] T023 [P] Setup MinIO/S3 configuration in backend/src/config/storage.ts
- [ ] T024 [P] Setup environment variables loader in backend/src/config/env.ts
- [ ] T025 [P] Setup constants file in backend/src/config/constants.ts

### Core Utilities & Middleware

- [ ] T026 [P] Implement JWT utility functions in backend/src/utils/jwt.util.ts (generate, verify, refresh)
- [ ] T027 [P] Implement password utility functions in backend/src/utils/password.util.ts (hash, compare with bcrypt)
- [ ] T028 [P] Implement logger utility in backend/src/utils/logger.util.ts (Winston configuration)
- [ ] T029 [P] Implement validation utility in backend/src/utils/validators.util.ts (Zod schemas)
- [ ] T030 Implement authentication middleware in backend/src/middleware/auth.middleware.ts (JWT verification)
- [ ] T031 [P] Implement error handling middleware in backend/src/middleware/error.middleware.ts
- [ ] T032 [P] Implement rate limiting middleware in backend/src/middleware/rate-limit.middleware.ts (Redis-based)
- [ ] T033 [P] Implement security middleware in backend/src/middleware/security.middleware.ts (Helmet, CORS)
- [ ] T034 [P] Implement validation middleware in backend/src/middleware/validation.middleware.ts (Zod integration)

### Express App Setup

- [ ] T035 Setup Express app in backend/src/app.ts with all middleware and routes
- [ ] T036 Setup HTTP server in backend/src/server.ts with graceful shutdown
- [ ] T037 [P] Setup health check route in backend/src/routes/health.routes.ts
- [ ] T038 [P] Implement health check controller in backend/src/controllers/health.controller.ts

### WebSocket Infrastructure

- [ ] T039 Setup Socket.IO server in backend/src/websocket/socket.manager.ts with Redis adapter
- [ ] T040 Implement WebSocket authentication middleware in backend/src/websocket/middleware/socket-auth.middleware.ts
- [ ] T041 Setup message delivery queue in backend/src/queues/message-delivery.queue.ts (Redis Streams)

### Frontend Core

- [ ] T042 [P] Setup API service in frontend/src/services/api.service.ts (Axios with interceptors)
- [ ] T043 [P] Setup WebSocket service in frontend/src/services/websocket.service.ts (Socket.IO client)
- [ ] T044 [P] Setup auth store in frontend/src/store/authStore.ts (Zustand)
- [ ] T045 [P] Setup React Router configuration in frontend/src/App.tsx with protected routes
- [ ] T046 [P] Create common UI components: Button in frontend/src/components/common/Button.tsx
- [ ] T047 [P] Create common UI components: Input in frontend/src/components/common/Input.tsx
- [ ] T048 [P] Create common UI components: Avatar in frontend/src/components/common/Avatar.tsx
- [ ] T049 [P] Create common UI components: Modal in frontend/src/components/common/Modal.tsx
- [ ] T050 [P] Setup global styles in frontend/src/index.css with TailwindCSS

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration and Authentication (Priority: P1) 🎯 MVP

**Goal**: New users can create accounts and securely log in to access the messenger application

**Independent Test**: Create new account with username/password, log out, log back in, verify session persistence

### Backend Implementation for User Story 1

- [ ] T051 [P] [US1] Create User repository in backend/src/repositories/user.repository.ts (CRUD operations)
- [ ] T052 [US1] Implement AuthService in backend/src/services/auth.service.ts (register, login, refresh token, logout)
- [ ] T053 [US1] Implement SessionService in backend/src/services/session.service.ts (Redis session management)
- [ ] T054 [US1] Implement UserService in backend/src/services/user.service.ts (profile operations)
- [ ] T055 [US1] Implement AuthController in backend/src/controllers/auth.controller.ts (register, login, refresh, logout endpoints)
- [ ] T056 [US1] Implement UserController in backend/src/controllers/user.controller.ts (profile endpoints)
- [ ] T057 [US1] Setup auth routes in backend/src/routes/auth.routes.ts (POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout)
- [ ] T058 [US1] Setup user routes in backend/src/routes/user.routes.ts (GET /users/me, PUT /users/me, PATCH /users/me/avatar, GET /users/:id)
- [ ] T059 [US1] Add rate limiting for auth endpoints (5 attempts / 15 minutes)
- [ ] T060 [US1] Add validation schemas for registration and login (Zod)

### Frontend Implementation for User Story 1

- [ ] T061 [P] [US1] Create LoginForm component in frontend/src/components/auth/LoginForm.tsx
- [ ] T062 [P] [US1] Create RegisterForm component in frontend/src/components/auth/RegisterForm.tsx
- [ ] T063 [US1] Create LoginPage in frontend/src/pages/LoginPage.tsx
- [ ] T064 [P] [US1] Create RegisterPage in frontend/src/pages/RegisterPage.tsx
- [ ] T065 [P] [US1] Create ProfilePage in frontend/src/pages/ProfilePage.tsx
- [ ] T066 [US1] Implement auth API calls in frontend/src/services/api.service.ts (register, login, logout, refresh)
- [ ] T067 [US1] Implement auth state management in frontend/src/store/authStore.ts (login, logout, token refresh)
- [ ] T068 [US1] Add JWT token interceptor to Axios in frontend/src/services/api.service.ts
- [ ] T069 [US1] Add automatic token refresh logic in frontend/src/services/api.service.ts
- [ ] T070 [US1] Add protected route wrapper in frontend/src/App.tsx

**Checkpoint**: User Story 1 complete - users can register, login, and manage sessions

---

## Phase 4: User Story 2 - Contact Management (Priority: P1)

**Goal**: Users can find other users, send contact requests, and build their contact list

**Independent Test**: Search for another user, send contact request, have it accepted, verify bidirectional contact relationship

### Backend Implementation for User Story 2

- [ ] T071 [P] [US2] Create Contact repository in backend/src/repositories/contact.repository.ts
- [ ] T072 [US2] Implement contact search in UserService in backend/src/services/user.service.ts (searchUsers method)
- [ ] T073 [US2] Implement ContactController in backend/src/controllers/contact.controller.ts (CRUD for contacts)
- [ ] T074 [US2] Setup contact routes in backend/src/routes/contact.routes.ts (GET /contacts, POST /contacts, DELETE /contacts/:id, PUT /contacts/:id/accept, PUT /contacts/:id/reject, GET /contacts/pending)
- [ ] T075 [US2] Setup user search route in backend/src/routes/user.routes.ts (GET /users/search)
- [ ] T076 [US2] Add bidirectional contact creation logic in ContactController
- [ ] T077 [US2] Add contact status validation (pending/accepted/blocked)
- [ ] T078 [US2] Add rate limiting for contact requests (50 per day per user)
- [ ] T079 [US2] Implement WebSocket events for contact status updates in backend/src/websocket/handlers/presence.handler.ts

### Frontend Implementation for User Story 2

- [ ] T080 [P] [US2] Create contact store in frontend/src/store/contactStore.ts (Zustand)
- [ ] T081 [P] [US2] Create ContactList component in frontend/src/components/contacts/ContactList.tsx
- [ ] T082 [P] [US2] Create ContactRequest component in frontend/src/components/contacts/ContactRequest.tsx
- [ ] T083 [P] [US2] Create UserSearch component in frontend/src/components/contacts/UserSearch.tsx
- [ ] T084 [US2] Create ContactsPage in frontend/src/pages/ContactsPage.tsx
- [ ] T085 [US2] Implement contact API calls in frontend/src/services/api.service.ts (getContacts, sendRequest, accept, reject, remove, searchUsers)
- [ ] T086 [US2] Add WebSocket listeners for contact status updates in frontend/src/services/websocket.service.ts
- [ ] T087 [US2] Add online/offline status indicators in ContactList component
- [ ] T088 [US2] Add contact sorting (online first, then alphabetical)

**Checkpoint**: User Story 2 complete - users can manage contacts and see online status

---

## Phase 5: User Story 3 - Direct Messaging (Priority: P1)

**Goal**: Users can send text messages and images to their contacts with reliable delivery

**Independent Test**: Send messages between two contacts, verify delivery, persistence, and history retrieval. Upload images and verify thumbnail generation

### Backend Implementation for User Story 3

- [ ] T089 [P] [US3] Create Chat repository in backend/src/repositories/chat.repository.ts
- [ ] T090 [P] [US3] Create Message repository in backend/src/repositories/message.repository.ts
- [ ] T091 [US3] Implement MessageService in backend/src/services/message.service.ts (send, edit, delete, paginate)
- [ ] T092 [US3] Implement StorageService in backend/src/services/storage.service.ts (image upload, Sharp processing, thumbnail generation)
- [ ] T093 [US3] Implement ChatController in backend/src/controllers/chat.controller.ts (create direct chat, get chats)
- [ ] T094 [US3] Implement MessageController in backend/src/controllers/message.controller.ts (send, get messages, edit, delete)
- [ ] T095 [US3] Setup chat routes in backend/src/routes/chat.routes.ts (GET /chats, POST /chats/direct, GET /chats/:id, GET /chats/slug/:slug)
- [ ] T096 [US3] Setup message routes in backend/src/routes/message.routes.ts (GET /chats/:id/messages, POST /chats/:id/messages, PUT /messages/:id, DELETE /messages/:id, POST /messages/:id/read)
- [ ] T097 [US3] Setup attachment routes in backend/src/routes/message.routes.ts (POST /attachments/upload, GET /attachments/:id)
- [ ] T098 [US3] Implement WebSocket message handler in backend/src/websocket/handlers/message.handler.ts (real-time message delivery)
- [ ] T099 [US3] Implement message delivery queue processing in backend/src/queues/message-delivery.queue.ts
- [ ] T100 [US3] Add message validation (max 10,000 chars, sanitize HTML)
- [ ] T101 [US3] Add image validation (JPEG/PNG/GIF/WebP, max 10MB, max 5 per message)
- [ ] T102 [US3] Implement image processing (original, medium 800px, thumbnail 300px)
- [ ] T103 [US3] Add rate limiting for messaging (10 messages/second per user)
- [ ] T104 [US3] Add rate limiting for image uploads (10 uploads/minute per user)
- [ ] T105 [US3] Implement message persistence with ACID transactions
- [ ] T106 [US3] Implement cursor-based pagination for messages (50 messages per page)
- [ ] T107 [US3] Add delivery status tracking (sent/delivered/read) in message_delivery table
- [ ] T108 [US3] Implement offline message queuing in Redis
- [ ] T109 [US3] Implement reuse existing direct chat logic (prevent duplicates)

### Frontend Implementation for User Story 3

- [ ] T110 [P] [US3] Create chat store in frontend/src/store/chatStore.ts (Zustand with message history)
- [ ] T111 [P] [US3] Create ChatWindow component in frontend/src/components/chat/ChatWindow.tsx
- [ ] T112 [P] [US3] Create ChatHeader component in frontend/src/components/chat/ChatHeader.tsx
- [ ] T113 [P] [US3] Create MessageList component in frontend/src/components/chat/MessageList.tsx
- [ ] T114 [P] [US3] Create Message component in frontend/src/components/chat/Message.tsx (with formatting support)
- [ ] T115 [P] [US3] Create MessageInput component in frontend/src/components/chat/MessageInput.tsx (with image upload)
- [ ] T116 [US3] Create ChatPage in frontend/src/pages/ChatPage.tsx
- [ ] T117 [US3] Implement chat API calls in frontend/src/services/api.service.ts (getChats, createDirectChat, getMessages, sendMessage)
- [ ] T118 [US3] Implement image upload API call in frontend/src/services/api.service.ts
- [ ] T119 [US3] Add WebSocket message listeners in frontend/src/services/websocket.service.ts (message:new event)
- [ ] T120 [US3] Implement optimistic UI for message sending
- [ ] T121 [US3] Implement infinite scroll for message history with useInfiniteScroll hook in frontend/src/hooks/useInfiniteScroll.ts
- [ ] T122 [US3] Add text formatting toolbar (bold/italic) in MessageInput
- [ ] T123 [US3] Add image preview before upload in MessageInput
- [ ] T124 [US3] Add thumbnail display with full-size viewer in Message component
- [ ] T125 [US3] Add delivery status indicators (sent/delivered/read) in Message component
- [ ] T126 [US3] Add auto-scroll to newest message
- [ ] T127 [US3] Add message timestamp display

**Checkpoint**: User Story 3 complete - users can send text/image messages with reliable delivery

---

## Phase 6: User Story 4 - Group Chat Creation and Messaging (Priority: P2)

**Goal**: Users can create group chats with multiple participants and send messages to all members

**Independent Test**: Create group with multiple participants, send messages, add/remove participants, verify all operations

### Backend Implementation for User Story 4

- [ ] T128 [US4] Extend ChatController for group operations in backend/src/controllers/chat.controller.ts (create group, update, delete, add/remove participants)
- [ ] T129 [US4] Extend Chat repository for group queries in backend/src/repositories/chat.repository.ts
- [ ] T130 [US4] Setup group chat routes in backend/src/routes/chat.routes.ts (POST /chats/group, PUT /chats/:id, DELETE /chats/:id, POST /chats/:id/participants, DELETE /chats/:id/participants/:userId, POST /chats/:id/leave)
- [ ] T131 [US4] Add group participant limit validation (max 300)
- [ ] T132 [US4] Add group ownership transfer logic when owner leaves
- [ ] T133 [US4] Implement system notifications for group events (participant added/removed/left)
- [ ] T134 [US4] Extend WebSocket message handler for group message delivery
- [ ] T135 [US4] Add group permission checks (owner/admin for management operations)
- [ ] T136 [US4] Implement group avatar upload in StorageService

### Frontend Implementation for User Story 4

- [ ] T137 [P] [US4] Create GroupCreate component in frontend/src/components/groups/GroupCreate.tsx
- [ ] T138 [P] [US4] Create GroupSettings component in frontend/src/components/groups/GroupSettings.tsx
- [ ] T139 [P] [US4] Create ParticipantList component in frontend/src/components/groups/ParticipantList.tsx
- [ ] T140 [US4] Extend chat store for group operations in frontend/src/store/chatStore.ts
- [ ] T141 [US4] Implement group API calls in frontend/src/services/api.service.ts (createGroup, updateGroup, deleteGroup, addParticipant, removeParticipant, leaveGroup)
- [ ] T142 [US4] Add group creation UI in ChatPage with participant selection
- [ ] T143 [US4] Add group settings modal with edit/delete/manage participants
- [ ] T144 [US4] Add system message display in MessageList (participant events)
- [ ] T145 [US4] Add participant count badge in ChatHeader
- [ ] T146 [US4] Add confirmation dialogs for leave/delete group operations

**Checkpoint**: User Story 4 complete - group chats fully functional

---

## Phase 7: User Story 5 - Message Management (Priority: P2)

**Goal**: Users can edit messages, delete messages, react with emojis, and reply to specific messages

**Independent Test**: Send message, edit it, delete it, add reactions, reply to it - verify each operation independently

### Backend Implementation for User Story 5

- [ ] T147 [US5] Extend MessageService for edit/delete operations in backend/src/services/message.service.ts
- [ ] T148 [US5] Extend MessageController for reactions in backend/src/controllers/message.controller.ts
- [ ] T149 [US5] Setup reaction routes in backend/src/routes/message.routes.ts (POST /messages/:id/reactions, DELETE /messages/:id/reactions/:reactionId)
- [ ] T150 [US5] Implement soft delete for messages (set is_deleted=true, content="[Deleted]")
- [ ] T151 [US5] Add edited timestamp and flag to messages
- [ ] T152 [US5] Implement reply-to functionality (reply_to_id foreign key)
- [ ] T153 [US5] Implement WebSocket events for edit/delete/reactions in message handler
- [ ] T154 [US5] Add permission checks (only sender can edit/delete own messages)

### Frontend Implementation for User Story 5

- [ ] T155 [P] [US5] Add message action menu in Message component (edit, delete, react, reply)
- [ ] T156 [US5] Add inline edit mode in Message component
- [ ] T157 [US5] Add emoji picker for reactions in Message component
- [ ] T158 [US5] Add reaction display with count under messages
- [ ] T159 [US5] Add reply preview in MessageInput when replying
- [ ] T160 [US5] Add quoted message display in Message component for replies
- [ ] T161 [US5] Add edited indicator to edited messages
- [ ] T162 [US5] Implement edit/delete API calls in frontend/src/services/api.service.ts
- [ ] T163 [US5] Implement reaction API calls in frontend/src/services/api.service.ts
- [ ] T164 [US5] Add WebSocket listeners for edit/delete/reaction events
- [ ] T165 [US5] Add hover tooltip showing users who reacted

**Checkpoint**: User Story 5 complete - message management features working

---

## Phase 8: User Story 6 - Real-Time Presence and Status (Priority: P2)

**Goal**: Users can see online/offline/away status and typing indicators in real-time

**Independent Test**: Observe status changes when contacts go online/offline, see typing indicators during conversations

### Backend Implementation for User Story 6

- [ ] T166 [US6] Implement presence tracking in WebSocket socket manager in backend/src/websocket/socket.manager.ts
- [ ] T167 [US6] Implement presence handler in backend/src/websocket/handlers/presence.handler.ts (connect, disconnect, status change)
- [ ] T168 [US6] Implement typing handler in backend/src/websocket/handlers/typing.handler.ts (typing:start, typing:stop)
- [ ] T169 [US6] Store online users in Redis with TTL
- [ ] T170 [US6] Update last_seen timestamp on disconnect
- [ ] T171 [US6] Broadcast status changes to contacts via WebSocket
- [ ] T172 [US6] Broadcast typing events to chat participants
- [ ] T173 [US6] Implement typing timeout (3 seconds)

### Frontend Implementation for User Story 6

- [ ] T174 [P] [US6] Create TypingIndicator component in frontend/src/components/chat/TypingIndicator.tsx
- [ ] T175 [US6] Add WebSocket listeners for presence events in frontend/src/services/websocket.service.ts (user:status)
- [ ] T176 [US6] Add WebSocket listeners for typing events in frontend/src/services/websocket.service.ts (typing:start, typing:stop)
- [ ] T177 [US6] Emit typing:start event on MessageInput keypress
- [ ] T178 [US6] Emit typing:stop event after 3 seconds of inactivity
- [ ] T179 [US6] Display typing indicator in ChatWindow
- [ ] T180 [US6] Update contact status in real-time in ContactList
- [ ] T181 [US6] Add status indicator colors (green=online, gray=offline, yellow=away)
- [ ] T182 [US6] Display last seen timestamp for offline users
- [ ] T183 [US6] Handle multiple typing users in group chats

**Checkpoint**: User Story 6 complete - real-time presence and typing indicators working

---

## Phase 9: User Story 7 - Read Receipts (Priority: P3)

**Goal**: Users can see when messages have been read (direct chats) and read counts (group chats)

**Independent Test**: Send message, observe status change from sent → delivered → read

### Backend Implementation for User Story 7

- [ ] T184 [US7] Implement read receipt handler in backend/src/websocket/handlers/read-receipt.handler.ts
- [ ] T185 [US7] Update message_delivery table on read events
- [ ] T186 [US7] Broadcast read receipts to message sender
- [ ] T187 [US7] Calculate read counts for group messages
- [ ] T188 [US7] Implement bulk mark as read for chat opening

### Frontend Implementation for User Story 7

- [ ] T189 [US7] Emit message read events when chat is opened and messages are visible
- [ ] T190 [US7] Add WebSocket listener for read receipt events in frontend/src/services/websocket.service.ts
- [ ] T191 [US7] Update message delivery status in chat store
- [ ] T192 [US7] Display read checkmarks in direct chats
- [ ] T193 [US7] Display read count in group chats ("Read by X of Y")
- [ ] T194 [US7] Add intersection observer to mark messages as read when visible

**Checkpoint**: User Story 7 complete - read receipts functional

---

## Phase 10: User Story 8 - Search Functionality (Priority: P3)

**Goal**: Users can search messages across all chats and search for users by username

**Independent Test**: Enter search queries, verify results with highlighting, navigate to messages

### Backend Implementation for User Story 8

- [ ] T195 [US8] Implement full-text search in MessageService using PostgreSQL tsvector
- [ ] T196 [US8] Implement MessageController search method in backend/src/controllers/message.controller.ts
- [ ] T197 [US8] Setup search route in backend/src/routes/message.routes.ts (GET /messages/search)
- [ ] T198 [US8] Add search result pagination (max 100 results)
- [ ] T199 [US8] Add chat filter for search (optional chatId parameter)
- [ ] T200 [US8] Add search highlighting in results
- [ ] T201 [US8] Optimize search performance with GIN index on messages content

### Frontend Implementation for User Story 8

- [ ] T202 [P] [US8] Create search bar component in frontend/src/components/common/SearchBar.tsx
- [ ] T203 [US8] Create search results view in ChatPage
- [ ] T204 [US8] Implement message search API call in frontend/src/services/api.service.ts
- [ ] T205 [US8] Add search result highlighting
- [ ] T206 [US8] Add navigation to message from search result (scroll and highlight)
- [ ] T207 [US8] Add chat filter dropdown in search
- [ ] T208 [US8] Integrate user search from User Story 2 into global search

**Checkpoint**: User Story 8 complete - search functionality working

---

## Phase 11: User Story 9 - User Profile Management (Priority: P3)

**Goal**: Users can view and update their profile (display name, avatar, status)

**Independent Test**: Update profile fields, verify changes are saved and reflected across the app

### Backend Implementation for User Story 9

- [ ] T209 [US9] Extend UserService with profile update methods in backend/src/services/user.service.ts
- [ ] T210 [US9] Extend UserController with avatar upload in backend/src/controllers/user.controller.ts
- [ ] T211 [US9] Implement avatar image processing in StorageService (same as message images)
- [ ] T212 [US9] Broadcast profile updates to contacts via WebSocket

### Frontend Implementation for User Story 9

- [ ] T213 [US9] Extend ProfilePage with edit form in frontend/src/pages/ProfilePage.tsx
- [ ] T214 [US9] Add avatar upload component in ProfilePage
- [ ] T215 [US9] Add display name editor in ProfilePage
- [ ] T216 [US9] Add status selector (online/away/offline) in ProfilePage
- [ ] T217 [US9] Implement profile update API calls in frontend/src/services/api.service.ts
- [ ] T218 [US9] Add WebSocket listener for profile update events
- [ ] T219 [US9] Update UI when profile changes (avatar, display name in all views)

**Checkpoint**: User Story 9 complete - profile management working

---

## Phase 12: User Story 10 - Deep Linking and Navigation (Priority: P3)

**Goal**: Users can access specific chats, messages, and profiles through direct URLs

**Independent Test**: Generate URLs for chats/messages, verify they navigate correctly

### Backend Implementation for User Story 10

- [ ] T220 [US10] Add slug generation for group chats in ChatController
- [ ] T221 [US10] Implement slug-based chat lookup in Chat repository
- [ ] T222 [US10] Add access control checks for deep links (membership verification)

### Frontend Implementation for User Story 10

- [ ] T223 [US10] Setup route parameters in App.tsx for /chat/:chatId, /chat/:slug, /chat/:chatId/message/:messageId, /user/:userId
- [ ] T224 [US10] Implement deep link navigation in ChatPage
- [ ] T225 [US10] Implement scroll-to-message with highlighting
- [ ] T226 [US10] Add URL copying functionality in ChatHeader
- [ ] T227 [US10] Add share message link option in message menu
- [ ] T228 [US10] Implement user profile deep links
- [ ] T229 [US10] Add authentication redirect for unauthorized deep link access

**Checkpoint**: User Story 10 complete - deep linking functional

---

## Phase 13: User Story 11 - Browser Notifications (Priority: P3)

**Goal**: Users receive desktop notifications when new messages arrive while app is not in focus

**Independent Test**: Receive messages while tab is inactive, verify notifications appear

### Frontend Implementation for User Story 11

- [ ] T230 [US11] Request notification permission on login in frontend/src/services/websocket.service.ts
- [ ] T231 [US11] Implement notification display on message received while tab inactive
- [ ] T232 [US11] Add click handler to open chat from notification
- [ ] T233 [US11] Add do-not-disturb toggle in ProfilePage
- [ ] T234 [US11] Store DND preference in authStore
- [ ] T235 [US11] Respect DND setting when showing notifications
- [ ] T236 [US11] Add notification sound (optional, respecting browser settings)

**Checkpoint**: User Story 11 complete - browser notifications working

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Infrastructure & Deployment

- [ ] T237 [P] Create Kubernetes manifests in k8s/backend-deployment.yaml
- [ ] T238 [P] Create Kubernetes manifests in k8s/postgres-statefulset.yaml
- [ ] T239 [P] Create Kubernetes manifests in k8s/redis-statefulset.yaml
- [ ] T240 [P] Create Kubernetes Ingress in k8s/ingress.yaml
- [ ] T241 Create docker-compose.prod.yml for production deployment
- [ ] T242 [P] Setup CI/CD pipeline configuration

### Monitoring & Observability

- [ ] T243 [P] Add Prometheus metrics endpoints in backend
- [ ] T244 [P] Add structured logging to all services
- [ ] T245 [P] Create performance monitoring dashboard configuration
- [ ] T246 [P] Setup error tracking integration

### Performance Optimization

- [ ] T247 Optimize database queries with covering indexes
- [ ] T248 Implement message list virtualization in frontend for large chat histories
- [ ] T249 Add image lazy loading in MessageList
- [ ] T250 Implement service worker for offline support (optional)
- [ ] T251 Add connection quality detection and UI feedback

### Security Hardening

- [ ] T252 Review and tighten CORS configuration
- [ ] T253 Add request size limits to all endpoints
- [ ] T254 Implement Content Security Policy headers
- [ ] T255 Add input sanitization audit across all endpoints
- [ ] T256 Setup automated security scanning in CI/CD

### Documentation & Testing

- [ ] T257 [P] Create API documentation with Swagger/OpenAPI UI
- [ ] T258 [P] Write deployment documentation in docs/deployment.md
- [ ] T259 [P] Create troubleshooting guide in docs/troubleshooting.md
- [ ] T260 [P] Document WebSocket events in docs/websocket-events.md
- [ ] T261 Create load testing script in tools/performance-test/load-test.ts
- [ ] T262 Run load test validation (1000 concurrent users, 50 msg/sec)
- [ ] T263 Create quickstart.md with end-to-end validation scenarios
- [ ] T264 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3-13 (User Stories)**: All depend on Phase 2 completion
  - User stories can proceed in priority order: P1 → P2 → P3
  - P1 stories (US1, US2, US3) are interdependent and should be done sequentially
  - P2+ stories can run in parallel if team capacity allows
- **Phase 14 (Polish)**: Depends on desired user stories being complete

### User Story Dependencies

**Priority 1 (P1) - Must complete in order:**
- **US1 (Authentication)**: No dependencies, start after Phase 2 ✅
- **US2 (Contact Management)**: Depends on US1 (needs authenticated users) 🔗
- **US3 (Direct Messaging)**: Depends on US1 + US2 (needs contacts to message) 🔗🔗

**Priority 2 (P2) - Can start after US3:**
- **US4 (Group Chats)**: Depends on US1 + US2 + US3 (extends messaging to groups) 🔗🔗🔗
- **US5 (Message Management)**: Depends on US3 (needs messages to edit/delete/react) 🔗
- **US6 (Presence & Typing)**: Depends on US3 (real-time features for chats) 🔗

**Priority 3 (P3) - Can start after relevant P2:**
- **US7 (Read Receipts)**: Depends on US3 (extends message delivery tracking) 🔗
- **US8 (Search)**: Depends on US1 + US3 (searches users and messages) 🔗
- **US9 (Profile Management)**: Depends on US1 (extends user features) 🔗
- **US10 (Deep Linking)**: Depends on US3 (links to chats/messages) 🔗
- **US11 (Notifications)**: Depends on US3 (notifies of new messages) 🔗

### Within Each User Story

**Standard Pattern:**
1. Backend repositories → Backend services → Backend controllers → Backend routes
2. Frontend components (parallel) → Frontend pages → Frontend integration
3. WebSocket handlers (if needed)

**Parallelization Rules:**
- Tasks marked [P] can run in parallel (different files)
- Frontend and backend can proceed in parallel once contracts are known
- All repositories in a story can be built in parallel
- All React components in a story can be built in parallel

### Critical Path (MVP)

**Minimum Viable Product = Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5**

1. Phase 1: Setup (~2 hours)
2. Phase 2: Foundational (~2 days) ⚠️ BLOCKING
3. Phase 3: Authentication (~2 days)
4. Phase 4: Contact Management (~2 days)
5. Phase 5: Direct Messaging (~3 days)

**Total MVP Estimate**: ~8-10 days for single developer

---

## Parallel Opportunities

### Phase 1 (Setup) - High Parallelism
```bash
# Can run in parallel:
T001-T003 (Backend setup)
T004-T009 (Frontend setup)
T010-T018 (Infrastructure config)
```

### Phase 2 (Foundational) - Medium Parallelism
```bash
# Backend parallel groups:
T022-T025 (Config files)
T026-T029 (Utils)
T030-T034 (Middleware)
T037-T038 (Health check)

# Frontend parallel (after backend setup):
T042-T050 (Frontend services and components)
```

### Each User Story - Component Parallelism
```bash
# Example for US3 (Direct Messaging):
Backend repositories: T089, T090 (parallel)
Frontend components: T111-T115 (parallel - 5 components at once)
```

---

## Implementation Strategy

### MVP First (Phase 1-5: Authentication + Contacts + Direct Messaging)

**Goal**: Deliver working 1-on-1 messaging ASAP

1. **Week 1**: Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. **Week 2**: Complete Phase 3 (Authentication) + Phase 4 (Contacts)
3. **Week 3**: Complete Phase 5 (Direct Messaging)
4. **VALIDATE MVP**: Two users can register, add each other as contacts, send text/image messages

### Incremental Delivery

**After MVP, add features by priority:**

1. **Week 4**: Phase 6 (Group Chats) → Demo multi-user conversations
2. **Week 5**: Phase 7 (Message Management) → Demo edit/delete/reactions
3. **Week 6**: Phase 8 (Presence & Typing) → Demo real-time features
4. **Week 7-8**: Phase 9-13 (P3 features) → Polish and completeness
5. **Week 9**: Phase 14 (Polish & Production) → Production-ready deployment

### Parallel Team Strategy

With 3 developers (optimal split):

**After Phase 2 completes:**
- **Dev A**: Phase 3 (Authentication) → Phase 6 (Group Chats)
- **Dev B**: Phase 4 (Contacts) → Phase 7 (Message Management)
- **Dev C**: Phase 5 (Direct Messaging) → Phase 8 (Presence)

Each dev owns end-to-end (backend + frontend) for their user stories.

---

## Task Summary

**Total Tasks**: 264
**By Phase**:
- Phase 1 (Setup): 18 tasks
- Phase 2 (Foundational): 32 tasks (~12% of total) ⚠️ Blocking phase
- Phase 3 (US1 - Authentication): 20 tasks
- Phase 4 (US2 - Contacts): 18 tasks
- Phase 5 (US3 - Direct Messaging): 38 tasks (~14% of total) Largest story
- Phase 6 (US4 - Group Chats): 19 tasks
- Phase 7 (US5 - Message Management): 19 tasks
- Phase 8 (US6 - Presence): 18 tasks
- Phase 9 (US7 - Read Receipts): 11 tasks
- Phase 10 (US8 - Search): 14 tasks
- Phase 11 (US9 - Profile): 11 tasks
- Phase 12 (US10 - Deep Linking): 10 tasks
- Phase 13 (US11 - Notifications): 7 tasks
- Phase 14 (Polish): 28 tasks

**Parallelizable Tasks**: 87 tasks marked [P] (~33% parallelizable)

**Independent Test Scenarios**:
- US1: Register → Login → Logout → Login again
- US2: Search user → Send request → Accept → Verify bidirectional
- US3: Send text → Send image → Verify delivery → Check persistence
- US4: Create group → Add members → Send message → Remove member
- US5: Send → Edit → Delete → React → Reply
- US6: Go online/offline → Observe status → Type → See indicator
- US7: Send message → Read → Verify checkmark/count
- US8: Search text → Click result → Navigate to message
- US9: Update name → Upload avatar → Change status
- US10: Copy chat URL → Open in new tab → Verify access
- US11: Receive message while inactive → See notification → Click

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 = 126 tasks (48% of total)

---

## Notes

- All tasks include exact file paths for immediate implementation
- [P] marker indicates parallelizable tasks (different files, no dependencies)
- [Story] label maps each task to its user story for traceability
- Each user story is independently completable and testable
- Foundational phase (Phase 2) is critical - blocks all user stories
- Tests are NOT included unless explicitly requested
- Database schema defined in Phase 2 (Prisma) supports all user stories
- WebSocket infrastructure in Phase 2 enables all real-time features
- MVP deliverable after Phase 5 provides core messaging functionality
- Each checkpoint validates story independence
- Avoid: starting user stories before Phase 2 completes, skipping validation checkpoints
