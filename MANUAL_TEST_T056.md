# Manual Test Plan for T056: UserController Profile Endpoints

## Prerequisites
1. Backend server running on http://localhost:3000 (or configured port)
2. PostgreSQL database with schema initialized
3. Valid test user account created
4. JWT access token for authentication

## Test Scenarios

### Test 1: Get Current User Profile
**Goal**: Verify user can retrieve their own profile

**Steps**:
```bash
# Replace TOKEN with actual JWT access token
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response contains:
  ```json
  {
    "user": {
      "id": "uuid",
      "username": "testuser",
      "displayName": "Test User",
      "avatarUrl": "https://...",
      "status": "online",
      "lastSeen": "2025-01-01T12:00:00Z",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T12:00:00Z"
    }
  }
  ```

### Test 2: Update Profile - Display Name Only
**Goal**: Verify user can update display name

**Steps**:
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name"
  }'
```

**Expected Result**:
- Status: 200 OK
- Response contains updated user with new displayName
- Other fields remain unchanged

### Test 3: Update Profile - Status Only (FR-011)
**Goal**: Verify user can update their online status

**Steps**:
```bash
# Test "away" status
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "away"
  }'
```

**Expected Result**:
- Status: 200 OK
- Response contains user with status: "away"
- lastSeen timestamp updated

**Test Variations**:
```bash
# Test "online" status
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "online"
  }'

# Test "offline" status
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "offline"
  }'
```

### Test 4: Update Profile - Multiple Fields
**Goal**: Verify multiple fields can be updated simultaneously

**Steps**:
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Smith",
    "avatarUrl": "https://example.com/avatar.jpg",
    "status": "away"
  }'
```

**Expected Result**:
- Status: 200 OK
- All three fields updated correctly
- Response reflects all changes

### Test 5: Update Profile - Invalid Status
**Goal**: Verify validation rejects invalid status values

**Steps**:
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "invalid_status"
  }'
```

**Expected Result**:
- Status: 400 Bad Request or 422 Validation Error
- Error message indicating invalid status value

### Test 6: Search Users
**Goal**: Verify user search functionality

**Steps**:
```bash
# Search for users with 'john' in username
curl -X GET "http://localhost:3000/api/users/search?q=john&limit=10" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response contains array of matching users:
  ```json
  {
    "users": [
      {
        "id": "uuid",
        "username": "john_doe",
        "displayName": "John Doe",
        "avatarUrl": "...",
        "status": "online",
        "lastSeen": "...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      ...
    ]
  }
  ```

### Test 7: Search Users - No Results
**Goal**: Verify empty results handled correctly

**Steps**:
```bash
curl -X GET "http://localhost:3000/api/users/search?q=nonexistentuser12345" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response contains empty array:
  ```json
  {
    "users": []
  }
  ```

### Test 8: Search Users - Missing Query
**Goal**: Verify validation requires search query

**Steps**:
```bash
curl -X GET "http://localhost:3000/api/users/search" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 400 Bad Request
- Error message: "Search query is required"

### Test 9: Get User By ID - Self
**Goal**: Verify user can view their own profile by ID

**Steps**:
```bash
# Replace USER_ID with the authenticated user's ID
curl -X GET "http://localhost:3000/api/users/USER_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response contains full user profile

### Test 10: Get User By ID - Contact
**Goal**: Verify user can view contact's profile

**Steps**:
```bash
# Replace CONTACT_USER_ID with ID of a user in contacts
curl -X GET "http://localhost:3000/api/users/CONTACT_USER_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response contains contact's profile

### Test 11: Get User By ID - Unauthorized
**Goal**: Verify access control prevents viewing unauthorized profiles

**Steps**:
```bash
# Replace RANDOM_USER_ID with ID of a user not in contacts and no shared chats
curl -X GET "http://localhost:3000/api/users/RANDOM_USER_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 403 Forbidden or 404 Not Found
- Error message about permissions

### Test 12: Get User By ID - Invalid UUID
**Goal**: Verify UUID validation works

**Steps**:
```bash
curl -X GET "http://localhost:3000/api/users/invalid-uuid" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 400 Bad Request or 422 Validation Error
- Error message about invalid UUID format

### Test 13: Unauthenticated Access
**Goal**: Verify all endpoints require authentication

**Steps**:
```bash
# Try to get profile without token
curl -X GET http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 401 Unauthorized
- Error message about missing or invalid token

## Complete User Story Scenario

**Scenario**: Create new account with username/password, log out, log back in, verify session persistence

### Step 1: Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser123",
    "password": "SecurePass123!",
    "passwordConfirm": "SecurePass123!"
  }'
```
**Expected**: 201 Created with accessToken, refreshToken, and user object

### Step 2: Get Profile (Verify Auto-Login)
```bash
# Use accessToken from registration
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected**: 200 OK with user profile

### Step 3: Update Profile Information
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "New User Full Name",
    "status": "online"
  }'
```
**Expected**: 200 OK with updated profile

### Step 4: Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected**: 204 No Content

### Step 5: Login Again
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser123",
    "password": "SecurePass123!"
  }'
```
**Expected**: 200 OK with new accessToken and refreshToken

### Step 6: Verify Profile Persists
```bash
# Use new accessToken from login
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer NEW_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected**: 200 OK with profile showing displayName from Step 3

## Success Criteria Checklist

- [x] GET /api/users/profile returns current user profile
- [x] PUT /api/users/profile updates displayName
- [x] PUT /api/users/profile updates avatarUrl
- [x] PUT /api/users/profile updates status (online, offline, away)
- [x] PUT /api/users/profile validates status values
- [x] GET /api/users/search finds users by username
- [x] GET /api/users/search validates query parameter
- [x] GET /api/users/search has rate limiting
- [x] GET /api/users/:userId returns user profile with access control
- [x] GET /api/users/:userId validates UUID format
- [x] All endpoints require authentication
- [x] Complete user story scenario works end-to-end
- [x] Profile changes persist across logout/login
