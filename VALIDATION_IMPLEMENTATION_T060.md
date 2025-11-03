# T060: Validation Schemas for Registration and Login Implementation

## Summary

This task implements comprehensive Zod validation schemas for user registration and login endpoints, ensuring data integrity and meeting all functional requirements from the specification.

## Changes Made

### 1. Updated Registration Schema (`backend/src/utils/validators.util.ts`)

**Added password confirmation validation (FR-003):**

```typescript
export const userRegistrationSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, 'Password confirmation is required'),
    displayName: displayNameSchema,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });
```

**Key Features:**
- Username validation: 3-50 alphanumeric characters + underscore (FR-001)
- Password validation: minimum 8 characters (FR-001)
- Password confirmation required with matching validation (FR-003)
- Optional display name field (max 100 characters)

### 2. Enhanced Login Schema

The login schema was already in place and remains unchanged:

```typescript
export const userLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
```

### 3. Updated Auth Routes (`backend/src/routes/auth.routes.ts`)

**Added validation for refresh token endpoint:**

```typescript
router.post('/refresh', authRateLimit, validate(refreshTokenSchema), authController.refreshToken);
```

All auth endpoints now have proper validation middleware:
- `/auth/register` - validates with `registerSchema`
- `/auth/login` - validates with `loginSchema`
- `/auth/refresh` - validates with `refreshTokenSchema`

### 4. Updated Auth Controller (`backend/src/controllers/auth.controller.ts`)

**Removed redundant validation:**
- Removed manual `if (!username || !password)` checks since validation middleware handles this
- Added `displayName` parameter extraction from request body
- Updated to pass `displayName` to auth service

### 5. Updated Auth Service (`backend/src/services/auth.service.ts`)

**Added displayName support:**
```typescript
async register(
  username: string,
  password: string,
  deviceInfo?: { ... },
  displayName?: string
) {
  // ...
  const user = await this.userRepo.create({
    username,
    passwordHash,
    displayName: displayName || username, // Defaults to username if not provided
  });
}
```

### 6. Added Comprehensive Tests (`backend/src/utils/__tests__/validators.util.test.ts`)

**New test suite covering:**
- Valid username formats
- Invalid username formats (too short, too long, invalid characters)
- Valid password lengths
- Invalid password lengths
- Registration with password confirmation
- Registration without displayName
- Password mismatch detection
- Login validation

### 7. Updated Existing Tests (`backend/tests/unit/utils/validators.util.test.ts`)

**Fixed breaking tests:**
- Added `passwordConfirm` field to all registration test cases
- Added new test case for non-matching passwords
- All 68 tests now pass

## Validation Rules

### Registration (`POST /auth/register`)

**Request Body:**
```json
{
  "username": "john_doe",           // Required: 3-50 chars, alphanumeric + underscore
  "password": "password123",         // Required: min 8 chars
  "passwordConfirm": "password123",  // Required: must match password
  "displayName": "John Doe"          // Optional: max 100 chars
}
```

**Validation Errors:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username must be at least 3 characters",
      "code": "too_small"
    },
    {
      "field": "passwordConfirm",
      "message": "Passwords do not match",
      "code": "custom"
    }
  ]
}
```

### Login (`POST /auth/login`)

**Request Body:**
```json
{
  "username": "john_doe",      // Required: non-empty string
  "password": "password123"    // Required: non-empty string
}
```

### Refresh Token (`POST /auth/refresh`)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Required: non-empty string
}
```

## Testing

### Run All Validation Tests

```bash
cd backend
npm test -- validators.util.test.ts
```

**Results:**
```
Test Suites: 2 passed, 2 total
Tests:       68 passed, 68 total
```

### Manual Testing

1. **Valid Registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "passwordConfirm": "password123",
    "displayName": "Test User"
  }'
```

2. **Password Mismatch:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "passwordConfirm": "different123"
  }'
```

Expected: `400 Bad Request` with error message "Passwords do not match"

3. **Invalid Username:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

Expected: `400 Bad Request` with error message "Username must be at least 3 characters"

## Compliance with Specifications

### Functional Requirements Met

- ✅ **FR-001**: Username validation (3-50 alphanumeric + underscore), password min 8 chars
- ✅ **FR-002**: Username uniqueness validation (handled by AuthService)
- ✅ **FR-003**: Password confirmation during registration
- ✅ **FR-004**: Auto-login after registration (existing functionality)
- ✅ **FR-005**: Username/password authentication

### User Story 1 Acceptance Criteria

1. ✅ **Scenario 1**: Validates unique username (3-50 chars) and secure password (min 8 chars)
2. ✅ **Scenario 2**: Login with correct credentials validated
3. ✅ **Scenario 3**: Invalid credentials properly validated and rejected

## Architecture Patterns

### Validation Middleware Pattern

The validation is implemented using a layered architecture:

```
Route → Validation Middleware → Controller → Service → Repository
  ↓            ↓                    ↓           ↓          ↓
Apply      Validate with          Extract    Business    Data
Rate       Zod Schema             Data       Logic       Access
Limit      (Auto-reject if        Pass to    (Username   (Create
          invalid)                Service    checks)     User)
```

**Benefits:**
- Separation of concerns
- Early request rejection (before hitting business logic)
- Consistent error format across all endpoints
- Type safety with TypeScript + Zod inference
- Reusable schemas

## Frontend Integration

The frontend is already compatible with these changes:

1. **RegisterPage** (`frontend/src/components/auth/RegisterPage.tsx`):
   - Already has password confirmation field
   - Includes client-side validation before API call

2. **AuthStore** (`frontend/src/store/authStore.ts`):
   - `register` method accepts `passwordConfirm` parameter
   - Handles validation errors from API

3. **API Service** (`frontend/src/services/api.service.ts`):
   - `register` method sends `passwordConfirm` in request body
   - Properly formatted API calls

## Error Handling

The validation middleware provides structured error responses:

```typescript
interface ValidationErrorResponse {
  error: string;           // Human-readable error message
  details: Array<{
    field: string;         // Field that failed validation
    message: string;       // Specific validation error
    code?: string;         // Zod error code (e.g., 'too_small', 'custom')
  }>;
}
```

**Example:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username must be at least 3 characters",
      "code": "too_small"
    },
    {
      "field": "passwordConfirm",
      "message": "Passwords do not match",
      "code": "custom"
    }
  ]
}
```

## Future Enhancements

Potential improvements for future iterations:

1. **Strong Password Validation**: 
   - Currently uses basic 8-char minimum
   - `strongPasswordSchema` exists for requiring uppercase, lowercase, number, and special char
   - Can be enabled by replacing `passwordSchema` with `strongPasswordSchema` in registration

2. **Username Uniqueness in Schema**:
   - Could add async validation in schema using `refine` with database lookup
   - Currently handled in service layer

3. **Password Strength Indicator**:
   - Frontend could show real-time strength meter
   - Backend provides clear feedback on complexity requirements

4. **Rate Limiting Validation**:
   - Already implemented via `authRateLimit` middleware
   - 5 attempts per 15 minutes (FR-006)

## References

- Zod Documentation: https://zod.dev
- Validation Middleware: `backend/src/middleware/validation.middleware.ts`
- Validation Examples: `backend/src/middleware/validation.examples.ts`
- Spec Requirements: `specs/001-messenger-app/spec.md` (FR-001, FR-002, FR-003)
