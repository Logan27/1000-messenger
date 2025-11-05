# 1000-Messenger Deployment Guide

Complete guide for deploying the 1000-Messenger application to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Object Storage Setup](#object-storage-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring](#monitoring)
- [Backup Strategy](#backup-strategy)
- [Scaling Guidelines](#scaling-guidelines)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum (Development/Testing):**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Network: 10 Mbps

**Recommended (Production):**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB (SSD)
- Network: 100 Mbps

### Software Requirements

- **Docker**: 20.10+ & Docker Compose 2.0+
- **Kubernetes**: 1.24+ (for K8s deployment)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Node.js**: 20+ LTS (for local development)
- **MinIO** or **AWS S3** (for object storage)

### Domain & SSL

- Domain name configured with DNS
- SSL/TLS certificate (Let's Encrypt recommended)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/1000-messenger.git
cd 1000-messenger
```

### 2. Configure Environment Variables

#### Backend Environment (.env)

Create `backend/.env` from `backend/.env.example`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/messenger?schema=public"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_at_least_32_chars
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_at_least_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Object Storage (MinIO/S3)
STORAGE_TYPE=minio  # or 's3'
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=messenger-files
STORAGE_REGION=us-east-1
STORAGE_USE_SSL=false

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW=60000  # 1 minute
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

#### Frontend Environment (.env)

Create `frontend/.env` from `frontend/.env.example`:

```bash
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
VITE_ENABLE_SW_DEV=false
```

---

## Docker Deployment

### Using Docker Compose (Recommended for Single Server)

#### 1. Build Images

```bash
# Build all services
docker-compose build

# Or build individually
docker-compose build backend
docker-compose build frontend
```

#### 2. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### 3. Run Database Migrations

```bash
docker-compose exec backend npm run db:migrate
```

#### 4. Verify Deployment

```bash
# Check backend health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost:80
```

### Production Docker Compose

Use `docker-compose.prod.yml` for production:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Key differences in production compose:
- Uses production images
- Configures restart policies
- Sets resource limits
- Uses secrets for sensitive data
- Enables health checks

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3+ (optional but recommended)

### 1. Create Namespace

```bash
kubectl create namespace messenger
```

### 2. Create Secrets

```bash
# Create database secret
kubectl create secret generic db-secret \
  --from-literal=url="postgresql://user:password@postgres:5432/messenger" \
  --namespace=messenger

# Create JWT secrets
kubectl create secret generic jwt-secret \
  --from-literal=secret="your_jwt_secret" \
  --from-literal=refresh-secret="your_refresh_secret" \
  --namespace=messenger

# Create storage secrets
kubectl create secret generic storage-secret \
  --from-literal=access-key="your_access_key" \
  --from-literal=secret-key="your_secret_key" \
  --namespace=messenger
```

### 3. Deploy StatefulSets

```bash
# PostgreSQL
kubectl apply -f k8s/postgres-statefulset.yaml

# Redis
kubectl apply -f k8s/redis-statefulset.yaml

# MinIO
kubectl apply -f k8s/minio-statefulset.yaml
```

### 4. Deploy Application

```bash
# Backend
kubectl apply -f k8s/backend-deployment.yaml

# Frontend
kubectl apply -f k8s/frontend-deployment.yaml
```

### 5. Configure Ingress

```bash
# Apply ingress configuration
kubectl apply -f k8s/ingress.yaml
```

### 6. Verify Deployment

```bash
# Check all pods
kubectl get pods -n messenger

# Check services
kubectl get svc -n messenger

# Check ingress
kubectl get ingress -n messenger

# View logs
kubectl logs -f deployment/backend -n messenger
```

### Scaling

```bash
# Scale backend
kubectl scale deployment/backend --replicas=3 -n messenger

# Scale frontend
kubectl scale deployment/frontend --replicas=2 -n messenger
```

---

## Database Setup

### PostgreSQL Configuration

#### 1. Install PostgreSQL 15+

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Database and User

```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database
CREATE DATABASE messenger;

-- Create user
CREATE USER messenger_user WITH ENCRYPTED PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE messenger TO messenger_user;

-- Exit
\q
```

#### 3. Run Migrations

```bash
cd backend
npm run db:migrate
```

#### 4. Configure Connection Pooling

Edit `postgresql.conf`:

```conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

#### 5. Create Read Replica (Optional)

For high-traffic deployments, configure a read replica:

```bash
# On primary server
pg_basebackup -h primary -D /var/lib/postgresql/replica -U replication -P --wal-method=stream
```

---

## Redis Setup

### Redis Configuration

#### 1. Install Redis 7+

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 2. Configure Redis

Edit `/etc/redis/redis.conf`:

```conf
# Bind to localhost (or specific IP)
bind 127.0.0.1

# Set password
requirepass your_secure_password

# Enable AOF persistence
appendonly yes
appendfsync everysec

# Set memory limit
maxmemory 2gb
maxmemory-policy allkeys-lru

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

#### 3. Restart Redis

```bash
sudo systemctl restart redis-server
```

#### 4. Test Connection

```bash
redis-cli -h localhost -p 6379 -a your_secure_password ping
# Should return: PONG
```

---

## Object Storage Setup

### Option 1: MinIO (Self-Hosted)

#### 1. Install MinIO

```bash
# Download MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create data directory
sudo mkdir -p /data/minio
```

#### 2. Create SystemD Service

Create `/etc/systemd/system/minio.service`:

```ini
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
User=minio
Group=minio
Environment="MINIO_ROOT_USER=admin"
Environment="MINIO_ROOT_PASSWORD=your_secure_password"
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

#### 3. Start MinIO

```bash
sudo systemctl start minio
sudo systemctl enable minio
```

#### 4. Create Bucket

```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure client
mc alias set local http://localhost:9000 admin your_secure_password

# Create bucket
mc mb local/messenger-files

# Set public policy for images
mc policy set download local/messenger-files
```

### Option 2: AWS S3

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://messenger-files --region us-east-1
```

#### 2. Configure CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### 3. Create IAM User

Create user with S3 access and save credentials.

---

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

#### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

#### 2. Configure Nginx

Create `/etc/nginx/sites-available/messenger`:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration (added by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 3. Obtain Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

#### 4. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Enable auto-renewal (already configured by default)
sudo systemctl status certbot.timer
```

---

## Monitoring

### Health Checks

```bash
# Backend health
curl https://api.your-domain.com/api/health

# Check response time
curl -o /dev/null -s -w 'Time: %{time_total}s\n' https://api.your-domain.com/api/health
```

### Recommended Monitoring Stack

1. **Prometheus** - Metrics collection
2. **Grafana** - Visualization
3. **Loki** - Log aggregation
4. **Alert Manager** - Alerting

### Key Metrics to Monitor

- **Backend:**
  - Request rate and latency (P95, P99)
  - Error rate
  - WebSocket connections
  - Database connection pool
  - Redis hit rate
  - Memory usage
  - CPU usage

- **Database:**
  - Query performance
  - Connection count
  - Replication lag (if using replicas)
  - Disk usage

- **Redis:**
  - Memory usage
  - Hit/miss ratio
  - Command latency

---

## Backup Strategy

### Database Backups

#### Automated Backups

Create `/usr/local/bin/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="messenger"

mkdir -p $BACKUP_DIR

pg_dump -U messenger_user -h localhost $DB_NAME | \
  gzip > $BACKUP_DIR/backup_${TIMESTAMP}.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

### Object Storage Backups

```bash
# Sync to S3
aws s3 sync /data/minio/messenger-files s3://messenger-backups/files
```

---

## Scaling Guidelines

### Horizontal Scaling

#### Backend Scaling

```bash
# Docker Compose
docker-compose scale backend=3

# Kubernetes
kubectl scale deployment/backend --replicas=5 -n messenger
```

#### Load Balancer Configuration

Use Nginx or HAProxy to distribute load:

```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

### Vertical Scaling

Increase resources for individual containers:

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Database Scaling

1. **Read Replicas**: For read-heavy workloads
2. **Connection Pooling**: Use PgBouncer
3. **Partitioning**: Partition large tables by date

### Performance Targets

- **1000 concurrent users**
- **50-100 messages/second sustained**
- **P95 latency < 300ms**
- **P99 latency < 500ms**

---

## Security Checklist

- [ ] All environment variables use secrets/vaults
- [ ] Database uses encrypted connections (SSL)
- [ ] Redis requires authentication
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Helmet middleware enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (content sanitization)
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configured
- [ ] Regular security updates applied
- [ ] Backups tested and verified
- [ ] Monitoring and alerts configured

---

## Post-Deployment Validation

### 1. Functionality Tests

```bash
# Test registration
curl -X POST https://api.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!","passwordConfirm":"Test123!"}'

# Test login
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!"}'
```

### 2. Performance Tests

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.your-domain.com/api/health
```

### 3. WebSocket Tests

Use the frontend application to test real-time messaging.

---

## Rollback Procedure

### Docker Rollback

```bash
# Stop current deployment
docker-compose down

# Deploy previous version
docker-compose up -d --build
```

### Kubernetes Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n messenger

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n messenger
```

### Database Rollback

```bash
# Restore from backup
gunzip < backup_20250105_020000.sql.gz | \
  psql -U messenger_user -h localhost messenger
```

---

## Support and Maintenance

### Log Locations

- **Backend**: `/var/log/messenger/backend.log` or `docker logs messenger_backend`
- **Nginx**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **PostgreSQL**: `/var/log/postgresql/postgresql-15-main.log`
- **Redis**: `/var/log/redis/redis-server.log`

### Useful Commands

```bash
# View live backend logs
docker-compose logs -f backend

# Check database connections
psql -U messenger_user -h localhost messenger -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory
redis-cli -a password INFO memory

# Restart services
docker-compose restart backend
kubectl rollout restart deployment/backend -n messenger
```

---

## Additional Resources

- [Troubleshooting Guide](./troubleshooting.md)
- [WebSocket Events](./websocket-events.md)
- [API Documentation](https://api.your-domain.com/docs)
- [Performance Guidelines](../PERFORMANCE_GUIDELINES.md)

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
