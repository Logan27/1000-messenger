#!/bin/bash
# Script to verify local development environment setup

set -e

echo "🔍 Verifying local development setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Docker
echo "Checking prerequisites..."
if command_exists docker; then
    success "Docker is installed: $(docker --version | cut -d' ' -f3 | sed 's/,//')"
else
    error "Docker is not installed"
    exit 1
fi

# Check Docker Compose
if docker compose version >/dev/null 2>&1; then
    success "Docker Compose is installed: $(docker compose version | cut -d' ' -f4)"
else
    error "Docker Compose is not installed"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        success "Node.js is installed: v$NODE_VERSION"
    else
        warning "Node.js version should be 20 or higher (current: v$NODE_VERSION)"
    fi
else
    warning "Node.js is not installed (required for running backend/frontend locally)"
fi

# Check npm
if command_exists npm; then
    success "npm is installed: $(npm --version)"
else
    warning "npm is not installed (required for running backend/frontend locally)"
fi

echo ""
echo "Checking Docker services..."

# Check if services are running
SERVICES_RUNNING=false
if docker compose -f docker-compose.dev.yml ps --quiet 2>/dev/null | grep -q .; then
    SERVICES_RUNNING=true
fi

if [ "$SERVICES_RUNNING" = true ]; then
    echo ""
    success "Docker services are running"
    
    # Check PostgreSQL
    if docker exec chat-postgres-dev pg_isready -U chatuser -d chatapp >/dev/null 2>&1; then
        success "PostgreSQL is healthy and accepting connections"
    else
        error "PostgreSQL is not responding"
    fi
    
    # Check Redis
    if docker exec chat-redis-dev redis-cli -a redispass ping 2>/dev/null | grep -q PONG; then
        success "Redis is healthy and accepting connections"
    else
        error "Redis is not responding"
    fi
    
    # Check MinIO
    if docker exec chat-minio-dev curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
        success "MinIO is healthy and accepting connections"
    else
        error "MinIO is not responding"
    fi
else
    warning "Docker services are not running"
    echo ""
    echo "To start services, run:"
    echo "  docker compose -f docker-compose.dev.yml up -d"
fi

echo ""
echo "Checking environment files..."

# Check backend .env
if [ -f "backend/.env" ]; then
    success "backend/.env exists"
else
    warning "backend/.env does not exist (copy from backend/.env.example)"
fi

# Check frontend .env
if [ -f "frontend/.env" ]; then
    success "frontend/.env exists"
else
    warning "frontend/.env does not exist (copy from frontend/.env.example)"
fi

echo ""
echo "Checking dependencies..."

# Check backend node_modules
if [ -d "backend/node_modules" ]; then
    success "Backend dependencies installed"
else
    warning "Backend dependencies not installed (run: cd backend && npm install)"
fi

# Check frontend node_modules
if [ -d "frontend/node_modules" ]; then
    success "Frontend dependencies installed"
else
    warning "Frontend dependencies not installed (run: cd frontend && npm install)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SERVICES_RUNNING" = false ]; then
    echo "Next steps to start development:"
    echo "  1. docker compose -f docker-compose.dev.yml up -d"
    echo "  2. cd backend && npm install && cp .env.example .env"
    echo "  3. cd backend && npm run migrate"
    echo "  4. cd backend && npm run dev"
    echo "  5. In a new terminal: cd frontend && npm install && cp .env.example .env"
    echo "  6. cd frontend && npm run dev"
else
    echo "✨ Your development environment is ready!"
    echo ""
    echo "Services available at:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo "  - MinIO Console: http://localhost:9001"
    echo "  - MinIO API: http://localhost:9000"
    echo ""
    echo "To start development:"
    echo "  - Backend: cd backend && npm run dev"
    echo "  - Frontend: cd frontend && npm run dev"
fi

echo ""
