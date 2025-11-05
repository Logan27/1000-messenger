# 1000-Messenger Troubleshooting Guide

Common issues and their solutions for the 1000-Messenger application.

## Table of Contents

- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Database Issues](#database-issues)
- [Redis Issues](#redis-issues)
- [WebSocket Issues](#websocket-issues)
- [Storage Issues](#storage-issues)
- [Performance Issues](#performance-issues)
- [Authentication Issues](#authentication-issues)

---

## Backend Issues

### Issue: Backend won't start

**Symptoms:**
- Error: `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

---

### Issue: Database connection errors

**Symptoms:**
- Error: `Connection terminated unexpectedly`
- Error: `ECONNREFUSED`

**Solution:**
1. Check database is running:
```bash
docker-compose ps postgres
# or
sudo systemctl status postgresql
```

2. Verify connection string in `.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/messenger"
```

3. Test connection:
```bash
psql -U messenger_user -h localhost messenger
```

4. Check firewall rules:
```bash
sudo ufw status
sudo ufw allow 5432/tcp
```

---

### Issue: JWT token errors

**Symptoms:**
- Error: `jwt malformed`
- Error: `jwt expired`

**Solution:**
1. Verify JWT secrets are set:
```bash
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET
```

2. Clear browser storage and login again

3. Check token expiry settings in `.env`:
```
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Frontend Issues

### Issue: Can't connect to backend API

**Symptoms:**
- Error: `Network Error`
- Error: `Failed to fetch`

**Solution:**
1. Check `VITE_API_URL` in `.env`:
```bash
VITE_API_URL=http://localhost:3000
```

2. Verify backend is running:
```bash
curl http://localhost:3000/api/health
```

3. Check CORS settings in backend

4. Inspect browser console for detailed errors

---

### Issue: White screen / blank page

**Symptoms:**
- App displays nothing
- Console shows JS errors

**Solution:**
1. Clear browser cache:
```bash
# Chrome DevTools -> Application -> Clear Storage
```

2. Rebuild frontend:
```bash
cd frontend
rm -rf node_modules dist .vite
npm install
npm run build
```

3. Check console for errors

4. Verify all environment variables are set

---

### Issue: Images not displaying

**Symptoms:**
- Broken image icons
- Error 403/404 on image URLs

**Solution:**
1. Check object storage is running:
```bash
docker-compose ps minio
```

2. Verify storage configuration in backend `.env`

3. Check MinIO console (http://localhost:9001)

4. Verify bucket exists and has correct permissions:
```bash
mc ls local/messenger-files
mc policy get local/messenger-files
```

---

## Database Issues

### Issue: Slow queries

**Symptoms:**
- API responses taking > 1 second
- Database CPU at 100%

**Solution:**
1. Check slow query log:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

2. Add missing indexes:
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

3. Run ANALYZE:
```sql
ANALYZE users;
ANALYZE messages;
ANALYZE chats;
```

4. Vacuum tables:
```sql
VACUUM ANALYZE messages;
```

---

### Issue: Database disk full

**Symptoms:**
- Error: `No space left on device`
- Writes failing

**Solution:**
1. Check disk usage:
```bash
df -h
du -sh /var/lib/postgresql/data
```

2. Clean up old backups:
```bash
find /backups -name "*.sql.gz" -mtime +30 -delete
```

3. Vacuum full (requires downtime):
```sql
VACUUM FULL messages;
```

4. Enable auto-vacuum in postgresql.conf:
```
autovacuum = on
```

---

### Issue: Connection pool exhausted

**Symptoms:**
- Error: `remaining connection slots are reserved`
- API returns 500 errors

**Solution:**
1. Check current connections:
```sql
SELECT COUNT(*) FROM pg_stat_activity;
```

2. Increase max_connections:
```sql
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

3. Adjust pool size in backend:
```
DATABASE_POOL_MAX=20
```

4. Kill idle connections:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < now() - interval '10 minutes';
```

---

## Redis Issues

### Issue: Redis connection refused

**Symptoms:**
- Error: `ECONNREFUSED`
- Sessions not persisting

**Solution:**
1. Check Redis is running:
```bash
docker-compose ps redis
# or
sudo systemctl status redis-server
```

2. Test connection:
```bash
redis-cli -h localhost -p 6379 -a password ping
```

3. Check Redis logs:
```bash
docker-compose logs redis
# or
tail -f /var/log/redis/redis-server.log
```

---

### Issue: Redis out of memory

**Symptoms:**
- Error: `OOM command not allowed`
- Cache misses increase

**Solution:**
1. Check memory usage:
```bash
redis-cli INFO memory
```

2. Increase maxmemory:
```
# redis.conf
maxmemory 4gb
```

3. Clear cache if needed:
```bash
redis-cli FLUSHDB  # Clear current DB
redis-cli FLUSHALL # Clear all DBs (use carefully!)
```

4. Check eviction policy:
```
maxmemory-policy allkeys-lru
```

---

## WebSocket Issues

### Issue: WebSocket connection failing

**Symptoms:**
- Messages not arriving in real-time
- Error: `WebSocket connection failed`

**Solution:**
1. Check WebSocket endpoint:
```javascript
// Browser console
new WebSocket('ws://localhost:3000/socket.io/?transport=websocket')
```

2. Verify nginx/proxy config allows WebSocket:
```nginx
location /socket.io/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

3. Check firewall allows WebSocket

4. Test with different transport:
```javascript
// Frontend
socket = io(url, { transports: ['polling', 'websocket'] });
```

---

### Issue: Messages delayed or not received

**Symptoms:**
- 5-10 second delay on messages
- Some messages never arrive

**Solution:**
1. Check WebSocket connection status:
```javascript
console.log(socket.connected); // Should be true
```

2. Check Redis pub/sub:
```bash
redis-cli
PUBSUB CHANNELS
```

3. Verify user is in correct room:
```javascript
// Backend logs should show:
// User joined room: user:<userId>
// User joined room: chat:<chatId>
```

4. Check network latency:
```bash
ping api.your-domain.com
```

---

## Storage Issues

### Issue: File upload fails

**Symptoms:**
- Error: `File too large`
- Error: `Upload failed`

**Solution:**
1. Check file size limit (10MB by default)

2. Verify MinIO/S3 is accessible:
```bash
curl http://localhost:9000/minio/health/live
```

3. Check bucket permissions:
```bash
mc policy get local/messenger-files
```

4. Verify storage credentials in `.env`

5. Check disk space on storage server:
```bash
df -h
```

---

### Issue: Images not loading from storage

**Symptoms:**
- 403 Forbidden errors
- CORS errors

**Solution:**
1. Set bucket policy to public read:
```bash
mc policy set download local/messenger-files
```

2. Configure CORS for MinIO:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"]
  }]
}
```

3. Check signed URL expiry

4. Verify CDN/proxy configuration

---

## Performance Issues

### Issue: High CPU usage

**Symptoms:**
- CPU constantly at 80-100%
- Server becomes unresponsive

**Solution:**
1. Identify CPU-intensive processes:
```bash
top
htop
docker stats
```

2. Check for infinite loops in code

3. Review database query performance

4. Enable caching:
```bash
# Check Redis hit rate
redis-cli INFO stats | grep hit_rate
```

5. Scale horizontally:
```bash
docker-compose scale backend=3
```

---

### Issue: High memory usage

**Symptoms:**
- Memory at 90%+
- OOM killer terminating processes

**Solution:**
1. Check memory usage:
```bash
free -m
docker stats
```

2. Check for memory leaks:
```bash
# Node.js
node --inspect
# Then use Chrome DevTools Memory Profiler
```

3. Increase memory limits:
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

4. Restart services periodically:
```bash
# Cron job to restart nightly
0 3 * * * docker-compose restart backend
```

---

### Issue: Slow API responses

**Symptoms:**
- Requests taking > 1 second
- Timeouts

**Solution:**
1. Check response times:
```bash
curl -o /dev/null -s -w 'Time: %{time_total}s\n' http://localhost:3000/api/health
```

2. Enable query logging:
```javascript
// Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  log      = ["query"]
}
```

3. Add database indexes (see migration 002_performance_indexes.sql)

4. Implement caching:
```javascript
// Cache user lookups
const cachedUser = await getCachedUser(userId);
```

5. Use connection pooling

---

## Authentication Issues

### Issue: Can't login after password change

**Solution:**
1. Clear all sessions:
```sql
DELETE FROM sessions WHERE user_id = '<user_id>';
```

2. Clear Redis sessions:
```bash
redis-cli KEYS "session:*" | xargs redis-cli DEL
```

3. Logout from all devices and login again

---

### Issue: Rate limit blocking legitimate users

**Symptoms:**
- Error: `Too many requests`
- Users can't login

**Solution:**
1. Check rate limit configuration:
```
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

2. Clear rate limit for specific IP:
```bash
redis-cli DEL "rate:limit:192.168.1.1"
```

3. Whitelist trusted IPs:
```javascript
// middleware
if (trustedIPs.includes(req.ip)) {
  return next();
}
```

4. Adjust limits for production:
```
RATE_LIMIT_MAX=500
```

---

## Diagnostic Commands

### Quick Health Check

```bash
# All-in-one health check script
#!/bin/bash

echo "=== Backend Health ==="
curl -s http://localhost:3000/api/health | jq

echo "=== Database ==="
psql -U messenger_user -h localhost messenger -c "SELECT version();"

echo "=== Redis ==="
redis-cli -a password ping

echo "=== MinIO ==="
curl -s http://localhost:9000/minio/health/live

echo "=== Docker Status ==="
docker-compose ps
```

### Log Collection

```bash
# Collect all logs for support
mkdir -p /tmp/messenger-logs
docker-compose logs > /tmp/messenger-logs/docker.log
journalctl -u postgresql > /tmp/messenger-logs/postgres.log
journalctl -u redis > /tmp/messenger-logs/redis.log
tar -czf messenger-logs-$(date +%Y%m%d).tar.gz /tmp/messenger-logs
```

---

## Getting Help

If you can't resolve an issue:

1. Check GitHub Issues: https://github.com/your-org/1000-messenger/issues
2. Review logs with `-v` or `--debug` flag
3. Enable debug logging:
```
LOG_LEVEL=debug
```
4. Create a minimal reproduction case
5. Include:
   - OS and version
   - Docker/Node.js versions
   - Relevant logs
   - Steps to reproduce

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
