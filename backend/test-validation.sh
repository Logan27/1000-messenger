#!/bin/bash

# Test script for T060 validation implementation
# Tests registration and login validation schemas

echo "🧪 Testing Registration and Login Validation (T060)"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:5000/api}"

# Test 1: Valid Registration
echo -e "${YELLOW}Test 1: Valid Registration${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "password123",
    "passwordConfirm": "password123",
    "displayName": "Test User"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 201 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Valid registration accepted (201)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 201, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 2: Username too short
echo -e "${YELLOW}Test 2: Username Too Short (< 3 chars)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "password123",
    "passwordConfirm": "password123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ] && echo "$body" | grep -q "Username must be at least 3 characters"; then
  echo -e "${GREEN}✓ PASS${NC} - Short username rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400 with username error, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 3: Password too short
echo -e "${YELLOW}Test 3: Password Too Short (< 8 chars)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "validuser",
    "password": "pass123",
    "passwordConfirm": "pass123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ] && echo "$body" | grep -q "Password must be at least 8 characters"; then
  echo -e "${GREEN}✓ PASS${NC} - Short password rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400 with password error, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 4: Passwords don't match
echo -e "${YELLOW}Test 4: Password Mismatch${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "validuser",
    "password": "password123",
    "passwordConfirm": "different123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ] && echo "$body" | grep -q "Passwords do not match"; then
  echo -e "${GREEN}✓ PASS${NC} - Password mismatch rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400 with mismatch error, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 5: Missing passwordConfirm
echo -e "${YELLOW}Test 5: Missing passwordConfirm${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "validuser",
    "password": "password123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Missing passwordConfirm rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 6: Invalid username characters
echo -e "${YELLOW}Test 6: Invalid Username Characters${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@name",
    "password": "password123",
    "passwordConfirm": "password123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ] && echo "$body" | grep -q "Username can only contain"; then
  echo -e "${GREEN}✓ PASS${NC} - Invalid username chars rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400 with character error, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 7: Valid Login
echo -e "${YELLOW}Test 7: Valid Login${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 401 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Login request properly validated"
  echo "  (200 = success, 401 = wrong credentials - both indicate validation passed)"
else
  echo -e "${RED}✗ FAIL${NC} - Unexpected status code: $http_code"
  echo "Response: $body"
fi
echo ""

# Test 8: Empty username in login
echo -e "${YELLOW}Test 8: Empty Username in Login${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "",
    "password": "password123"
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ] && echo "$body" | grep -q "Username is required"; then
  echo -e "${GREEN}✓ PASS${NC} - Empty username rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400 with username error, got $http_code"
  echo "Response: $body"
fi
echo ""

# Test 9: Empty password in login
echo -e "${YELLOW}Test 9: Empty Password in Login${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": ""
  }')
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 400 ] && echo "$body" | grep -q "Password is required"; then
  echo -e "${GREEN}✓ PASS${NC} - Empty password rejected (400)"
else
  echo -e "${RED}✗ FAIL${NC} - Expected 400 with password error, got $http_code"
  echo "Response: $body"
fi
echo ""

echo "=================================================="
echo "✅ Validation Tests Complete"
echo ""
echo "Note: To run these tests, start the backend server first:"
echo "  cd backend && npm run dev"
echo ""
echo "Then run this script:"
echo "  ./backend/test-validation.sh"
