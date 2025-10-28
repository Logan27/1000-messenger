# Feature Specification: Real-Time Messenger Application

**Feature Branch**: `001-messenger-app`  
**Created**: October 28, 2025  
**Status**: Draft  
**Input**: User description: "Create a messenger app with real-time chat, contacts, groups, and message features"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration and Authentication (Priority: P1)

New users can create accounts and securely log in to access the messenger application. This forms the foundation for all other features.

**Why this priority**: Without authentication, no other features can be accessed. This is the entry point to the entire application.

**Independent Test**: Can be fully tested by creating a new account with username/password, logging out, and logging back in. Delivers immediate value by securing user access.

**Acceptance Scenarios**:

1. **Given** I am a new user, **When** I provide a unique username (3-50 alphanumeric characters) and a secure password (minimum 8 characters), **Then** my account is created and I am automatically logged in
2. **Given** I have an existing account, **When** I enter my correct username and password, **Then** I am logged into the application
3. **Given** I enter incorrect credentials, **When** I attempt to login, **Then** I see an error message and remain logged out
4. **Given** I have attempted login 5 times unsuccessfully, **When** I try again, **Then** I am temporarily locked out for 15 minutes
5. **Given** I am logged in, **When** I close and reopen my browser, **Then** I remain logged in (session persistence)

---

### User Story 2 - Contact Management (Priority: P1)

Users can find other users, send contact requests, and build their contact list to enable direct communication.

**Why this priority**: Contacts are essential for enabling private conversations. Without this, users cannot identify who to message.

**Independent Test**: Can be fully tested by searching for another user, sending a contact request, and having it accepted. Delivers the ability to establish connections between users.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I search for another user by username, **Then** I see matching users in search results
2. **Given** I found a user, **When** I send them a contact request, **Then** they receive the request in their pending list
3. **Given** I received a contact request, **When** I accept it, **Then** we both appear in each other's contact lists
4. **Given** I received a contact request, **When** I reject it, **Then** the request is removed without adding the contact
5. **Given** I have contacts, **When** I view my contact list, **Then** I see all mutual contacts with their online/offline status
6. **Given** I have a contact, **When** I remove them, **Then** they are removed from both our contact lists but chat history is preserved

---

### User Story 3 - Direct Messaging (Priority: P1)

Users can send text messages and images to their contacts in one-on-one conversations with reliable delivery.

**Why this priority**: Core functionality of a messenger app. Enables basic communication between users.

**Independent Test**: Can be fully tested by sending messages between two contacts and verifying delivery, persistence, and history retrieval.

**Acceptance Scenarios**:

1. **Given** I have a contact, **When** I select them and type a message, **Then** I can send the message and it appears in our chat
2. **Given** I sent a message, **When** my contact is online, **Then** they receive it instantly (under 100ms)
3. **Given** I sent a message, **When** my contact is offline, **Then** the message is queued and delivered when they reconnect
4. **Given** I am in a chat, **When** I scroll up, **Then** I can load and view older messages (50 messages initially loaded)
5. **Given** I want to share an image, **When** I upload a JPEG/PNG/GIF/WebP file under 10MB, **Then** it is displayed as a thumbnail and viewable full-size
6. **Given** I want to format text, **When** I apply bold or italic formatting, **Then** the text displays with the formatting applied
7. **Given** I sent a message, **When** the server acknowledges receipt, **Then** I see delivery status indicators (sent, delivered, read)

---

### User Story 4 - Group Chat Creation and Messaging (Priority: P2)

Users can create group chats with multiple participants, send messages to all members, and manage group membership.

**Why this priority**: Extends communication beyond one-on-one to enable team/community conversations. Built on direct messaging foundation.

**Independent Test**: Can be fully tested by creating a group, adding participants, and sending messages visible to all members.

**Acceptance Scenarios**:

1. **Given** I have multiple contacts, **When** I create a group with a name (max 100 chars) and select participants, **Then** all participants see the group in their chat list
2. **Given** I am in a group, **When** I send a message, **Then** all participants receive it with my name displayed
3. **Given** I am the group owner, **When** I add a new participant from my contacts, **Then** they join the group and can see all previous messages
4. **Given** I am the group owner, **When** I remove a participant, **Then** they lose access immediately and a system notification is sent
5. **Given** I am in a group, **When** I choose to leave, **Then** I am removed from the participant list and the group is removed from my chat list
6. **Given** I am the group owner, **When** I delete the group, **Then** all participants lose access and the group is removed from all chat lists
7. **Given** I can send messages with images and text formatting in groups, **When** I send them, **Then** they work the same as in direct chats

---

### User Story 5 - Message Management (Priority: P2)

Users can edit their sent messages, delete messages, react with emojis, and reply to specific messages to enhance conversation control.

**Why this priority**: Improves user experience by allowing corrections and expression. Not critical for basic messaging but valuable for usability.

**Independent Test**: Can be fully tested by sending a message, then editing, deleting, reacting, and replying to verify each action works independently.

**Acceptance Scenarios**:

1. **Given** I sent a message, **When** I edit it, **Then** the updated message is displayed to all participants with an "edited" indicator
2. **Given** I sent a message, **When** I delete it, **Then** it is replaced with "[Deleted]" for all participants
3. **Given** I see a message, **When** I add an emoji reaction, **Then** it appears under the message with a count
4. **Given** a message has reactions, **When** I hover over them, **Then** I see which users reacted
5. **Given** I want to reply to a specific message, **When** I use the reply option, **Then** my response includes a quote linking to the original

---

### User Story 6 - Real-Time Presence and Status (Priority: P2)

Users can see when contacts are online, offline, or away, and receive real-time updates when contacts type messages.

**Why this priority**: Enhances communication by providing context about contact availability. Improves user experience but isn't essential for core messaging.

**Independent Test**: Can be fully tested by observing status changes when contacts go online/offline and seeing typing indicators during active conversations.

**Acceptance Scenarios**:

1. **Given** I am viewing my contact list, **When** a contact goes online, **Then** their status changes to online with a green indicator in real-time
2. **Given** I am viewing my contact list, **When** a contact goes offline, **Then** their status changes to gray with a "last seen" timestamp
3. **Given** I am in a chat, **When** the other person starts typing, **Then** I see a "User is typing..." indicator
4. **Given** the typing indicator is showing, **When** the person stops typing for 3 seconds, **Then** the indicator disappears
5. **Given** I am in a group chat, **When** multiple users type, **Then** I see indicators for all typing users

---

### User Story 7 - Read Receipts (Priority: P3)

Users can see when their messages have been read by recipients in direct chats and view read counts in group chats.

**Why this priority**: Provides feedback on message delivery but is a nice-to-have rather than essential functionality.

**Independent Test**: Can be fully tested by sending messages and observing status changes from sent → delivered → read.

**Acceptance Scenarios**:

1. **Given** I sent a message in a direct chat, **When** my contact reads it, **Then** the status updates to "read" with a checkmark
2. **Given** I sent a message in a group chat, **When** members read it, **Then** I see a read count showing how many have read it
3. **Given** I have multiple messages, **When** I view the chat, **Then** each message shows its current delivery status

---

### User Story 8 - Search Functionality (Priority: P3)

Users can search for messages across all their chats and search for other users by username.

**Why this priority**: Helpful for finding past conversations and new contacts, but users can function without it initially.

**Independent Test**: Can be fully tested by entering search queries and verifying relevant results are returned with proper highlighting and navigation.

**Acceptance Scenarios**:

1. **Given** I have messages across multiple chats, **When** I search for specific text, **Then** I see up to 100 matching messages with highlighted text
2. **Given** I see search results, **When** I click a result, **Then** I am navigated to that message in its chat
3. **Given** I want to narrow results, **When** I filter by a specific chat, **Then** only results from that chat appear
4. **Given** I want to find new contacts, **When** I search usernames (partial, case-insensitive), **Then** I see up to 20 matching users with their online status
5. **Given** I found a user in search, **When** I click to add them, **Then** I can send a contact request directly from the results

---

### User Story 9 - User Profile Management (Priority: P3)

Users can view and update their profile including display name, avatar image, and online status preferences.

**Why this priority**: Personalization feature that improves user experience but isn't required for basic messaging functionality.

**Independent Test**: Can be fully tested by updating profile fields and verifying changes are saved and reflected across the application.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I edit my display name, **Then** it is saved and reflected immediately to all users
2. **Given** I want to personalize my profile, **When** I upload an avatar image, **Then** it appears in my profile and in all my messages
3. **Given** I want to control my visibility, **When** I change my status to away, **Then** my contacts see me as away with a yellow indicator
4. **Given** my profile has a last seen timestamp, **When** I go offline, **Then** contacts see when I was last active

---

### User Story 10 - Deep Linking and Navigation (Priority: P3)

Users can access specific chats, messages, and profiles through direct URLs for easy sharing and navigation.

**Why this priority**: Convenience feature that improves navigation but isn't essential for core messaging.

**Independent Test**: Can be fully tested by generating URLs for chats and verifying they navigate to the correct content when clicked.

**Acceptance Scenarios**:

1. **Given** I am in a chat, **When** I copy the chat URL, **Then** I can share it and others can open that specific chat directly
2. **Given** I have a message URL, **When** I click it, **Then** the chat opens scrolled to that specific message with highlighting
3. **Given** I have a user profile URL, **When** I click it, **Then** I see that user's profile with quick actions to message or view shared chats
4. **Given** I try to access a URL without authentication, **When** I'm not logged in, **Then** I am redirected to login first

---

### User Story 11 - Browser Notifications (Priority: P3)

Users receive desktop notifications when new messages arrive while the application is not in focus.

**Why this priority**: Nice-to-have feature that keeps users informed but they can check the app manually if needed.

**Independent Test**: Can be fully tested by receiving messages while the app tab is inactive and verifying notifications appear.

**Acceptance Scenarios**:

1. **Given** I granted notification permission, **When** I receive a message while the tab is not active, **Then** a desktop notification appears with sender and preview
2. **Given** a notification appears, **When** I click it, **Then** the application opens to that specific chat
3. **Given** I don't want notifications, **When** I enable do-not-disturb, **Then** no notifications are shown

---

### Edge Cases

- What happens when a user tries to send a message exceeding 10,000 characters? System truncates or shows error before sending.
- What happens when network connection is lost during message send? Message is queued locally and sent when connection restores.
- What happens when a group reaches 300 participants and owner tries to add more? System prevents addition and shows participant limit error.
- What happens when a user uploads an image larger than 10MB? System shows error and prevents upload.
- What happens when a user tries to access a chat they're no longer a member of? System shows access denied error.
- What happens when the last admin leaves a group? System automatically promotes the next longest-standing member to admin.
- What happens when multiple users edit group details simultaneously? Last write wins, with system notifications for all changes.
- What happens when a user receives messages while offline for an extended period? All messages are queued and delivered in order upon reconnection.
- What happens when server restarts while messages are in transit? All acknowledged messages are persisted; unacknowledged messages are re-sent by clients.
- What happens when a contact removes me while I'm viewing our chat? Chat remains accessible with history preserved, but I cannot send new messages.

## Requirements *(mandatory)*

### Functional Requirements

**User Management**

- **FR-001**: System MUST allow users to self-register with a username (3-50 alphanumeric characters and underscore) and password (minimum 8 characters with complexity rules)
- **FR-002**: System MUST validate username uniqueness and prevent duplicate registrations
- **FR-003**: System MUST require password confirmation during registration
- **FR-004**: System MUST automatically log users in after successful registration
- **FR-005**: System MUST authenticate users with username and password credentials
- **FR-006**: System MUST implement rate limiting for login attempts (5 attempts per 15 minutes per username)
- **FR-007**: System MUST persist user sessions across browser restarts
- **FR-008**: Users MUST be able to log out and terminate their session
- **FR-009**: Users MUST be able to view and edit their display name
- **FR-010**: Users MUST be able to upload and change their avatar image
- **FR-011**: Users MUST be able to set their online status (online, offline, away)
- **FR-012**: System MUST display last seen timestamp for offline users

**Contact Management**

- **FR-013**: Users MUST be able to search for other users by username (partial match, case-insensitive)
- **FR-014**: Users MUST be able to send contact requests to other users
- **FR-015**: System MUST present contact requests in recipient's pending list
- **FR-016**: Users MUST be able to accept or reject incoming contact requests
- **FR-017**: System MUST create bidirectional contact relationship upon acceptance
- **FR-018**: Users MUST be able to view all their mutual contacts in a contact list
- **FR-019**: System MUST display online/offline status for each contact
- **FR-020**: System MUST sort contact list by online status first, then alphabetically
- **FR-021**: Users MUST be able to remove contacts from their contact list
- **FR-022**: System MUST remove contact from both users' lists when either removes the other
- **FR-023**: System MUST preserve existing chat history when contacts are removed

**Direct Messaging**

- **FR-024**: Users MUST be able to start one-on-one chats with any contact
- **FR-025**: System MUST reuse existing direct chat if one already exists between two users
- **FR-026**: Users MUST be able to send text messages up to 10,000 characters
- **FR-027**: System MUST support sending messages with Enter key (Shift+Enter for new line)
- **FR-028**: System MUST display sent messages immediately in sender's chat (optimistic UI)
- **FR-029**: System MUST deliver messages instantly to online recipients
- **FR-030**: System MUST queue messages for offline recipients and deliver on reconnection
- **FR-031**: Users MUST be able to apply bold and italic text formatting
- **FR-032**: System MUST sanitize HTML tags in messages to prevent XSS attacks
- **FR-033**: Users MUST be able to upload images in JPEG, PNG, GIF, or WebP format
- **FR-034**: System MUST enforce maximum image size of 10MB per image
- **FR-035**: System MUST allow up to 5 images per message
- **FR-036**: System MUST generate thumbnails for uploaded images automatically
- **FR-037**: Users MUST be able to click thumbnails to view images at full size
- **FR-038**: System MUST provide server acknowledgment when messages are received
- **FR-039**: System MUST display delivery status indicators (sent, delivered, read)
- **FR-040**: System MUST implement retry mechanism for failed message deliveries
- **FR-041**: System MUST persist all messages to survive server restarts
- **FR-042**: System MUST maintain transaction integrity (ACID) for all message operations
- **FR-043**: System MUST load 50 most recent messages when chat is opened
- **FR-044**: System MUST support infinite scroll to load older messages (pagination)
- **FR-045**: System MUST display sender name and timestamp for each message

**Group Chats**

- **FR-046**: Users MUST be able to create group chats with a name (max 100 characters)
- **FR-047**: Users MUST be able to select participants from their contact list for groups
- **FR-048**: System MUST require minimum 1 participant plus creator for group creation
- **FR-049**: System MUST enforce maximum 300 participants per group
- **FR-050**: System MUST designate group creator as group owner
- **FR-051**: Users MUST be able to optionally set a group avatar
- **FR-052**: System MUST make group visible in all participants' chat lists
- **FR-053**: Users MUST be able to send messages to group chats with same capabilities as direct messages
- **FR-054**: System MUST deliver group messages to all participants
- **FR-055**: System MUST display sender name with each group message
- **FR-056**: Group owners MUST be able to add new participants from their contacts
- **FR-057**: System MUST grant new group participants access to all previous messages
- **FR-058**: System MUST send system notification when participant is added
- **FR-059**: Group owners MUST be able to remove participants (except themselves)
- **FR-060**: System MUST remove participant access immediately upon removal
- **FR-061**: System MUST send system notification when participant is removed
- **FR-062**: Users MUST be able to leave group chats voluntarily
- **FR-063**: System MUST show confirmation dialog before user leaves group
- **FR-064**: System MUST send system notification when user leaves group
- **FR-065**: System MUST transfer ownership when group owner leaves (promote first admin)
- **FR-066**: Group owners MUST be able to delete entire group
- **FR-067**: System MUST show confirmation dialog with warning before group deletion
- **FR-068**: System MUST remove group access for all participants upon deletion
- **FR-069**: Group owners MUST be able to edit group name and avatar
- **FR-070**: System MUST show system notification when group details are changed

**Message Features**

- **FR-071**: Users MUST be able to edit their own sent messages
- **FR-072**: System MUST display "edited" indicator on edited messages
- **FR-073**: System MUST track edit history for all messages
- **FR-074**: System MUST update edited messages for all recipients
- **FR-075**: Users MUST be able to delete their own messages
- **FR-076**: System MUST perform soft delete showing "[Deleted]" placeholder
- **FR-077**: System MUST make deleted messages unrecoverable
- **FR-078**: Users MUST be able to add emoji reactions to messages
- **FR-079**: System MUST allow multiple users to react to same message
- **FR-080**: System MUST allow same user to add multiple different emoji reactions
- **FR-081**: System MUST display reaction count under messages
- **FR-082**: System MUST show which users reacted when hovering over reactions
- **FR-083**: Users MUST be able to reply to specific messages
- **FR-084**: System MUST display quoted original message in replies
- **FR-085**: System MUST link replies to original messages (clickable to scroll)
- **FR-086**: System MUST show when messages are read in direct chats
- **FR-087**: System MUST show read count for group messages
- **FR-088**: System MUST update read receipts in real-time

**Real-Time Features**

- **FR-089**: System MUST establish real-time communication using primary transport mechanism
- **FR-090**: System MUST provide automatic fallback mechanism if primary transport fails
- **FR-091**: System MUST auto-reconnect when connection is lost
- **FR-092**: System MUST implement heartbeat to detect disconnections
- **FR-093**: System MUST display connection status indicator to users
- **FR-094**: System MUST deliver messages to online users instantly
- **FR-095**: System MUST support multi-device message delivery
- **FR-096**: System MUST update contact online/offline status in real-time
- **FR-097**: System MUST display typing indicators when users are typing
- **FR-098**: System MUST show typing indicators in chat window
- **FR-099**: System MUST timeout typing indicators after 3 seconds of inactivity
- **FR-100**: System MUST show multiple typing users in group chats

**Search Functionality**

- **FR-101**: Users MUST be able to search for text across all their messages
- **FR-102**: System MUST support full-text message search
- **FR-103**: Users MUST be able to filter search results by specific chat
- **FR-104**: System MUST highlight matching text in search results
- **FR-105**: System MUST show message context in search results
- **FR-106**: System MUST allow navigation to message in chat from search results
- **FR-107**: System MUST limit search results to maximum 100 messages
- **FR-108**: Users MUST be able to search for other users by username
- **FR-109**: System MUST show up to 20 user search results
- **FR-110**: System MUST display online status in user search results
- **FR-111**: Users MUST be able to send contact requests from user search results

**User Interface**

- **FR-112**: System MUST display all user's chats in left sidebar
- **FR-113**: System MUST show chat name/participant for each chat
- **FR-114**: System MUST display last message preview for each chat
- **FR-115**: System MUST show unread message count badge for each chat
- **FR-116**: System MUST sort chat list by most recent message
- **FR-117**: System MUST display online status indicators in chat list
- **FR-118**: System MUST show chat messages in right main content area
- **FR-119**: System MUST display chat header with name/participants
- **FR-120**: System MUST show messages in chronological order
- **FR-121**: System MUST position message input at bottom of chat window
- **FR-122**: System MUST load older messages when scrolling up
- **FR-123**: System MUST auto-scroll to newest message when new messages arrive
- **FR-124**: System MUST keep message input field always visible
- **FR-125**: System MUST adapt interface to desktop screen sizes (sidebar + main view)
- **FR-126**: System MUST adapt interface to tablet screen sizes (collapsible sidebar)
- **FR-127**: System MUST adapt interface to mobile screen sizes (full-screen chat or list)
- **FR-128**: System MUST provide touch-friendly controls on mobile devices
- **FR-129**: System MUST support minimum screen width of 320px

**Deep Linking**

- **FR-130**: System MUST provide unique URL for each chat
- **FR-131**: System MUST support /chat/:chatId URL format for direct access
- **FR-132**: System MUST support /chat/:slug URL format for named groups
- **FR-133**: System MUST open specific chat when URL is accessed
- **FR-134**: System MUST require authentication before accessing chat URLs
- **FR-135**: System MUST support message-specific URLs in /chat/:chatId/message/:messageId format
- **FR-136**: System MUST scroll to and highlight specific message when message URL is accessed
- **FR-137**: System MUST enforce access control for message deep links
- **FR-138**: System MUST support user profile URLs in /user/:userId format
- **FR-139**: System MUST display user profile information when profile URL is accessed
- **FR-140**: System MUST restrict profile access to contacts or shared chat members only
- **FR-141**: System MUST provide quick actions (message, view shared chats) from profile pages

**File Management**

- **FR-142**: System MUST store images in cloud blob storage
- **FR-143**: System MUST generate three image versions (original, medium 800px, thumbnail 300px)
- **FR-144**: System MUST optimize image formats automatically
- **FR-145**: System MUST provide secure URLs for image access
- **FR-146**: System MUST make images CDN-friendly for performance
- **FR-147**: System MUST resize large images automatically
- **FR-148**: System MUST generate thumbnails for all images
- **FR-149**: System MUST compress images without quality loss
- **FR-150**: System MUST validate image integrity before storage

**Notifications**

- **FR-151**: System MUST display unread message count badge on each chat
- **FR-152**: System MUST reset unread count when chat is opened
- **FR-153**: System MUST persist unread counts across sessions
- **FR-154**: System MUST update unread counts in real-time
- **FR-155**: System MUST request browser notification permission from users
- **FR-156**: System MUST show desktop notifications when tab is not active
- **FR-157**: System MUST display sender and message preview in notifications
- **FR-158**: System MUST open relevant chat when notification is clicked
- **FR-159**: System MUST respect do-not-disturb settings for notifications

**Performance Requirements**

- **FR-160**: System MUST support 1,000 simultaneous active connections
- **FR-161**: System MUST maintain responsive performance under maximum load
- **FR-162**: System MUST handle 50 messages per second sustained throughput
- **FR-163**: System MUST handle spikes up to 100 messages per second
- **FR-164**: System MUST deliver messages without loss
- **FR-165**: System MUST maintain average response time under 100ms
- **FR-166**: System MUST maintain 95th percentile response time under 300ms
- **FR-167**: System MUST maintain 99th percentile response time under 500ms

**Data Management**

- **FR-168**: System MUST persist all data to survive system failures
- **FR-169**: System MUST prevent data loss after crashes
- **FR-170**: System MUST support automated backups
- **FR-171**: System MUST support point-in-time recovery
- **FR-172**: System MUST retain all messages indefinitely by default
- **FR-173**: System MUST never automatically delete messages
- **FR-174**: System MUST support optional archival for messages older than 1 year
- **FR-175**: System MUST maintain search index for recent messages (3 months)

**Security & Privacy**

- **FR-176**: System MUST ensure users only access their own chats
- **FR-177**: System MUST verify contact relationship before allowing chat
- **FR-178**: System MUST verify group membership before showing messages
- **FR-179**: System MUST control message visibility based on membership
- **FR-180**: System MUST restrict user profile access to authorized users only
- **FR-181**: System MUST rate limit login attempts (5 per 15 minutes)
- **FR-182**: System MUST rate limit messages (10 per second per user)
- **FR-183**: System MUST rate limit contact requests (50 per day)
- **FR-184**: System MUST rate limit general operations (100 per minute)
- **FR-185**: System MUST rate limit image uploads (10 per minute)
- **FR-186**: System MUST display clear error messages when rate limits are exceeded
- **FR-187**: System MUST implement temporary lockouts for rate limit violations
- **FR-188**: System MUST prevent XSS attacks through input sanitization
- **FR-189**: System MUST prevent SQL injection through parameterized queries
- **FR-190**: System MUST enforce all length limits on user input
- **FR-191**: System MUST validate file types for uploads
- **FR-192**: System MUST block malicious content in user input

### Key Entities

- **User**: Represents a person using the messenger application. Key attributes include username (unique identifier), password (secured), display name (customizable), avatar image, online status (online/offline/away), last seen timestamp, and session information. Users can have relationships with other users as contacts.

- **Contact**: Represents a bidirectional relationship between two users who have mutually accepted each other. Key attributes include request status (pending/accepted/rejected), timestamp of relationship creation, and references to both users. Enables users to identify who they can message.

- **Chat**: Represents a conversation container between users. Can be either direct (one-on-one) or group (multiple participants). Key attributes include chat type, name (for groups), avatar (optional for groups), creation timestamp, last message timestamp, and list of participants. Each chat has a unique identifier for deep linking.

- **Message**: Represents a single communication within a chat. Key attributes include message content (text up to 10,000 chars), sender, timestamp, edited status, edit history, delivery status (sent/delivered/read), message type (text/image/system), and relationships to attachments or reactions. Messages are immutable after deletion (soft delete).

- **Participant**: Represents a user's membership in a chat. Key attributes include user reference, chat reference, role (owner/admin/member for groups), join timestamp, and last read timestamp. Determines access control for messages.

- **Image**: Represents an uploaded image file. Key attributes include original file reference, three size variants (original, medium, thumbnail), format, file size, upload timestamp, and secure access URL. Linked to messages as attachments.

- **Reaction**: Represents an emoji reaction to a message. Key attributes include emoji identifier, user who reacted, message reference, and timestamp. Multiple reactions can exist per message.

- **MessageRead**: Represents read receipt information. Key attributes include message reference, user who read it, and timestamp of read action. Used to track delivery status and show read counts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account registration and login in under 1 minute on first use
- **SC-002**: Users can send a direct message to a contact and receive confirmation of delivery within 100 milliseconds under normal network conditions
- **SC-003**: 95% of messages are delivered to online recipients within 100 milliseconds end-to-end
- **SC-004**: System maintains stable performance with 1,000 concurrent active users without degradation
- **SC-005**: System processes 50 messages per second sustained throughput without message loss
- **SC-006**: Users can access complete message history from any point in time without data loss
- **SC-007**: System maintains 99.9% uptime with zero data loss during failures or restarts
- **SC-008**: Users can create a group chat and add 10 participants in under 30 seconds
- **SC-009**: 90% of users successfully complete their first direct message send on first attempt
- **SC-010**: Image uploads complete and generate thumbnails in under 5 seconds for files up to 10MB
- **SC-011**: Search queries return results in under 1 second for queries across all message history
- **SC-012**: Real-time status updates (online/offline) reflect across all users within 2 seconds
- **SC-013**: Application is fully functional on screens as small as 320px width (mobile devices)
- **SC-014**: Users can recover from network disconnection and receive all queued messages within 3 seconds of reconnection
- **SC-015**: 95% of support queries are resolved through intuitive UI without requiring external help documentation

## Assumptions

1. Users have modern web browsers with support for current web standards (no IE11 support required)
2. Users have stable internet connection for real-time features (graceful degradation for poor connections)
3. Image storage infrastructure (object storage like MinIO/S3) is available and configured
4. Users understand basic chat application concepts (no extensive onboarding tutorial needed)
5. Username uniqueness is sufficient for user identification (no email required)
6. Default message retention is indefinite unless user explicitly deletes
7. Group size limit of 300 participants is sufficient for target use cases
8. English is the primary language (internationalization is out of scope for initial version)
9. Desktop and mobile web browsers are the primary platforms (native mobile apps out of scope)
10. Video and voice calling are explicitly out of scope for this version
11. File sharing beyond images (documents, videos) is out of scope for this version
12. End-to-end encryption is out of scope (server-side encryption assumed sufficient)
13. Message backup/export functionality is out of scope for initial version
14. Admin control panel for system administration is out of scope
15. Payment/monetization features are out of scope
