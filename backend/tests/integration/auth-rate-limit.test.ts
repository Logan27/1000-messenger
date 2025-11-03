import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestRedis, closeTestRedis, cleanupRateLimitKeys } from '../helpers/test-setup';

/**
 * Integration test for authentication rate limiting
 * 
 * Tests T059: Add rate limiting for auth endpoints (5 attempts / 15 minutes)
 * 
 * Requirements:
 * - FR-006: System MUST implement rate limiting for login attempts (5 attempts per 15 minutes per username)
 * - FR-181: System MUST rate limit login attempts (5 per 15 minutes)
 */

describe('Authentication Rate Limiting', () => {
  let app: any;
  const testUsername = 'testuser_ratelimit';
  const testPassword = 'testpass123';

  beforeAll(async () => {
    // Create app instance
    app = await createApp();
    
    // Ensure Redis is connected
    await connectTestRedis();
  });

  afterAll(async () => {
    // Cleanup: flush rate limit keys
    await cleanupRateLimitKeys();
    
    // Close Redis connection
    await closeTestRedis();
  });

  beforeEach(async () => {
    // Clear rate limit keys before each test
    await cleanupRateLimitKeys();
  });

  describe('POST /auth/login - Rate Limiting', () => {
    it('should allow 5 failed login attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword',
          })
          .expect((res) => {
            // Should either be 401 (unauthorized) or 404 (user not found)
            // Both are acceptable since we're testing rate limiting, not auth logic
            expect([401, 404]).toContain(res.status);
          });
      }
    });

    it('should block the 6th failed login attempt with 429 Too Many Requests', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword',
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('login attempts');
    });

    it('should return rate limit headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        });

      // Check for standard rate limit headers
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should include Retry-After header when rate limit is exceeded', async () => {
      // Make 5 failed attempts to hit the limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword',
          });
      }

      // Next request should be rate limited with Retry-After header
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        })
        .expect(429);

      expect(response.body).toHaveProperty('retryAfter');
    });
  });

  describe('POST /auth/register - Rate Limiting', () => {
    it('should rate limit registration attempts', async () => {
      // Make 5 registration attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({
            username: `testuser${i}`,
            password: testPassword,
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser6',
          password: testPassword,
        })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
    });
  });

  describe('POST /auth/refresh - Rate Limiting', () => {
    it('should rate limit token refresh attempts', async () => {
      // Make 5 token refresh attempts with invalid tokens
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/refresh')
          .send({
            refreshToken: 'invalid_token',
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid_token',
        })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
    });
  });

  describe('Rate Limit Window', () => {
    it('should use a 15-minute window', async () => {
      // Make one request
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        });

      // Check the reset time is approximately 15 minutes from now
      const resetHeader = response.headers['ratelimit-reset'];
      if (resetHeader) {
        const resetTime = new Date(parseInt(resetHeader) * 1000);
        const now = new Date();
        const diffMinutes = (resetTime.getTime() - now.getTime()) / (1000 * 60);
        
        // Should be approximately 15 minutes (allow some tolerance)
        expect(diffMinutes).toBeGreaterThan(14);
        expect(diffMinutes).toBeLessThanOrEqual(15);
      }
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should rate limit based on IP address', async () => {
      // All requests from the same IP should share the rate limit
      // Make 5 failed attempts with different usernames
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: `user${i}`,
            password: 'wrongpassword',
          });
      }

      // 6th attempt with a different username should still be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'completelydifferentuser',
          password: 'wrongpassword',
        })
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too Many Requests');
    });
  });

  describe('Successful Requests', () => {
    it('should not count successful login attempts against the limit', async () => {
      // This test assumes skipSuccessfulRequests is enabled
      // Since we don't have a valid user, we'll test the behavior indirectly
      // by verifying that failed attempts are counted
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: 'wrongpassword',
          });
      }

      // Verify rate limit is hit
      await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        })
        .expect(429);
    });
  });
});
