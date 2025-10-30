# Frontend Docker Configuration

## Overview

The frontend is containerized using a multi-stage Docker build with nginx for production deployment. This setup provides a production-ready, secure, and performant solution for serving the React SPA.

## Architecture

### Multi-Stage Build

The Dockerfile uses a two-stage build process:

1. **Builder Stage**: Compiles the TypeScript/React application using Node.js and Vite
2. **Production Stage**: Serves the built static files using nginx

This approach results in:
- Smaller final image size (only contains nginx and built assets)
- Improved security (no build tools or source code in production image)
- Better performance (optimized nginx configuration)

## Features

### Runtime Configuration

Unlike traditional SPA builds where environment variables are baked in at build time, this setup supports **runtime configuration injection**:

- Environment variables are injected when the container starts
- Same Docker image can be used across all environments (dev, staging, prod)
- Follows the "build once, deploy anywhere" principle

The `docker-entrypoint.sh` script generates a `/config.js` file at container startup with the current environment variables.

### Security

- **Non-root user**: nginx runs as a non-root user for improved security
- **Security headers**: Multiple security headers configured (X-Frame-Options, CSP, etc.)
- **Minimal base image**: Uses Alpine Linux for smaller attack surface

### Health Checks

- Built-in Docker HEALTHCHECK instruction
- `/health` endpoint for load balancers and orchestrators
- Configurable intervals and timeouts

### Performance Optimizations

- **Gzip compression**: Automatic compression for text-based assets
- **Aggressive caching**: Static assets cached for 1 year with immutable flag
- **No caching for index.html**: Ensures users get latest version
- **Access log disabled for static assets**: Reduces I/O overhead

## Files

### Dockerfile

Multi-stage Dockerfile with:
- Node.js 20 Alpine for building
- nginx Alpine for serving
- Health checks
- Security best practices

### nginx.conf

Production nginx configuration with:
- SPA routing (try_files fallback)
- Gzip compression
- Cache headers
- Security headers
- Health check endpoint
- Error pages

### docker-entrypoint.sh

Shell script that:
- Generates runtime configuration file
- Injects environment variables
- Executes nginx

### .dockerignore

Optimizes build context by excluding:
- node_modules
- Development files
- Documentation
- Git files

## Usage

### Building the Image

```bash
docker build -t chat-frontend:latest .
```

### Running the Container

#### With Default Configuration

```bash
docker run -d -p 80:80 chat-frontend:latest
```

#### With Custom Configuration

```bash
docker run -d \
  -p 80:80 \
  -e VITE_API_URL=https://api.example.com/api \
  -e VITE_WS_URL=wss://api.example.com \
  -e APP_NAME="My Chat App" \
  -e VERSION="1.0.0" \
  --name chat-frontend \
  chat-frontend:latest
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend REST API URL | `http://localhost:3000/api` |
| `VITE_WS_URL` | WebSocket server URL | `http://localhost:3000` |
| `APP_NAME` | Application name | `Chat App` |
| `VERSION` | Application version | `1.0.0` |

### Health Check

Check container health:

```bash
curl http://localhost:80/health
```

Expected response: `healthy`

### Viewing Logs

```bash
docker logs chat-frontend
```

## Docker Compose Integration

The frontend integrates seamlessly with docker-compose.yml:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  ports:
    - "80:80"
  environment:
    - VITE_API_URL=http://backend:3000/api
    - VITE_WS_URL=http://backend:3000
  depends_on:
    - backend
```

## Kubernetes Deployment

The Docker image is designed to work with Kubernetes:

- Health checks for liveness and readiness probes
- Non-root user for pod security policies
- Runtime configuration via ConfigMaps/Secrets
- Horizontal scaling ready

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-frontend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: frontend
        image: chat-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_URL
          valueFrom:
            configMapKeyRef:
              name: frontend-config
              key: api-url
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Best Practices

### Image Tagging

Always tag your images with meaningful versions:

```bash
docker build -t chat-frontend:1.0.0 .
docker build -t chat-frontend:latest .
```

### Multi-Environment Deployment

Use the same image across environments:

```bash
# Development
docker run -e VITE_API_URL=http://dev-api.example.com/api chat-frontend:1.0.0

# Staging
docker run -e VITE_API_URL=http://staging-api.example.com/api chat-frontend:1.0.0

# Production
docker run -e VITE_API_URL=https://api.example.com/api chat-frontend:1.0.0
```

### Image Scanning

Scan images for vulnerabilities:

```bash
docker scan chat-frontend:latest
```

### Resource Limits

Set resource limits in production:

```bash
docker run -d \
  --memory="256m" \
  --cpus="0.5" \
  chat-frontend:latest
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker logs chat-frontend
```

### Health Check Failing

Test nginx directly:
```bash
docker exec chat-frontend wget -O- http://localhost/health
```

### Configuration Not Applied

Verify environment variables:
```bash
docker exec chat-frontend cat /usr/share/nginx/html/config.js
```

### Permission Issues

The container runs as non-root user `nginx`. If you encounter permission issues:

1. Check volume mount permissions
2. Ensure mounted directories are readable by UID 101 (nginx user)

## Development vs Production

### Development

For local development, use the Vite dev server:

```bash
npm run dev
```

### Production

For production, use the Docker container which provides:
- Production-optimized builds
- Proper caching headers
- Security headers
- Health checks
- Runtime configuration

## Performance Metrics

Expected performance characteristics:

- **Image size**: ~25-30 MB (compressed)
- **Container startup time**: < 2 seconds
- **Response time** (static files): < 10ms
- **Throughput**: 1000+ req/s per container
- **Memory usage**: ~10-20 MB

## Security Considerations

1. **Non-root user**: Container runs as nginx (UID 101)
2. **Read-only filesystem**: Consider using `--read-only` flag
3. **Security headers**: X-Frame-Options, CSP, XSS-Protection configured
4. **No sensitive data**: No secrets or credentials in image
5. **Regular updates**: Keep base images updated

## Maintenance

### Updating Dependencies

1. Update package.json
2. Rebuild the image
3. Test thoroughly
4. Deploy new version

### Updating nginx Configuration

1. Modify nginx.conf
2. Rebuild the image
3. Test configuration: `docker run --rm chat-frontend nginx -t`
4. Deploy new version

### Monitoring

Monitor these metrics in production:

- Container health status
- HTTP response times
- Error rates (4xx, 5xx)
- Resource usage (CPU, memory)
- nginx access/error logs
