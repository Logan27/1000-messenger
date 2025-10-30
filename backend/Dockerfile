# Multi-stage build for production
# Stage 1: Builder - Build TypeScript and generate Prisma client
FROM node:20.11-alpine AS builder

# Add metadata labels
LABEL org.opencontainers.image.title="Chat Backend Builder"
LABEL org.opencontainers.image.description="Build stage for Real-Time Messenger Backend"
LABEL org.opencontainers.image.vendor="Messenger Team"

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy dependency manifests first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --silent

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production - Minimal runtime image
FROM node:20.11-alpine AS production

# Add metadata labels
LABEL org.opencontainers.image.title="Chat Backend"
LABEL org.opencontainers.image.description="Production image for Real-Time Messenger Backend API"
LABEL org.opencontainers.image.vendor="Messenger Team"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache tini curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy Prisma schema and migrations (needed for runtime and migrations)
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy environment example and entrypoint script
COPY .env.example ./
COPY docker-entrypoint.sh ./

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chmod +x docker-entrypoint.sh && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]

# Start application
CMD ["node", "dist/server.js"]
