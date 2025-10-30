# Validators Utility

This utility provides comprehensive Zod-based validation schemas for the messenger application.

## Overview

The `validators.util.ts` module exports:
- **Zod schemas** for all entities and operations
- **TypeScript types** inferred from schemas
- **Convenience functions** for quick validation
- **Helper functions** for validation results

## Usage Examples

### Basic Validation

```typescript
import { validateUsername, validatePassword, validateEmail } from './utils/validators.util';

// Simple boolean checks
if (validateUsername('testuser')) {
  // Username is valid
}

if (validatePassword('MyPassword123')) {
  // Password is valid
}

if (validateEmail('user@example.com')) {
  // Email is valid
}
```

### Using Schemas Directly

```typescript
import { userRegistrationSchema, createMessageSchema } from './utils/validators.util';

// Parse and validate (throws on error)
const userData = userRegistrationSchema.parse({
  username: 'testuser',
  password: 'password123',
  displayName: 'Test User'
});

// Safe parse (returns result object)
const result = createMessageSchema.safeParse({
  content: 'Hello, world!',
  contentType: 'text'
});

if (result.success) {
  console.log('Valid message:', result.data);
} else {
  console.log('Validation errors:', result.error);
}
```

### Using Helper Functions

```typescript
import { validate, validateOrThrow } from './utils/validators.util';

// Validate with structured result
const result = validate(userLoginSchema, requestBody);
if (result.success) {
  const { username, password } = result.data;
  // Process login
} else {
  return res.status(400).json({ errors: result.errors });
}

// Validate or throw exception
try {
  const message = validateOrThrow(createMessageSchema, requestBody);
  // Message is valid, proceed
} catch (error) {
  // Handle validation error
}
```

### Middleware Integration

```typescript
import { validate } from './middleware/validation.middleware';
import { userRegistrationSchema } from './utils/validators.util';

// Use in Express routes
router.post('/register', validate(userRegistrationSchema), authController.register);
```

### Type Inference

```typescript
import { UserRegistration, CreateMessage, Chat } from './utils/validators.util';

// Use inferred types in functions
function createUser(data: UserRegistration) {
  // data is typed as { username: string, password: string, displayName?: string }
}

function sendMessage(data: CreateMessage) {
  // data is typed correctly based on schema
}
```

## Available Schemas

### Primitive Validators
- `uuidSchema` - UUID validation
- `usernameSchema` - Username (3-50 alphanumeric + underscore)
- `passwordSchema` - Password (8-128 characters)
- `strongPasswordSchema` - Strong password (with complexity rules)
- `emailSchema` - Email validation
- `displayNameSchema` - Display name (1-100 characters)
- `avatarUrlSchema` - Avatar URL validation
- `userStatusSchema` - User status (online/offline/away)
- `timestampSchema` - Timestamp validation

### User & Auth Schemas
- `userRegistrationSchema` - User registration data
- `userLoginSchema` - User login credentials
- `userUpdateSchema` - User profile update
- `userProfileSchema` - Complete user profile
- `refreshTokenSchema` - Refresh token request
- `deviceInfoSchema` - Device information
- `sessionSchema` - User session data

### Contact Schemas
- `contactRequestSchema` - Contact request
- `contactResponseSchema` - Accept/reject contact request
- `contactSchema` - Complete contact data

### Chat Schemas
- `createDirectChatSchema` - Create direct chat
- `createGroupChatSchema` - Create group chat
- `updateGroupChatSchema` - Update group chat
- `addParticipantsSchema` - Add participants to group
- `removeParticipantSchema` - Remove participant from group
- `updateParticipantRoleSchema` - Update participant role
- `chatSchema` - Complete chat data
- `chatParticipantSchema` - Participant data

### Message Schemas
- `createMessageSchema` - Create new message
- `updateMessageSchema` - Update existing message
- `messageSchema` - Complete message data
- `messageMetadataSchema` - Message metadata (formatting, attachments)

### Attachment Schemas
- `attachmentSchema` - Complete attachment data
- `uploadImageSchema` - Image upload validation

### Reaction Schemas
- `addReactionSchema` - Add emoji reaction
- `reactionSchema` - Complete reaction data

### Delivery Schemas
- `messageDeliverySchema` - Message delivery status
- `markMessagesReadSchema` - Mark messages as read
- `markChatReadSchema` - Mark entire chat as read

### Pagination & Search
- `paginationSchema` - Offset-based pagination
- `cursorPaginationSchema` - Cursor-based pagination
- `searchQuerySchema` - Message search query
- `userSearchSchema` - User search query

### WebSocket Events
- `typingEventSchema` - Typing indicator event
- `presenceEventSchema` - User presence event
- `readReceiptEventSchema` - Read receipt event

### Query Parameters
- `chatQueryParamsSchema` - Chat list query parameters
- `messageQueryParamsSchema` - Message list query parameters
- `contactQueryParamsSchema` - Contact list query parameters

## Sanitization Functions

```typescript
import { sanitizeString, sanitizeMessageContent } from './utils/validators.util';

// Remove HTML angle brackets and trim
const safe = sanitizeString('  <script>alert("xss")</script>  ');
// Result: "scriptalert("xss")/script"

// Remove all HTML tags and script content
const safeMessage = sanitizeMessageContent('Hello <b>world</b><script>evil()</script>');
// Result: "Hello world"
```

## Best Practices

1. **Use schemas in middleware**: Apply validation before controllers
2. **Export types**: Use inferred types for type safety
3. **Reuse schemas**: Import from this utility instead of duplicating
4. **Sanitize input**: Always sanitize user input before storage
5. **Handle errors**: Provide clear validation error messages to users

## Error Handling

Validation errors have a consistent structure:

```typescript
{
  success: false,
  errors: [
    {
      field: 'username',
      message: 'Username must be at least 3 characters'
    },
    {
      field: 'password',
      message: 'Password must be at least 8 characters'
    }
  ]
}
```

## Adding New Schemas

When adding new schemas:

1. Define the schema in the appropriate section
2. Export the schema
3. Export the inferred type using `z.infer<typeof schemaName>`
4. Add tests in `validators.util.test.ts`
5. Update this documentation

Example:

```typescript
// Add schema
export const myNewSchema = z.object({
  field1: z.string(),
  field2: z.number(),
});

// Export type
export type MyNewData = z.infer<typeof myNewSchema>;
```
