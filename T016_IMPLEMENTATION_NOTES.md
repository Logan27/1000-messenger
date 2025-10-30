# T016 Implementation Notes: Frontend nginx.conf for Production Serving

## Overview

Task T016 from the messenger app specification required enhancing the frontend nginx.conf file for production serving. The file already existed with basic production features, but has been significantly enhanced with additional production-ready capabilities.

## Changes Made

### 1. Rate Limiting (DDoS Protection)

Added two rate limiting zones at the http level:
- `general`: 10 requests/second - applied to most endpoints
- `strict`: 1 request/second - applied to health checks and sensitive endpoints

Each location has appropriate burst allowances:
- Health check: burst=5 (strict rate limit)
- Static assets: burst=20 (higher to handle parallel asset loading)
- Index.html: burst=10
- Other endpoints: burst=5-10

### 2. Client and Connection Settings

Enhanced settings for handling the messenger application's needs:

```nginx
client_max_body_size 12M;           # Supports 10MB image uploads + overhead
client_body_buffer_size 128k;       # Efficient buffer for uploads
client_body_timeout 30s;            # Reasonable timeout for uploads
client_header_timeout 30s;          # Header processing timeout
keepalive_timeout 65;               # Keep connections alive
keepalive_requests 100;             # Multiple requests per connection
send_timeout 30s;                   # Response send timeout
large_client_header_buffers 4 16k;  # Handle larger headers
```

### 3. Enhanced Gzip Compression

Extended gzip compression to include more MIME types:
- Added font types: `application/vnd.ms-fontobject`, `application/x-font-ttf`, `font/opentype`
- Added SVG images: `image/svg+xml`
- Configured gzip buffers: `16 8k`
- Disabled for IE6: `gzip_disable "msie6"`

### 4. Comprehensive Security Headers

Enhanced security headers configuration:

**Existing headers (maintained):**
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**New additions:**
- **Content-Security-Policy (CSP)**: Comprehensive policy that:
  - Restricts script sources to self, inline, and eval (required for React/Vite)
  - Allows images from self, data URIs, blobs, and HTTPS sources
  - Permits WebSocket connections (ws://, wss://) for real-time features
  - Restricts frame ancestors to prevent clickjacking
  
- **HSTS (commented)**: Ready to enable for HTTPS deployments:
  ```nginx
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  ```

### 5. Special File Handling

Added specific handling for common web assets:

**Manifest and Service Worker Files:**
```nginx
location ~* \.(webmanifest|json)$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
}
```

**Robots and Sitemap:**
```nginx
location ~* ^/(robots\.txt|sitemap\.xml)$ {
    access_log off;
    try_files $uri =404;
}
```

**Favicon with Graceful Degradation:**
```nginx
location = /favicon.ico {
    access_log off;
    log_not_found off;
    expires 7d;
    try_files $uri =204;  # Return 204 No Content if missing
}
```

### 6. Security Enhancements

**Block Hidden Files:**
```nginx
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}
```

**Block Backup and Source Files:**
```nginx
location ~* (?:\.(?:bak|conf|dist|fla|in[ci]|log|orig|psd|sh|sql|sw[op])|~)$ {
    deny all;
}
```

### 7. Improved Static Asset Handling

Enhanced the static asset location block:
- Added modern formats: `webp`, `avif`, `map`
- Proper 404 handling: `try_files $uri =404` instead of redirecting to index.html
- Commented CORS configuration for fonts (can be enabled if needed)
- Rate limiting with higher burst for parallel asset loading

### 8. Better Error Handling

Improved error page configuration:
```nginx
error_page 404 /index.html;           # SPA routing for 404s
error_page 500 502 503 504 /50x.html; # Server errors
location = /50x.html {
    root /usr/share/nginx/html;
    internal;                          # Prevent direct access
}
```

### 9. Improved Logging

Changed to use nginx's built-in `combined` format which includes:
- Remote address
- User
- Timestamp
- Request
- Status
- Body bytes sent
- Referer
- User agent

Note: Custom log formats cannot be defined in server blocks (must be in http context), so we use the well-tested `combined` format.

## File Structure

The nginx.conf file is organized in a logical order:

1. **Rate limiting zones** (http context level)
2. **Server block with basic settings**
3. **Client and connection settings**
4. **Logging configuration**
5. **Gzip compression**
6. **Security headers** (applied globally)
7. **Location blocks** (specific to general):
   - Health check endpoint
   - Runtime config endpoint
   - Index.html (no caching)
   - Static assets (aggressive caching)
   - Special files (manifests, robots, favicon)
   - SPA routing (catch-all)
   - Error pages
   - Security blocks (hidden/backup files)

## Testing

The configuration was validated using:
```bash
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t
```

Result: ✅ Configuration test successful

## Production Readiness Features

The enhanced nginx.conf now includes:

✅ **DDoS Protection**: Rate limiting on all endpoints  
✅ **Upload Support**: 12M max body size for image uploads  
✅ **Performance**: Optimized gzip, caching, and connection settings  
✅ **Security**: CSP, multiple security headers, file access restrictions  
✅ **Monitoring**: Proper logging with standard format  
✅ **Reliability**: Appropriate timeouts and buffer sizes  
✅ **Best Practices**: Follows nginx production recommendations  
✅ **SPA Support**: Proper routing for single-page applications  
✅ **Health Checks**: Dedicated endpoint for load balancers  
✅ **Runtime Config**: Support for environment-specific configuration  

## Integration

This nginx.conf integrates with:

1. **Dockerfile**: Copied to `/etc/nginx/conf.d/default.conf` during build
2. **docker-entrypoint.sh**: Generates runtime config at `/usr/share/nginx/html/config.js`
3. **Docker Compose**: Works with both dev and prod compose files
4. **Kubernetes**: Health check endpoint compatible with liveness/readiness probes
5. **Load Balancers**: Health endpoint, proper timeouts, rate limiting

## Customization Notes

For production deployments, consider:

1. **HSTS**: Uncomment the HSTS header when using HTTPS
2. **CSP**: Adjust the Content-Security-Policy based on specific requirements
3. **CORS**: Uncomment CORS headers for static assets if serving from different domains
4. **Rate Limits**: Adjust rates and burst values based on expected traffic patterns
5. **Timeouts**: Tune timeouts based on network conditions and user behavior

## Documentation Updates

Updated `frontend/DOCKER.md` to reflect the enhanced features:
- Added rate limiting information
- Added CSP and security enhancements
- Added client settings and upload support
- Added special file handling details
- Added protection mechanisms

## Compliance

This implementation fulfills task T016 requirements:
- ✅ Production-ready nginx configuration
- ✅ Supports messenger app requirements (uploads, WebSockets, real-time)
- ✅ Security hardened
- ✅ Performance optimized
- ✅ Follows infrastructure conventions (Docker, K8s compatibility)
- ✅ Properly documented

## Performance Characteristics

Expected metrics with this configuration:
- **Throughput**: 1000+ req/s per container
- **Latency**: <10ms for static files
- **Memory**: ~10-20 MB per container
- **Rate Limits**: 10 req/s general, 1 req/s health checks
- **Max Upload**: 12MB (supports 10MB images + overhead)
- **Compression**: ~70-80% reduction for text assets

## References

- Nginx official documentation: https://nginx.org/en/docs/
- Nginx security best practices
- Content Security Policy Level 3 specification
- Docker best practices for nginx containers
- Real-time web application serving patterns
