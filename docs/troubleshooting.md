# Troubleshooting Guide

Common issues and their solutions for the 1000-messenger application.

## Table of Contents
- [Connection Issues](#connection-issues)
- [Authentication Problems](#authentication-problems)
- [WebSocket Issues](#websocket-issues)
- [Database Problems](#database-problems)
- [Performance Issues](#performance-issues)
- [Message Delivery Problems](#message-delivery-problems)
- [File Upload Issues](#file-upload-issues)
- [Deployment Issues](#deployment-issues)

## Connection Issues

### Cannot Connect to Backend

**Symptoms**: Frontend shows "Cannot connect to server" or requests timeout

**Possible Causes**:
1. Backend service is not running
2. Network/firewall blocking connections
3. CORS misconfiguration
4. Wrong backend URL in frontend config

**Solutions**:

```bash
# Check if backend is running
curl http://localhost:3000/health

# Check backend logs
docker-compose logs backend
# or
kubectl logs -l app=backend -n chat-app

# Verify CORS configuration in backend
# Check backend/.env for CORS_ORIGIN

# Verify frontend API URL
# Check frontend/src/config.ts
```

### Connection Refused

**Error**: `ECONNREFUSED`

**Solutions**:
```bash
# Check if service is listening
netstat -tulpn | grep 3000

# Check Docker network (if using Docker)
docker network inspect messenger_default

# Check Kubernetes service
kubectl get svc -n chat-app
kubectl describe svc backend -n chat-app
```

## Authentication Problems

### Login Fails with "Invalid Credentials"

**Symptoms**: Correct username/password but login fails

**Possible Causes**:
1. Database connection issue
2. Password hashing mismatch
3. User doesn't exist

**Solutions**:

```bash
# Check if user exists in database
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT id, username FROM users WHERE username='<username>';"

# Check backend logs for error details
docker-compose logs backend | grep -i "auth\|login"

# Verify JWT_SECRET is set
docker-compose exec backend env | grep JWT_SECRET
```

### Token Expired Errors

**Error**: `401 Unauthorized` - "Token expired"

**Solutions**:
- This is normal behavior - the frontend should automatically refresh tokens
- Check if refresh token endpoint is working:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your-refresh-token>"}'
```
- Check JWT expiration settings in `.env`:
```
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Cannot Register New Users

**Error**: `400 Bad Request` - "Validation failed"

**Solutions**:
- Check password requirements (minimum 6 characters)
- Username must be unique
- Check validation errors in response body
```bash
# Example registration with curl
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "password":"testpass123",
    "passwordConfirm":"testpass123",
    "displayName":"Test User"
  }'
```

## WebSocket Issues

### WebSocket Connection Fails

**Error**: Browser console shows `WebSocket connection failed`

**Possible Causes**:
1. WebSocket server not running
2. Proxy not configured for WebSocket upgrade
3. SSL/TLS certificate issues (wss://)

**Solutions**:

```bash
# Test WebSocket connection
wscat -c ws://localhost:3001

# Check nginx/ingress WebSocket configuration (if using reverse proxy)
# Ensure these headers are set:
# Upgrade: websocket
# Connection: Upgrade

# For Kubernetes Ingress, ensure annotation is present:
kubectl get ingress chat-ingress -n chat-app -o yaml | \
  grep websocket-services
```

### Messages Not Received in Real-Time

**Symptoms**: New messages don't appear until page refresh

**Possible Causes**:
1. WebSocket disconnected
2. Redis pub/sub not working
3. Event listeners not registered

**Solutions**:

```bash
# Check Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check Redis pub/sub channels
docker-compose exec redis redis-cli
> PUBSUB CHANNELS
> PUBSUB NUMSUB chat:*

# Check WebSocket connection in browser dev tools
# Network tab -> WS -> Check connection status

# Check backend logs for WebSocket events
docker-compose logs backend | grep -i websocket
```

### WebSocket Disconnects Frequently

**Symptoms**: Connection drops every few minutes

**Solutions**:
- Increase connection timeout in ingress/proxy:
```yaml
# Kubernetes Ingress annotation
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
```
- Check for network issues or load balancer timeouts
- Implement ping/pong heartbeat (already included in Socket.IO)

## Database Problems

### Cannot Connect to Database

**Error**: `Connection refused` or `ECONNREFUSED`

**Solutions**:

```bash
# Check if PostgreSQL is running
docker-compose ps postgres
kubectl get pods -l app=postgres -n chat-app

# Test database connection
docker-compose exec postgres psql -U chatuser -d chatapp -c "SELECT 1;"

# Check database credentials
docker-compose exec backend env | grep DB_

# Check PostgreSQL logs
docker-compose logs postgres
```

### Database Migrations Failed

**Error**: Migration script errors

**Solutions**:

```bash
# Check migration status
docker-compose exec backend npm run migrate:status

# Rollback last migration
docker-compose exec backend npm run migrate:down

# Re-run migrations
docker-compose exec backend npm run migrate:up

# If migrations are stuck, manually reset (CAUTION: development only)
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose exec backend npm run migrate:up
```

### Slow Database Queries

**Symptoms**: API responses are slow, high database CPU usage

**Solutions**:

```sql
-- Enable query logging (PostgreSQL)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries >1s
SELECT pg_reload_conf();

-- Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- Analyze slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Performance Issues

### High Memory Usage

**Symptoms**: Application uses excessive memory, crashes with OOM

**Solutions**:

```bash
# Check memory usage
docker stats
kubectl top pods -n chat-app

# Analyze memory leaks
# Add --inspect flag to Node.js process
# Use Chrome DevTools Memory Profiler

# Increase memory limits (if needed)
# Kubernetes:
kubectl set resources deployment backend \
  --limits=memory=2Gi \
  -n chat-app

# Docker Compose: Update docker-compose.yml
```

### High CPU Usage

**Symptoms**: CPU usage consistently high, slow responses

**Solutions**:

```bash
# Profile CPU usage
# Add --prof flag to Node.js
# Analyze with node --prof-process

# Check for expensive operations
# Review logs for slow queries
docker-compose logs backend | grep -E "Query executed.*[0-9]{3,}ms"

# Scale horizontally (Kubernetes)
kubectl scale deployment backend --replicas=5 -n chat-app
```

### Slow Page Load

**Symptoms**: Frontend takes long to load

**Solutions**:
- Enable gzip compression in nginx/ingress
- Optimize bundle size:
```bash
npm run build -- --stats
npx webpack-bundle-analyzer dist/stats.json
```
- Use CDN for static assets
- Enable browser caching headers

## Message Delivery Problems

### Messages Not Sending

**Symptoms**: Message appears to send but never delivers

**Possible Causes**:
1. WebSocket disconnected
2. Backend error processing message
3. Database error

**Solutions**:

```bash
# Check backend logs for errors
docker-compose logs backend | grep -i error

# Verify message was saved to database
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT id, content, created_at FROM messages ORDER BY created_at DESC LIMIT 10;"

# Check WebSocket connection status
# Browser DevTools -> Network -> WS tab
```

### Messages Out of Order

**Symptoms**: Messages display in wrong sequence

**Solutions**:
- Check database `created_at` timestamps
- Verify frontend sorting logic in MessageList component
- Check for clock skew between servers (if using multiple backends)

### Read Receipts Not Working

**Symptoms**: Message status stuck at "sent" or "delivered"

**Solutions**:

```bash
# Check if read receipt WebSocket events are being sent
docker-compose logs backend | grep "message:read"

# Verify database update
docker-compose exec postgres psql -U chatuser -d chatapp \
  -c "SELECT message_id, user_id, read_at FROM message_reads ORDER BY read_at DESC LIMIT 10;"
```

## File Upload Issues

### Image Upload Fails

**Error**: `413 Payload Too Large` or upload timeout

**Solutions**:

```bash
# Check file size limits in backend
# Update .env:
MAX_FILE_SIZE=10485760  # 10MB

# Check nginx/proxy limits
# nginx.conf:
client_max_body_size 10M;

# Kubernetes Ingress annotation:
nginx.ingress.kubernetes.io/proxy-body-size: "10m"
```

### Images Not Displaying

**Symptoms**: Uploaded images return 404

**Solutions**:
- Check S3/storage configuration
- Verify images were uploaded:
```bash
# Check S3 bucket
aws s3 ls s3://your-bucket/uploads/

# Check backend storage logs
docker-compose logs backend | grep -i upload
```
- Verify image URLs in database
- Check CORS configuration for image domains

## Deployment Issues

### Pod Crash Loop (Kubernetes)

**Symptoms**: Pods continuously restart

**Solutions**:

```bash
# Check pod logs
kubectl logs -l app=backend -n chat-app --previous

# Describe pod for events
kubectl describe pod <pod-name> -n chat-app

# Common causes:
# - Missing environment variables
# - Cannot connect to database
# - Invalid configuration

# Check liveness/readiness probe configuration
kubectl get deployment backend -n chat-app -o yaml | grep -A 10 "Probe"
```

### Ingress Not Working

**Symptoms**: Cannot access application via domain

**Solutions**:

```bash
# Check ingress status
kubectl get ingress -n chat-app
kubectl describe ingress chat-ingress -n chat-app

# Verify DNS is pointing to ingress IP
nslookup your-domain.com

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Test backend service directly (bypass ingress)
kubectl port-forward svc/backend 8080:3000 -n chat-app
curl http://localhost:8080/health
```

### SSL Certificate Issues

**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`

**Solutions**:

```bash
# Check cert-manager logs (if using Let's Encrypt)
kubectl logs -n cert-manager -l app=cert-manager

# Check certificate status
kubectl get certificate -n chat-app
kubectl describe certificate chat-tls -n chat-app

# Verify certificate is valid
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## Getting Help

If you can't resolve the issue:

1. **Check Logs**: Always check application and infrastructure logs first
2. **Enable Debug Logging**: Set `LOG_LEVEL=debug` in environment
3. **GitHub Issues**: Search existing issues or create a new one
4. **Include Details**: When reporting issues, include:
   - Error messages (full stack trace)
   - Relevant logs
   - Steps to reproduce
   - Environment details (OS, versions, etc.)

## Debug Mode

Enable detailed logging:

```bash
# Backend
LOG_LEVEL=debug docker-compose up backend

# Frontend (browser console)
localStorage.setItem('debug', '*');
```

## Health Check Commands

Quick commands to verify system health:

```bash
# All services status
docker-compose ps

# Backend health
curl http://localhost:3000/health

# Database connection
docker-compose exec postgres pg_isready

# Redis connection
docker-compose exec redis redis-cli ping

# Check disk space
df -h

# Check memory
free -h

# Check active connections
netstat -an | grep :3000 | wc -l
```
