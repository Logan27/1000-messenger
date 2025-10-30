#!/bin/sh
set -e

echo "🚀 Starting backend container..."

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=0

    echo "⏳ Waiting for $service_name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "   Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
    done

    echo "❌ $service_name is not available after $max_attempts attempts"
    return 1
}

# Parse DATABASE_URL to extract host and port (if available)
if [ -n "$DATABASE_URL" ]; then
    # Extract database host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/database
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's#.*@\([^:]*\):[0-9]*/.*#\1#p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's#.*:\([0-9]*\)/.*#\1#p')
    
    if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
        # Install netcat if not available (for service checking)
        if ! command -v nc >/dev/null 2>&1; then
            echo "📦 Installing netcat for service checks..."
            apk add --no-cache netcat-openbsd 2>/dev/null || true
        fi
        
        # Wait for database if we can check
        if command -v nc >/dev/null 2>&1; then
            wait_for_service "$DB_HOST" "$DB_PORT" "PostgreSQL"
        fi
    fi
fi

# Parse REDIS_URL to extract host and port (if available)
if [ -n "$REDIS_URL" ]; then
    REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's#.*@\([^:]*\):[0-9]*#\1#p')
    REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's#.*:\([0-9]*\)$#\1#p')
    
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ] && command -v nc >/dev/null 2>&1; then
        wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis"
    fi
fi

# Run database migrations if RUN_MIGRATIONS is set to true
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy
    echo "✅ Migrations completed successfully!"
else
    echo "⏭️  Skipping migrations (RUN_MIGRATIONS not set to true)"
fi

# Execute the main command (start the application)
echo "🎯 Starting application..."
exec "$@"
