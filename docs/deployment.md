# Deployment Guide

This guide covers deploying the 1000-messenger application to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Scaling](#scaling)
- [Backup and Recovery](#backup-and-recovery)

## Prerequisites

### Required Software
- **Kubernetes**: v1.24+ (for K8s deployment)
- **Docker**: v20.10+ and Docker Compose v2.0+
- **PostgreSQL**: v14+ (or managed database service)
- **Redis**: v6+ (or managed Redis service)
- **Node.js**: v18+ (for building)

### Required Resources
- **Minimum**: 4 CPU cores, 8GB RAM, 50GB storage
- **Recommended**: 8 CPU cores, 16GB RAM, 100GB storage
- **Production**: Auto-scaling based on load (3-10 backend pods)

### SSL/TLS Certificates
- Required for production deployments
- Can use Let's Encrypt with cert-manager in K8s
- Or provide your own certificates

## Environment Setup

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=messenger
DB_USER=messenger_user
DB_PASSWORD=<strong-password>
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Storage (S3 compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=messenger-uploads
S3_ACCESS_KEY=<your-access-key>
S3_SECRET_KEY=<your-secret-key>

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Secrets Management

**Kubernetes**: Use Kubernetes Secrets
```bash
kubectl create secret generic chat-secrets \
  --from-literal=database-url=postgresql://user:pass@host:5432/db \
  --from-literal=redis-url=redis://user:pass@host:6379 \
  --from-literal=jwt-secret=<your-jwt-secret> \
  --from-literal=postgres-password=<your-postgres-password> \
  --from-literal=redis-password=<your-redis-password> \
  -n chat-app
```

**Docker Compose**: Use Docker secrets or environment files

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets
```bash
kubectl create secret generic chat-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=redis-url=redis://... \
  --from-literal=jwt-secret=... \
  -n chat-app
```

### 3. Deploy PostgreSQL
```bash
kubectl apply -f k8s/postgres-statefulset.yaml
```

Wait for PostgreSQL to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n chat-app --timeout=300s
```

### 4. Deploy Redis
```bash
kubectl apply -f k8s/redis-statefulset.yaml
```

### 5. Run Database Migrations
```bash
# Create a migration job pod
kubectl run migration-job \
  --image=your-registry/chat-backend:latest \
  --restart=Never \
  --command -- npm run migrate \
  -n chat-app

# Check logs
kubectl logs migration-job -n chat-app
```

### 6. Deploy Backend
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

### 7. Deploy Frontend (if separate)
```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

### 8. Configure Ingress
```bash
# Update ingress.yaml with your domain
kubectl apply -f k8s/ingress.yaml
```

### 9. Verify Deployment
```bash
# Check all pods
kubectl get pods -n chat-app

# Check services
kubectl get svc -n chat-app

# Check ingress
kubectl get ingress -n chat-app
```

## Docker Compose Deployment

### 1. Build Images
```bash
# Build backend
docker build -t messenger-backend:latest ./backend

# Build frontend
docker build -t messenger-frontend:latest ./frontend
```

### 2. Configure Environment
```bash
# Copy and edit production environment file
cp .env.example .env.production
nano .env.production
```

### 3. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Run Migrations
```bash
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

### 5. Check Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Post-Deployment Verification

### Health Checks

**Backend Health**:
```bash
curl https://your-domain.com/api/health
# Expected: {"status":"ok"}
```

**Backend Readiness**:
```bash
curl https://your-domain.com/api/ready
# Expected: {"status":"ready","database":"connected","redis":"connected"}
```

### Functional Testing

1. **User Registration**:
```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123","passwordConfirm":"testpass123"}'
```

2. **User Login**:
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

3. **WebSocket Connection**:
```bash
# Use a WebSocket client or browser to test
wscat -c wss://your-domain.com/socket.io/
```

### Monitoring

Check metrics endpoints:
```bash
curl https://your-domain.com/api/metrics
```

## Scaling

### Horizontal Scaling (Kubernetes)

The backend includes a HorizontalPodAutoscaler that automatically scales based on CPU and memory:

```yaml
minReplicas: 3
maxReplicas: 10
targetCPUUtilizationPercentage: 70
targetMemoryUtilizationPercentage: 80
```

Manual scaling:
```bash
kubectl scale deployment backend --replicas=5 -n chat-app
```

### Vertical Scaling

Update resource limits in deployment manifests:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### Database Scaling

**Read Replicas**: Configure PostgreSQL read replicas for read-heavy workloads
**Connection Pooling**: Already configured with min/max pool sizes

## Backup and Recovery

### Database Backup

**Automated backups (Kubernetes)**:
```bash
# Create CronJob for daily backups
kubectl apply -f k8s/backup-cronjob.yaml
```

**Manual backup**:
```bash
# PostgreSQL dump
kubectl exec -it postgres-0 -n chat-app -- \
  pg_dump -U chatuser chatapp > backup-$(date +%Y%m%d).sql
```

**Restore from backup**:
```bash
kubectl exec -i postgres-0 -n chat-app -- \
  psql -U chatuser chatapp < backup-20240101.sql
```

### Redis Backup

Redis is configured with AOF (Append-Only File) persistence:
```bash
# Trigger save
kubectl exec -it redis-0 -n chat-app -- redis-cli BGSAVE

# Copy RDB file
kubectl cp chat-app/redis-0:/data/dump.rdb ./redis-backup.rdb
```

## Rollback

### Kubernetes Rollback
```bash
# View revision history
kubectl rollout history deployment/backend -n chat-app

# Rollback to previous version
kubectl rollout undo deployment/backend -n chat-app

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n chat-app
```

### Docker Compose Rollback
```bash
# Pull previous image version
docker pull messenger-backend:v1.2.3

# Update docker-compose.prod.yml with previous version
# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

See [troubleshooting.md](./troubleshooting.md) for common issues and solutions.

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Secrets stored securely (not in code/config)
- [ ] CORS configured for specific domains only
- [ ] Rate limiting enabled
- [ ] Database credentials rotated
- [ ] Firewall rules configured
- [ ] Security headers enabled (CSP, HSTS, etc.)
- [ ] Regular security updates applied
- [ ] Backup and recovery tested

## Performance Tuning

### Database Optimization
- Create indexes on frequently queried fields
- Use connection pooling
- Enable query logging to identify slow queries
- Consider read replicas for read-heavy loads

### Redis Optimization
- Configure maxmemory policy
- Use Redis Cluster for high availability
- Monitor memory usage

### Application Optimization
- Enable gzip compression
- Configure CDN for static assets
- Optimize image sizes
- Use caching where appropriate

## Monitoring and Alerts

### Metrics to Monitor
- Request rate and latency
- Error rate (4xx, 5xx responses)
- Database query performance
- WebSocket connection count
- Memory and CPU usage
- Disk I/O

### Recommended Tools
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **AlertManager** for alerts
- **Loki** for log aggregation
- **Jaeger** for distributed tracing

## Support

For deployment issues, see:
- [Troubleshooting Guide](./troubleshooting.md)
- [WebSocket Events](./websocket-events.md)
- [Architecture Diagram](./arch.md)
