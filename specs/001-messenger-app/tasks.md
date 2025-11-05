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

- [X] T001 Initialize backend Node.js project with TypeScript 5+ in backend/ with package.json
- [X] T002 Install backend dependencies: express@4.18+, socket.io@4.6+, @prisma/client@5+, bcrypt@5+, jsonwebtoken@9+, zod@3+, sharp@0.33+, helmet, cors, winston
- [X] T003 Configure TypeScript in backend/tsconfig.json with strict mode enabled
- [X] T004 [P] Initialize frontend React project with Vite 5+ in frontend/ with package.json
- [X] T005 [P] Install frontend dependencies: react@18+, zustand@4+, axios@1.6+, socket.io-client@4.6+, react-router-dom@6+, tailwindcss@3+
- [X] T006 [P] Configure TypeScript in frontend/tsconfig.json
- [X] T007 [P] Configure TailwindCSS in frontend/tailwind.config.js
- [X] T008 [P] Setup ESLint and Prettier for backend in backend/.eslintrc.json
- [X] T009 [P] Setup ESLint and Prettier for frontend in frontend/.eslintrc.json
- [X] T010 Create docker-compose.yml for local development (PostgreSQL 15, Redis 7, MinIO)
- [X] T011 Create backend/env.example with all required environment variables
- [X] T012 [P] Create frontend/.env.example with API and WebSocket URLs
- [X] T013 Initialize Prisma in backend/ with prisma init
- [X] T014 Create backend/Dockerfile for containerized deployment
- [X] T015 [P] Create frontend/Dockerfile with nginx configuration
- [X] T016 [P] Create frontend/nginx.conf for production serving
- [X] T017 [P] Create k8s/namespace.yaml for Kubernetes deployment
- [X] T018 Create README.md with project setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Infrastructure

- [X] T019 Define Prisma schema in backend/prisma/schema.prisma with all 9 entities (users, contacts, chats, chat_participants, messages, attachments, message_reactions, message_delivery, unread_messages)
- [X] T020 Create initial database migration in backend/database/migrations/001_initial_schema.sql
- [X] T021 Setup database configuration in backend/src/config/database.ts with connection pooling
- [X] T022 [P] Setup Redis configuration in backend/src/config/redis.ts for pub/sub and caching
- [X] T023 [P] Setup MinIO/S3 configuration in backend/src/config/storage.ts
- [X] T024 [P] Setup environment variables loader in backend/src/config/env.ts
- [X] T025 [P] Setup constants file in backend/src/config/constants.ts

### Core Utilities & Middleware

- [X] T026 [P] Implement JWT utility functions in backend/src/utils/jwt.util.ts (generate, verify, refresh)
- [X] T027 [P] Implement password utility functions in backend/src/utils/password.util.ts (hash, compare with bcrypt)
- [X] T028 [P] Implement logger utility in backend/src/utils/logger.util.ts (Winston configuration)
- [X] T029 [P] Implement validation utility in backend/src/utils/validators.util.ts (Zod schemas)
- [X] T030 Implement authentication middleware in backend/src/middleware/auth.middleware.ts (JWT verification)
- [X] T031 [P] Implement error handling middleware in backend/src/middleware/error.middleware.ts
- [X] T032 [P] Implement rate limiting middleware in backend/src/middleware/rate-limit.middleware.ts (Redis-based)
- [X] T033 [P] Implement security middleware in backend/src/middleware/security.middleware.ts (Helmet, CORS)
- [X] T034 [P] Implement validation middleware in backend/src/middleware/validation.middleware.ts (Zod integration)

### Express App Setup

- [X] T035 Setup Express app in backend/src/app.ts with all middleware and routes
- [X] T036 Setup HTTP server in backend/src/server.ts with graceful shutdown
- [X] T037 [P] Setup health check route in backend/src/routes/health.routes.ts
- [X] T038 [P] Implement health check controller in backend/src/controllers/health.controller.ts

### WebSocket Infrastructure

- [X] T039 Setup Socket.IO server in backend/src/websocket/socket.manager.ts with Redis adapter
- [X] T040 Implement WebSocket authentication middleware in backend/src/websocket/middleware/socket-auth.middleware.ts
- [X] T041 Setup message delivery queue in backend/src/queues/message-delivery.queue.ts (Redis Streams)

### Frontend Core

- [X] T042 [P] Setup API service in frontend/src/services/api.service.ts (Axios with interceptors)
- [X] T043 [P] Setup WebSocket service in frontend/src/services/websocket.service.ts (Socket.IO client)
- [X] T044 [P] Setup auth store in frontend/src/store/authStore.ts (Zustand)
- [X] T045 [P] Setup React Router configuration in frontend/src/App.tsx with protected routes
- [X] T046 [P] Create common UI components: Button in frontend/src/components/common/Button.tsx
- [X] T047 [P] Create common UI components: Input in frontend/src/components/common/Input.tsx
- [X] T048 [P] Create common UI components: Avatar in frontend/src/components/common/Avatar.tsx
- [X] T049 [P] Create common UI components: Modal in frontend/src/components/common/Modal.tsx
- [X] T050 [P] Setup global styles in frontend/src/index.css with TailwindCSS

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration and Authentication (Priority: P1) 🎯 MVP

**Goal**: New users can create accounts and securely log in to access the messenger application

**Independent Test**: Create new account with username/password, log out, log back in, verify session persistence

### Backend Implementation for User Story 1

- [X] T051 [P] [US1] Create User repository in backend/src/repositories/user.repository.ts (CRUD operations)
- [X] T052 [US1] Implement AuthService in backend/src/services/auth.service.ts (register, login, refresh token, logout)
- [X] T053 [US1] Implement SessionService in backend/src/services/session.service.ts (Redis session management)
- [X] T054 [US1] Implement UserService in backend/src/services/user.service.ts (profile operations)
- [X] T055 [US1] Implement AuthController in backend/src/controllers/auth.controller.ts (register, login, refresh, logout endpoints)
- [X] T056 [US1] Implement UserController in backend/src/controllers/user.controller.ts (profile endpoints)
- [X] T057 [US1] Setup auth routes in backend/src/routes/auth.routes.ts (POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout)
- [X] T058 [US1] Setup user routes in backend/src/routes/user.routes.ts (GET /users/me, PUT /users/me, PATCH /users/me/avatar, GET /users/:id)
- [X] T059 [US1] Add rate limiting for auth endpoints (5 attempts / 15 minutes)
- [X] T060 [US1] Add validation schemas for registration and login (Zod)

### Frontend Implementation for User Story 1

- [X] T061 [P] [US1] Create LoginForm component in frontend/src/components/auth/LoginForm.tsx
- [X] T062 [P] [US1] Create RegisterForm component in frontend/src/components/auth/RegisterForm.tsx
- [X] T063 [US1] Create LoginPage in frontend/src/pages/LoginPage.tsx
- [X] T064 [P] [US1] Create RegisterPage in frontend/src/pages/RegisterPage.tsx
- [X] T065 [P] [US1] Create ProfilePage in frontend/src/pages/ProfilePage.tsx
- [X] T066 [US1] Implement auth API calls in frontend/src/services/api.service.ts (register, login, logout, refresh)
- [X] T067 [US1] Implement auth state management in frontend/src/store/authStore.ts (login, logout, token refresh)
- [X] T068 [US1] Add JWT token interceptor to Axios in frontend/src/services/api.service.ts
- [X] T069 [US1] Add automatic token refresh logic in frontend/src/services/api.service.ts
- [X] T070 [US1] Add protected route wrapper in frontend/src/App.tsx

**Checkpoint**: User Story 1 complete - users can register, login, and manage sessions

---

## Phase 4: User Story 2 - Contact Management (Priority: P1)

**Goal**: Users can find other users, send contact requests, and build their contact list

**Independent Test**: Search for another user, send contact request, have it accepted, verify bidirectional contact relationship

### Backend Implementation for User Story 2

- [X] T071 [P] [US2] Create Contact repository in backend/src/repositories/contact.repository.ts
- [X] T072 [US2] Implement contact search in UserService in backend/src/services/user.service.ts (searchUsers method)
- [X] T073 [US2] Implement ContactController in backend/src/controllers/contact.controller.ts (CRUD for contacts)
- [X] T074 [US2] Setup contact routes in backend/src/routes/contact.routes.ts (GET /contacts, POST /contacts, DELETE /contacts/:id, PUT /contacts/:id/accept, PUT /contacts/:id/reject, GET /contacts/pending)
- [X] T075 [US2] Setup user search route in backend/src/routes/user.routes.ts (GET /users/search)
- [X] T076 [US2] Add bidirectional contact creation logic in ContactController
- [X] T077 [US2] Add contact status validation (pending/accepted/blocked)
- [X] T078 [US2] Add rate limiting for contact requests (50 per day per user)
- [X] T079 [US2] Implement WebSocket events for contact status updates in backend/src/websocket/handlers/presence.handler.ts

### Frontend Implementation for User Story 2

- [X] T080 [P] [US2] Create contact store in frontend/src/store/contactStore.ts (Zustand)
- [X] T081 [P] [US2] Create ContactList component in frontend/src/components/contacts/ContactList.tsx
- [X] T082 [P] [US2] Create ContactRequest component in frontend/src/components/contacts/ContactRequest.tsx
- [X] T083 [P] [US2] Create UserSearch component in frontend/src/components/contacts/UserSearch.tsx
- [X] T084 [US2] Create ContactsPage in frontend/src/pages/ContactsPage.tsx
- [X] T085 [US2] Implement contact API calls in frontend/src/services/api.service.ts (getContacts, sendRequest, accept, reject, remove, searchUsers)
- [X] T086 [US2] Add WebSocket listeners for contact status updates in frontend/src/services/websocket.service.ts
- [X] T087 [US2] Add online/offline status indicators in ContactList component
- [X] T088 [US2] Add contact sorting (online first, then alphabetical)

**Checkpoint**: User Story 2 complete - users can manage contacts and see online status

---

## Phase 5: User Story 3 - Direct Messaging (Priority: P1)

**Goal**: Users can send text messages and images to their contacts with reliable delivery

**Independent Test**: Send messages between two contacts, verify delivery, persistence, and history retrieval. Upload images and verify thumbnail generation

### Backend Implementation for User Story 3

- [X] T089 [P] [US3] Create Chat repository in backend/src/repositories/chat.repository.ts
- [X] T090 [P] [US3] Create Message repository in backend/src/repositories/message.repository.ts
- [X] T091 [US3] Implement MessageService in backend/src/services/message.service.ts (send, edit, delete, paginate)
- [X] T092 [US3] Implement StorageService in backend/src/services/storage.service.ts (image upload, Sharp processing, thumbnail generation)
- [X] T093 [US3] Implement ChatController in backend/src/controllers/chat.controller.ts (create direct chat, get chats)
- [X] T094 [US3] Implement MessageController in backend/src/controllers/message.controller.ts (send, get messages, edit, delete)
- [X] T095 [US3] Setup chat routes in backend/src/routes/chat.routes.ts (GET /chats, POST /chats/direct, GET /chats/:id, GET /chats/slug/:slug)
- [X] T096 [US3] Setup message routes in backend/src/routes/message.routes.ts (GET /chats/:id/messages, POST /chats/:id/messages, PUT /messages/:id, DELETE /messages/:id, POST /messages/:id/read)
- [X] T097 [US3] Setup attachment routes in backend/src/routes/message.routes.ts (POST /attachments/upload, GET /attachments/:id)
- [X] T098 [US3] Implement WebSocket message handler in backend/src/websocket/handlers/message.handler.ts (real-time message delivery)
- [X] T099 [US3] Implement message delivery queue processing in backend/src/queues/message-delivery.queue.ts
- [X] T100 [US3] Add message validation (max 10,000 chars, sanitize HTML)
- [X] T101 [US3] Add image validation (JPEG/PNG/GIF/WebP, max 10MB, max 5 per message)
- [X] T102 [US3] Implement image processing (original, medium 800px, thumbnail 300px)
- [X] T103 [US3] Add rate limiting for messaging (10 messages/second per user)
- [X] T104 [US3] Add rate limiting for image uploads (10 uploads/minute per user)
- [X] T105 [US3] Implement message persistence with ACID transactions
- [X] T106 [US3] Implement cursor-based pagination for messages (50 messages per page)
- [X] T107 [US3] Add delivery status tracking (sent/delivered/read) in message_delivery table
- [X] T108 [US3] Implement offline message queuing in Redis
- [X] T109 [US3] Prevent duplicate direct chats - check if direct chat exists before creating

### Frontend Implementation for User Story 3

- [X] T110 [P] [US3] Create chat store in frontend/src/store/chatStore.ts (Zustand with message history)
- [X] T111 [P] [US3] Create ChatWindow component in frontend/src/components/chat/ChatWindow.tsx
- [X] T112 [P] [US3] Create ChatHeader component in frontend/src/components/chat/ChatHeader.tsx
- [X] T113 [P] [US3] Create MessageList component in frontend/src/components/chat/MessageList.tsx
- [X] T114 [P] [US3] Create Message component in frontend/src/components/chat/Message.tsx (with formatting support)
- [X] T115 [P] [US3] Create MessageInput component in frontend/src/components/chat/MessageInput.tsx (with image upload)
- [X] T116 [US3] Create ChatPage in frontend/src/pages/ChatPage.tsx
- [X] T117 [US3] Implement chat API calls in frontend/src/services/api.service.ts (getChats, createDirectChat, getMessages, sendMessage)
- [X] T118 [US3] Implement image upload API call in frontend/src/services/api.service.ts
- [X] T119 [US3] Add WebSocket message listeners in frontend/src/services/websocket.service.ts (message:new event)
- [X] T120 [US3] Implement optimistic UI for message sending
- [X] T121 [US3] Implement infinite scroll for message history with useInfiniteScroll hook in frontend/src/hooks/useInfiniteScroll.ts
- [X] T122 [US3] Add text formatting toolbar (bold/italic) in MessageInput
- [X] T123 [US3] Add image preview before upload in MessageInput
- [X] T124 [US3] Add thumbnail display with full-size viewer in Message component
- [X] T125 [US3] Add delivery status indicators (sent/delivered/read) in Message component
- [X] T126 [US3] Add auto-scroll to newest message
- [X] T127 [US3] Add message timestamp display

**Checkpoint**: User Story 3 complete - users can send text/image messages with reliable delivery

---

## Phase 6: User Story 4 - Group Chat Creation and Messaging (Priority: P2)

**Goal**: Users can create group chats with multiple participants and send messages to all members

**Independent Test**: Create group with multiple participants, send messages, add/remove participants, verify all operations

### Backend Implementation for User Story 4

- [X] T128 [US4] Extend ChatController for group operations in backend/src/controllers/chat.controller.ts (create group, update, delete, add/remove participants)
- [X] T129 [US4] Extend Chat repository for group queries in backend/src/repositories/chat.repository.ts
- [X] T130 [US4] Setup group chat routes in backend/src/routes/chat.routes.ts (POST /chats/group, PUT /chats/:id, DELETE /chats/:id, POST /chats/:id/participants, DELETE /chats/:id/participants/:userId, POST /chats/:id/leave)
- [X] T131 [US4] Add group participant limit validation (max 300)
- [X] T132 [US4] Add group ownership transfer logic when owner leaves
- [X] T133 [US4] Implement system notifications for group events (participant added/removed/left)
- [X] T134 [US4] Extend WebSocket message handler for group message delivery
- [X] T135 [US4] Add group permission checks (owner/admin for management operations)
- [X] T136 [US4] Implement group avatar upload in StorageService

### Frontend Implementation for User Story 4

- [X] T137 [P] [US4] Create GroupCreate component in frontend/src/components/groups/GroupCreate.tsx
- [X] T138 [P] [US4] Create GroupSettings component in frontend/src/components/groups/GroupSettings.tsx
- [X] T139 [P] [US4] Create ParticipantList component in frontend/src/components/groups/ParticipantList.tsx
- [X] T140 [US4] Extend chat store for group operations in frontend/src/store/chatStore.ts
- [X] T141 [US4] Implement group API calls in frontend/src/services/api.service.ts (createGroup, updateGroup, deleteGroup, addParticipant, removeParticipant, leaveGroup)
- [X] T142 [US4] Add group creation UI in ChatPage with participant selection
- [X] T143 [US4] Add group settings modal with edit/delete/manage participants
- [X] T144 [US4] Add system message display in MessageList (participant events)
- [X] T145 [US4] Add participant count badge in ChatHeader
- [X] T146 [US4] Add confirmation dialogs for leave/delete group operations

**Checkpoint**: ✅ User Story 4 complete - group chats fully functional

---

## Phase 7: User Story 5 - Message Management (Priority: P2)

**Goal**: Users can edit messages, delete messages, react with emojis, and reply to specific messages

**Independent Test**: Send message, edit it, delete it, add reactions, reply to it - verify each operation independently

### Backend Implementation for User Story 5

- [X] T147 [US5] Extend MessageService for edit/delete operations in backend/src/services/message.service.ts
- [X] T148 [US5] Extend MessageController for reactions in backend/src/controllers/message.controller.ts
- [X] T149 [US5] Setup reaction routes in backend/src/routes/message.routes.ts (POST /messages/:id/reactions, DELETE /messages/:id/reactions/:reactionId)
- [X] T150 [US5] Implement soft delete for messages (set is_deleted=true, content="[Deleted]")
- [X] T151 [US5] Add edited timestamp and flag to messages
- [X] T152 [US5] Implement reply-to functionality (reply_to_id foreign key)
- [X] T153 [US5] Implement WebSocket events for edit/delete/reactions in message handler
- [X] T154 [US5] Add permission checks (only sender can edit/delete own messages)

### Frontend Implementation for User Story 5

- [X] T155 [P] [US5] Add message action menu in Message component (edit, delete, react, reply)
- [X] T156 [US5] Add inline edit mode in Message component
- [X] T157 [US5] Add emoji picker for reactions in Message component
- [X] T158 [US5] Add reaction display with count under messages
- [X] T159 [US5] Add reply preview in MessageInput when replying
- [X] T160 [US5] Add quoted message display in Message component for replies
- [X] T161 [US5] Add edited indicator to edited messages
- [X] T162 [US5] Implement edit/delete API calls in frontend/src/services/api.service.ts
- [X] T163 [US5] Implement reaction API calls in frontend/src/services/api.service.ts
- [X] T164 [US5] Add WebSocket listeners for edit/delete/reaction events
- [X] T165 [US5] Add hover tooltip showing users who reacted

**Checkpoint**: User Story 5 complete - message management features working

---

## Phase 8: User Story 6 - Real-Time Presence and Status (Priority: P2)

**Goal**: Users can see online/offline/away status and typing indicators in real-time

**Independent Test**: Observe status changes when contacts go online/offline, see typing indicators during conversations

### Backend Implementation for User Story 6

- [X] T166 [US6] Implement presence tracking in WebSocket socket manager in backend/src/websocket/socket.manager.ts
- [X] T167 [US6] Implement presence handler in backend/src/websocket/handlers/presence.handler.ts (connect, disconnect, status change)
- [X] T168 [US6] Implement typing handler in backend/src/websocket/handlers/typing.handler.ts (typing:start, typing:stop)
- [X] T169 [US6] Store online users in Redis with TTL
- [X] T170 [US6] Update last_seen timestamp on disconnect
- [X] T171 [US6] Broadcast status changes to contacts via WebSocket
- [X] T172 [US6] Broadcast typing events to chat participants
- [X] T173 [US6] Implement typing timeout (3 seconds)

### Frontend Implementation for User Story 6

- [X] T174 [P] [US6] Create TypingIndicator component in frontend/src/components/chat/TypingIndicator.tsx
- [X] T175 [US6] Add WebSocket listeners for presence events in frontend/src/services/websocket.service.ts (user:status)
- [X] T176 [US6] Add WebSocket listeners for typing events in frontend/src/services/websocket.service.ts (typing:start, typing:stop)
- [X] T177 [US6] Emit typing:start event on MessageInput keypress
- [X] T178 [US6] Emit typing:stop event after 3 seconds of inactivity
- [X] T179 [US6] Display typing indicator in ChatWindow
- [X] T180 [US6] Update contact status in real-time in ContactList
- [X] T181 [US6] Add status indicator colors (green=online, gray=offline, yellow=away)
- [X] T182 [US6] Display last seen timestamp for offline users
- [X] T183 [US6] Handle multiple typing users in group chats

**Checkpoint**: User Story 6 complete - real-time presence and typing indicators working

---

## Phase 9: User Story 7 - Read Receipts (Priority: P3)

**Goal**: Users can see when messages have been read (direct chats) and read counts (group chats)

**Independent Test**: Send message, observe status change from sent → delivered → read

### Backend Implementation for User Story 7

- [X] T184 [US7] Implement read receipt handler in backend/src/websocket/handlers/read-receipt.handler.ts
- [X] T185 [US7] Update message_delivery table on read events
- [X] T186 [US7] Broadcast read receipts to message sender
- [X] T187 [US7] Calculate read counts for group messages
- [X] T188 [US7] Implement bulk mark as read for chat opening

### Frontend Implementation for User Story 7

- [X] T189 [US7] Emit message read events when chat is opened and messages are visible
- [X] T190 [US7] Add WebSocket listener for read receipt events in frontend/src/services/websocket.service.ts
- [X] T191 [US7] Update message delivery status in chat store
- [X] T192 [US7] Display read checkmarks in direct chats
- [X] T193 [US7] Display read count in group chats ("Read by X of Y")
- [X] T194 [US7] Add intersection observer to mark messages as read when visible

**Checkpoint**: User Story 7 complete - read receipts functional

---

## Phase 10: User Story 8 - Search Functionality (Priority: P3)

**Goal**: Users can search messages across all chats and search for users by username

**Independent Test**: Enter search queries, verify results with highlighting, navigate to messages

### Backend Implementation for User Story 8

- [X] T195 [US8] Implement full-text search in MessageService using PostgreSQL tsvector
- [X] T196 [US8] Implement MessageController search method in backend/src/controllers/message.controller.ts
- [X] T197 [US8] Setup search route in backend/src/routes/message.routes.ts (GET /messages/search)
- [X] T198 [US8] Add search result pagination (max 100 results)
- [X] T199 [US8] Add chat filter for search (optional chatId parameter)
- [X] T200 [US8] Add search highlighting in results
- [X] T201 [US8] Optimize search performance with GIN index on messages content

### Frontend Implementation for User Story 8

- [X] T202 [P] [US8] Create search bar component in frontend/src/components/common/SearchBar.tsx
- [X] T203 [US8] Create search results view in ChatPage
- [X] T204 [US8] Implement message search API call in frontend/src/services/api.service.ts
- [X] T205 [US8] Add search result highlighting
- [X] T206 [US8] Add navigation to message from search result (scroll and highlight)
- [X] T207 [US8] Add chat filter dropdown in search
- [X] T208 [US8] Integrate user search from User Story 2 into global search

**Checkpoint**: ✅ User Story 8 complete - search functionality working

---

## Phase 11: User Story 9 - User Profile Management (Priority: P3)

**Goal**: Users can view and update their profile (display name, avatar, status)

**Independent Test**: Update profile fields, verify changes are saved and reflected across the app

### Backend Implementation for User Story 9

- [X] T209 [US9] Extend UserService with profile update methods in backend/src/services/user.service.ts
- [X] T210 [US9] Extend UserController with avatar upload in backend/src/controllers/user.controller.ts
- [X] T211 [US9] Implement avatar image processing in StorageService (same as message images)
- [X] T212 [US9] Broadcast profile updates to contacts via WebSocket

### Frontend Implementation for User Story 9

- [X] T213 [US9] Extend ProfilePage with edit form in frontend/src/pages/ProfilePage.tsx
- [X] T214 [US9] Add avatar upload component in ProfilePage
- [X] T215 [US9] Add display name editor in ProfilePage
- [X] T216 [US9] Add status selector (online/away/offline) in ProfilePage
- [X] T217 [US9] Implement profile update API calls in frontend/src/services/api.service.ts
- [X] T218 [US9] Add WebSocket listener for profile update events
- [X] T219 [US9] Update UI when profile changes (avatar, display name in all views)

**Checkpoint**: ✅ User Story 9 complete - profile management working

---

## Phase 12: User Story 10 - Deep Linking and Navigation (Priority: P3)

**Goal**: Users can access specific chats, messages, and profiles through direct URLs

**Independent Test**: Generate URLs for chats/messages, verify they navigate correctly

### Backend Implementation for User Story 10

- [X] T220 [US10] Add slug generation for group chats in ChatController
- [X] T221 [US10] Implement slug-based chat lookup in Chat repository
- [X] T222 [US10] Add access control checks for deep links (membership verification)

### Frontend Implementation for User Story 10

- [X] T223 [US10] Setup route parameters in App.tsx for /chat/:chatId, /chat/:slug, /chat/:chatId/message/:messageId, /user/:userId
- [X] T224 [US10] Implement deep link navigation in ChatPage
- [X] T225 [US10] Implement scroll-to-message with highlighting
- [X] T226 [US10] Add URL copying functionality in ChatHeader
- [X] T227 [US10] Add share message link option in message menu
- [X] T228 [US10] Implement user profile deep links
- [X] T229 [US10] Add authentication redirect for unauthorized deep link access

**Checkpoint**: User Story 10 complete - deep linking functional

---

## Phase 13: User Story 11 - Browser Notifications (Priority: P3)

**Goal**: Users receive desktop notifications when new messages arrive while app is not in focus

**Independent Test**: Receive messages while tab is inactive, verify notifications appear

### Frontend Implementation for User Story 11

- [X] T230 [US11] Request notification permission on login in frontend/src/services/websocket.service.ts
- [X] T231 [US11] Implement notification display on message received while tab inactive
- [X] T232 [US11] Add click handler to open chat from notification
- [X] T233 [US11] Add do-not-disturb toggle in ProfilePage
- [X] T234 [US11] Store DND preference in authStore
- [X] T235 [US11] Respect DND setting when showing notifications
- [X] T236 [US11] Add notification sound (optional, respecting browser settings)

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

- [X] T247 Optimize database queries with covering indexes
- [X] T248 Implement message list virtualization in frontend for large chat histories
- [X] T249 Add image lazy loading in MessageList
- [X] T250 Implement service worker for offline support (optional)
- [X] T251 Add connection quality detection and UI feedback

### Security Hardening

- [ ] T252 Review and tighten CORS configuration
- [ ] T253 Add request size limits to all endpoints
- [ ] T254 Implement Content Security Policy headers
- [ ] T255 Add input sanitization audit across all endpoints
- [ ] T256 Setup automated security scanning in CI/CD

### Documentation & Testing

- [X] T257 [P] Create API documentation with Swagger/OpenAPI UI
- [X] T258 [P] Write deployment documentation in docs/deployment.md
- [X] T259 [P] Create troubleshooting guide in docs/troubleshooting.md
- [X] T260 [P] Document WebSocket events in docs/websocket-events.md
- [X] T261 Create load testing script in tools/performance-test/load-test.ts
- [X] T262 Run load test validation (1000 concurrent users, 50 msg/sec)
- [X] T263 Create quickstart.md with end-to-end validation scenarios
- [X] T264 Run quickstart.md validation

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
