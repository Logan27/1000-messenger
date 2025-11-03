# Security Testing Quick Start Guide

## 🚀 Quick Start

### Run All Security Tests
```bash
cd backend
npm run test:security
```

### Run Security Tests with Coverage
```bash
npm run test:security:coverage
```

### Run Specific Test Suite
```bash
# Authentication security
npm test -- tests/security/auth-security.test.ts

# Input validation (SQL injection, XSS, etc.)
npm test -- tests/security/input-validation-security.test.ts

# File upload security
npm test -- tests/security/file-upload-security.test.ts

# WebSocket security
npm test -- tests/security/websocket-security.test.ts

# API security (headers, CORS, etc.)
npm test -- tests/security/api-security.test.ts
```

## 📊 What Gets Tested

### 🔐 Authentication (19 tests)
- JWT token manipulation & tampering
- Token expiration & validation
- Algorithm confusion attacks
- Session security
- Timing attacks

### 💉 Input Validation (22 tests)
- SQL Injection (10+ payloads)
- XSS/Cross-Site Scripting (12+ payloads)
- NoSQL Injection
- Command Injection
- Path Traversal
- Prototype Pollution

### 📁 File Uploads (23 tests)
- Malicious file type detection
- File size limits (10MB)
- MIME type validation
- Path traversal in filenames
- Double extension attacks
- Polyglot files

### 🔌 WebSocket (21 tests)
- WebSocket authentication
- Message validation
- Room authorization
- Rate limiting
- Cross-user isolation

### 🌐 API Security (39 tests)
- Security headers (CSP, HSTS, etc.)
- CORS policy
- Rate limiting
- Information disclosure
- Error handling

## 🎯 Total: 124 Security Tests

## 📋 Pre-Commit Checklist

Before committing code that touches security-critical areas:

```bash
# 1. Run security tests
npm run test:security

# 2. Check for vulnerabilities
npm audit

# 3. Run all tests
npm test

# 4. Type check
npm run type-check

# 5. Lint
npm run lint
```

## 🔍 Common Issues

### Tests Failing?

**Database Connection Error**
```bash
# Make sure PostgreSQL is running
docker-compose up -d postgres
```

**Redis Connection Error**
```bash
# Make sure Redis is running
docker-compose up -d redis
```

**Module Not Found**
```bash
# Reinstall dependencies
cd backend
npm install
```

## 📚 Documentation

- **Detailed Guide**: `backend/tests/security/README.md`
- **Full Report**: `SECURITY_TESTING_REPORT.md`
- **Checklist**: `SECURITY_CHECKLIST.md`
- **Implementation**: `SECURITY_TESTING_IMPLEMENTATION.md`

## 🛠️ Development Workflow

### Adding New Features

When adding new features, add security tests for:

1. **Authentication endpoints**
   ```typescript
   it('should reject invalid tokens', async () => {
     const response = await request(app)
       .get('/api/new-endpoint')
       .set('Authorization', 'Bearer invalid-token');
     expect(response.status).toBe(401);
   });
   ```

2. **Input validation**
   ```typescript
   it('should prevent SQL injection', async () => {
     const response = await request(app)
       .post('/api/new-endpoint')
       .send({ field: "' OR '1'='1" });
     expect([400, 401]).toContain(response.status);
   });
   ```

3. **File uploads**
   ```typescript
   it('should reject malicious files', async () => {
     const response = await request(app)
       .post('/api/upload')
       .attach('file', Buffer.from('malicious'), 'hack.exe');
     expect([400, 415]).toContain(response.status);
   });
   ```

## 🔄 CI/CD Integration

Security tests run automatically:
- ✅ On every push to main/develop
- ✅ On every pull request
- ✅ Daily at 2 AM UTC (scheduled)

Check `.github/workflows/security-tests.yml`

## 🎓 Learning Resources

### OWASP Top 10 (2021)
1. Broken Access Control ✅ Tested
2. Cryptographic Failures ✅ Tested
3. Injection ✅ Tested
4. Insecure Design ✅ Tested
5. Security Misconfiguration ✅ Tested
6. Vulnerable Components ⚠️ npm audit
7. Authentication Failures ✅ Tested
8. Software Integrity Failures ✅ Tested
9. Logging Failures ⚠️ Manual review
10. SSRF ✅ Tested

### Attack Vectors Covered
- ✅ SQL Injection
- ✅ XSS (Cross-Site Scripting)
- ✅ CSRF (Cross-Site Request Forgery)
- ✅ JWT attacks
- ✅ File upload exploits
- ✅ Command injection
- ✅ Path traversal
- ✅ NoSQL injection
- ✅ Prototype pollution
- ✅ Rate limit bypass
- ✅ Session hijacking

## 🚨 Security Issues?

### Found a vulnerability?
1. **DO NOT** open a public issue
2. Email: security@example.com
3. Include reproduction steps
4. Allow time for fix before disclosure

### Tests revealing actual bugs?
1. Document the issue
2. Create a security patch
3. Add regression test
4. Update SECURITY_TESTING_REPORT.md

## 💡 Tips

### Watch Mode for Development
```bash
npm run test:security:watch
```

### Run Single Test
```bash
npm test -- tests/security/auth-security.test.ts -t "should reject tampered JWT tokens"
```

### Debug Tests
```bash
node --inspect-brk node_modules/.bin/jest tests/security/auth-security.test.ts --runInBand
```

### Generate Coverage Report
```bash
npm run test:security:coverage
open coverage/lcov-report/index.html
```

## 📈 Metrics

Current security test coverage:
- **124 test cases**
- **5 test suites**
- **50+ attack vectors**
- **80%+ OWASP coverage**

## ✅ Definition of Done

For security-critical features, ensure:
- [ ] Security tests added
- [ ] All tests passing
- [ ] No new vulnerabilities (npm audit)
- [ ] Code reviewed for security
- [ ] Documentation updated
- [ ] Deployed to staging first

## 🔗 Quick Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [JWT Security](https://tools.ietf.org/html/rfc8725)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

---

**Need help?** Check the full documentation or contact the security team.

**Last Updated**: 2025-01-XX
