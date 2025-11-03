# Security Testing Suite

This directory contains comprehensive security tests for the messenger application. The tests are designed to identify vulnerabilities and ensure the application follows security best practices.

## Test Categories

### 1. Authentication Security (`auth-security.test.ts`)

Tests authentication mechanisms and JWT token handling:

- **JWT Token Manipulation**
  - Token tampering detection
  - Signature verification
  - Payload modification attempts
  - Malformed token handling

- **Token Expiration**
  - Expired token rejection
  - Future token detection
  - Token lifetime validation

- **Authorization**
  - Missing authorization header
  - Malformed authorization format
  - Empty token handling

- **Token Type Confusion**
  - Refresh token vs access token
  - Token type validation
  - Missing type claim

- **Privilege Escalation**
  - Cross-user resource access
  - Permission boundary enforcement

- **Algorithm Confusion Attacks**
  - "none" algorithm rejection
  - Algorithm mismatch detection

- **Session Security**
  - Session expiration enforcement
  - Session fixation prevention
  - Token reuse detection

- **Timing Attacks**
  - Consistent response times
  - Information leak prevention

### 2. Input Validation Security (`input-validation-security.test.ts`)

Tests protection against various injection attacks:

- **SQL Injection**
  - Login field injection
  - Search query injection
  - Parameter injection
  - Union-based attacks

- **XSS (Cross-Site Scripting)**
  - Script tag injection
  - Event handler injection
  - JavaScript protocol injection
  - HTML content sanitization

- **NoSQL Injection**
  - MongoDB operator injection
  - Query manipulation attempts

- **Command Injection**
  - Shell command execution prevention
  - System command sanitization

- **Path Traversal**
  - Directory traversal attempts
  - File system access prevention

- **Large Payload Attacks**
  - JSON size limits
  - Nested object depth limits

- **Special Character Handling**
  - Null byte injection
  - Control character handling
  - Unicode attacks

- **LDAP Injection**
  - Filter injection prevention
  - Special character escaping

- **Prototype Pollution**
  - __proto__ manipulation
  - Constructor pollution

- **HTTP Parameter Pollution**
  - Duplicate parameter handling
  - Conflicting parameters

### 3. File Upload Security (`file-upload-security.test.ts`)

Tests file upload security measures:

- **File Type Validation**
  - Executable file rejection
  - Script file blocking
  - Allowed format enforcement

- **File Size Limits**
  - Maximum size enforcement
  - Size limit validation

- **MIME Type Validation**
  - MIME type verification
  - Extension-MIME consistency
  - Magic byte detection

- **Filename Security**
  - Path traversal prevention
  - Special character handling
  - Double extension attacks
  - Long filename handling

- **Content Validation**
  - Embedded code detection
  - Polyglot file prevention
  - EXIF data stripping

- **Rate Limiting**
  - Upload frequency limits
  - Concurrent upload limits

### 4. WebSocket Security (`websocket-security.test.ts`)

Tests real-time communication security:

- **Authentication**
  - Token validation
  - Expired token rejection
  - Token type verification

- **Message Validation**
  - XSS payload filtering
  - Message format validation
  - Size limits

- **Room Authorization**
  - Unauthorized access prevention
  - Room ID validation
  - SQL injection in room IDs

- **Rate Limiting**
  - Message rate limits
  - Connection limits
  - Event frequency limits

- **Event Injection**
  - Internal event protection
  - Event name validation

- **Cross-User Security**
  - Message isolation
  - Impersonation prevention

### 5. API Security (`api-security.test.ts`)

Tests general API security features:

- **Security Headers**
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Strict-Transport-Security
  - Content-Security-Policy
  - Referrer-Policy

- **CORS Policy**
  - Origin validation
  - Preflight handling
  - Credential handling

- **HTTP Methods**
  - Unsupported method rejection
  - Proper Allow header
  - Method validation

- **Information Disclosure**
  - Stack trace hiding
  - Database error sanitization
  - Internal path hiding
  - Generic error messages

- **Rate Limiting**
  - 429 status handling
  - Rate limit headers
  - Retry-After header

- **Content-Type Validation**
  - JSON enforcement
  - Content-Type verification

## Running Security Tests

### Run All Security Tests
```bash
npm test -- tests/security
```

### Run Specific Test Suite
```bash
npm test -- tests/security/auth-security.test.ts
npm test -- tests/security/input-validation-security.test.ts
npm test -- tests/security/file-upload-security.test.ts
npm test -- tests/security/websocket-security.test.ts
npm test -- tests/security/api-security.test.ts
```

### Run with Coverage
```bash
npm test -- tests/security --coverage
```

### Run in Watch Mode
```bash
npm test -- tests/security --watch
```

## Security Testing Best Practices

1. **Regular Testing**: Run security tests before every deployment
2. **CI/CD Integration**: Include security tests in your CI pipeline
3. **Coverage Goals**: Aim for high coverage of security-critical code paths
4. **Keep Updated**: Regularly update test cases with new attack vectors
5. **Real-World Scenarios**: Base tests on actual security incidents and CVEs

## Common Vulnerabilities Tested

- **OWASP Top 10**
  - Injection (SQL, NoSQL, Command)
  - Broken Authentication
  - Sensitive Data Exposure
  - XML External Entities (XXE)
  - Broken Access Control
  - Security Misconfiguration
  - Cross-Site Scripting (XSS)
  - Insecure Deserialization
  - Using Components with Known Vulnerabilities
  - Insufficient Logging & Monitoring

- **Additional Security Issues**
  - JWT vulnerabilities
  - File upload vulnerabilities
  - WebSocket security
  - Rate limiting bypass
  - CORS misconfiguration
  - Clickjacking
  - CSRF attacks

## Test Environment

Tests are designed to run against a test instance of the application with:
- Isolated database
- Redis instance for rate limiting
- Mock S3/MinIO for file storage
- Separate configuration from production

## Interpreting Test Results

### Expected Behavior

Most security tests expect **rejection** of malicious inputs:
- Status codes: 400, 401, 403, 404, 415, 429
- Error messages without sensitive information
- Consistent response times

### Security Failures

Tests fail when:
- Malicious input is accepted
- Sensitive information is disclosed
- Authentication/authorization is bypassed
- Injection attacks succeed
- Rate limits are ineffective

## Extending Security Tests

When adding new features:

1. Identify security-critical endpoints
2. Consider OWASP Top 10 vulnerabilities
3. Add test cases for:
   - Input validation
   - Authentication/authorization
   - Rate limiting
   - Output encoding
4. Document new test cases

## Security Scanning Tools

In addition to these tests, consider using:

- **Static Analysis**: ESLint security plugins
- **Dependency Scanning**: npm audit, Snyk
- **DAST Tools**: OWASP ZAP, Burp Suite
- **Container Scanning**: Trivy, Clair
- **Secret Detection**: git-secrets, truffleHog

## Reporting Security Issues

If tests reveal actual vulnerabilities:

1. Document the vulnerability
2. Assess severity (CVSS score)
3. Create a security patch
4. Update tests to prevent regression
5. Follow responsible disclosure practices

## References

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## License

These security tests are part of the messenger application and follow the same license.
