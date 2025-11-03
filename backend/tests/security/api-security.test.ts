/**
 * API Security Tests
 * 
 * Tests for general API security including:
 * - Security headers (CORS, CSP, etc.)
 * - CORS policy validation
 * - HTTP methods security
 * - Information disclosure
 * - Error handling
 * - HTTPS enforcement
 */

import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';
import { config } from '../../src/config/env';

describe('API Security Tests', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = await createApp();
    authToken = jwt.sign(
      { userId: 'test-user-123', type: 'access' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should include Strict-Transport-Security header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should not expose server information', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should include Referrer-Policy header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['referrer-policy']).toBeDefined();
    });

    it('should include Permissions-Policy header', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['permissions-policy']).toBeDefined();
    });
  });

  describe('CORS Policy', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should reject unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Origin', 'http://malicious-site.com')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
      }
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/users/profile')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization');

      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should not allow credentials from untrusted origins', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Origin', 'http://evil.com')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.headers['access-control-allow-credentials'] === 'true') {
        expect(response.headers['access-control-allow-origin']).not.toBe('*');
      }
    });
  });

  describe('HTTP Methods Security', () => {
    it('should reject unsupported HTTP methods', async () => {
      const response = await request(app)
        .trace('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 405]).toContain(response.status);
    });

    it('should not allow arbitrary HTTP verbs', async () => {
      const customMethods = ['CONNECT', 'TRACK', 'DEBUG'];

      for (const method of customMethods) {
        try {
          const response = await (request(app) as any)[method.toLowerCase()]?.('/api/health');
          if (response) {
            expect([404, 405, 501]).toContain(response.status);
          }
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it('should return proper Allow header for 405 responses', async () => {
      const response = await request(app)
        .put('/api/health');

      if (response.status === 405) {
        expect(response.headers['allow']).toBeDefined();
      }
    });
  });

  describe('Information Disclosure', () => {
    it('should not expose stack traces in production errors', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent-endpoint-that-causes-error')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.stack).toBeUndefined();
      expect(response.body.stackTrace).toBeUndefined();
    });

    it('should not expose database errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          password: 'short',
          passwordConfirm: 'short',
        });

      expect(response.body.error).not.toContain('SQL');
      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('postgres');
      expect(response.body.message || '').not.toContain('SQL');
    });

    it('should not expose internal paths', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      const body = JSON.stringify(response.body);
      expect(body).not.toContain('/home/');
      expect(body).not.toContain('C:\\');
      expect(body).not.toContain('/src/');
    });

    it('should return generic error messages for authentication failures', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).not.toContain('user not found');
      expect(response.body.error).not.toContain('password incorrect');
    });

    it('should not expose user enumeration via timing', async () => {
      const existingUserStart = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser123',
          password: 'wrongpassword',
        });
      const existingUserTime = Date.now() - existingUserStart;

      const nonExistentUserStart = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser999',
          password: 'wrongpassword',
        });
      const nonExistentUserTime = Date.now() - nonExistentUserStart;

      const timeDifference = Math.abs(existingUserTime - nonExistentUserTime);
      expect(timeDifference).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const endpoints = [
        { method: 'get', url: '/api/users/invalid' },
        { method: 'post', url: '/api/messages' },
        { method: 'get', url: '/api/chats/invalid-id' },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app)[endpoint.method as 'get' | 'post'])(endpoint.url)
          .set('Authorization', `Bearer ${authToken}`);

        if (response.status >= 400) {
          expect(response.body).toHaveProperty('error');
          expect(typeof response.body.error).toBe('string');
        }
      }
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect([400]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should handle missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('username=test&password=test');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const requests = Array(150).fill(null).map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    }, 30000);

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/health');

      expect(
        response.headers['ratelimit-limit'] ||
        response.headers['x-ratelimit-limit']
      ).toBeDefined();
    });

    it('should include Retry-After header on 429', async () => {
      for (let i = 0; i < 150; i++) {
        const response = await request(app).get('/api/health');
        
        if (response.status === 429) {
          expect(
            response.headers['retry-after'] ||
            response.headers['x-ratelimit-reset']
          ).toBeDefined();
          break;
        }
      }
    }, 30000);
  });

  describe('Content-Type Validation', () => {
    it('should reject non-JSON payloads for JSON endpoints', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('username=test&password=test');

      expect([400, 415]).toContain(response.status);
    });

    it('should validate Content-Type for POST requests', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('username=test&password=test');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Request Size Limits', () => {
    it('should reject requests exceeding size limit', async () => {
      const largePayload = {
        username: 'A'.repeat(100000),
        password: 'Password123!',
        passwordConfirm: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload);

      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Path Normalization', () => {
    it('should handle path traversal attempts', async () => {
      const maliciousPaths = [
        '/api/../../../etc/passwd',
        '/api/users/../../admin',
        '/api/./users/../admin',
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .get(path)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 404]).toContain(response.status);
      }
    });

    it('should normalize double slashes', async () => {
      const response = await request(app)
        .get('/api//users//profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Query String Injection', () => {
    it('should handle malicious query parameters', async () => {
      const maliciousQueries = [
        { q: "' OR '1'='1" },
        { q: '<script>alert("XSS")</script>' },
        { q: '../../../etc/passwd' },
        { limit: '-1' },
        { offset: '999999999999999' },
      ];

      for (const query of maliciousQueries) {
        const response = await request(app)
          .get('/api/users/search')
          .query(query)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400, 404]).toContain(response.status);
      }
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookie flags', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        });

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        cookies.forEach((cookie: string) => {
          expect(cookie).toContain('HttpOnly');
          if (config.NODE_ENV === 'production') {
            expect(cookie).toContain('Secure');
          }
        });
      }
    });
  });

  describe('API Versioning', () => {
    it('should handle invalid API versions gracefully', async () => {
      const response = await request(app).get('/api/v999/users');

      expect([404]).toContain(response.status);
    });
  });

  describe('Authentication Bypass Attempts', () => {
    it('should not allow authentication bypass via headers', async () => {
      const bypassHeaders = [
        { 'X-Forwarded-For': 'admin' },
        { 'X-Original-URL': '/admin' },
        { 'X-Rewrite-URL': '/admin' },
        { 'X-Original-User': 'admin' },
      ];

      for (const headers of bypassHeaders) {
        const response = await request(app)
          .get('/api/users/profile')
          .set(headers);

        expect([401]).toContain(response.status);
      }
    });

    it('should not trust X-Forwarded-* headers without validation', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Forwarded-Host', 'evil.com')
        .set('X-Forwarded-Proto', 'http');

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Cache Control', () => {
    it('should set appropriate Cache-Control for sensitive endpoints', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.headers['cache-control']).toBeDefined();
        expect(response.headers['cache-control']).toMatch(/no-store|no-cache|private/);
      }
    });

    it('should not cache authentication responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        });

      expect(response.headers['cache-control']).toMatch(/no-store|no-cache/);
    });
  });

  describe('HTTP Response Splitting', () => {
    it('should prevent response splitting via headers', async () => {
      const maliciousHeaders = [
        'test\r\nX-Injected: header',
        'test%0d%0aX-Injected: header',
      ];

      for (const header of maliciousHeaders) {
        try {
          const response = await request(app)
            .get('/api/health')
            .set('X-Custom', header);

          expect(response.headers['x-injected']).toBeUndefined();
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Clickjacking Protection', () => {
    it('should prevent iframe embedding', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
    });
  });
});
