import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../../src/config/redis';

/**
 * Integration tests for authentication endpoints
 * 
 * Tests User Story 1: User Registration and Authentication
 * 
 * Requirements:
 * - FR-001: System MUST allow users to self-register with username/password
 * - FR-002: System MUST validate username uniqueness
 * - FR-003: System MUST require password confirmation during registration
 * - FR-004: System MUST automatically log users in after successful registration
 * - FR-005: System MUST authenticate users with username and password credentials
 * - FR-007: System MUST persist user sessions across browser restarts
 * - FR-008: Users MUST be able to log out and terminate their session
 */

describe('Authentication Endpoints', () => {
  let app: any;
  let prisma: PrismaClient;
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'TestPass123!';
  let refreshToken: string;

  beforeAll(async () => {
    // Create app instance
    app = await createApp();
    prisma = new PrismaClient();
    
    // Ensure connections are established
    await prisma.$connect();
    await redisClient.ping();
  });

  afterAll(async () => {
    // Cleanup: delete test users
    try {
      await prisma.user.deleteMany({
        where: {
          username: {
            contains: 'testuser_',
          },
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    // Close connections
    await prisma.$disconnect();
    await redisClient.quit();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid credentials (FR-001, FR-004)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword,
          passwordConfirm: testPassword,
          displayName: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(testUsername);
      expect(response.body.user.displayName).toBe('Test User');
      
      // Store tokens for subsequent tests
      refreshToken = response.body.refreshToken;
    });

    it('should reject registration with duplicate username (FR-002)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword,
          passwordConfirm: testPassword,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already taken');
    });

    it('should reject registration with username too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          password: testPassword,
          passwordConfirm: testPassword,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with username too long', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'a'.repeat(51),
          password: testPassword,
          passwordConfirm: testPassword,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with invalid username characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user-name',
          password: testPassword,
          passwordConfirm: testPassword,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `newuser_${Date.now()}`,
          password: '1234567',
          passwordConfirm: '1234567',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with non-matching passwords (FR-003)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `newuser_${Date.now()}`,
          password: testPassword,
          passwordConfirm: 'DifferentPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('match');
    });

    it('should use username as displayName if not provided', async () => {
      const username = `userNoDisplay_${Date.now()}`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          password: testPassword,
          passwordConfirm: testPassword,
        })
        .expect(201);

      expect(response.body.user.displayName).toBe(username);
    });

    it('should reject registration with missing required fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: `newuser_${Date.now()}`,
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with correct credentials (FR-005)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(testUsername);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: testPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing username', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          password: testPassword,
        })
        .expect(400);
    });

    it('should reject login with missing password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
        })
        .expect(400);
    });

    it('should return user profile without password hash', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh access token with valid refresh token (FR-007)', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh with missing token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should reject refresh with expired token', async () => {
      // This test would require creating an expired token
      // For now, we'll just verify the endpoint rejects malformed tokens
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let logoutToken: string;

    beforeAll(async () => {
      // Login to get a fresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        });
      logoutToken = response.body.accessToken;
    });

    it('should successfully log out authenticated user (FR-008)', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('success');
    });

    it('should reject logout without authentication token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });

    it('should reject logout with invalid token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject logout with malformed authorization header', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'invalid-format')
        .expect(401);
    });
  });

  describe('Session Persistence (FR-007)', () => {
    it('should maintain valid session across multiple requests', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(200);

      const token = loginResponse.body.accessToken;

      // Make multiple authenticated requests
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      }
    });

    it('should allow token refresh to extend session', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(200);

      const oldRefreshToken = loginResponse.body.refreshToken;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: oldRefreshToken,
        })
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;

      // Use new access token
      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });
  });

  describe('User Story 1 - Complete Flow', () => {
    it('should complete full registration -> logout -> login flow', async () => {
      const username = `fullflow_${Date.now()}`;

      // 1. Register new account
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          password: testPassword,
          passwordConfirm: testPassword,
        })
        .expect(201);

      const firstAccessToken = registerResponse.body.accessToken;

      // 2. Verify auto-login by accessing protected endpoint
      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${firstAccessToken}`)
        .expect(200);

      // 3. Log out
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${firstAccessToken}`)
        .expect(200);

      // 4. Log back in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username,
          password: testPassword,
        })
        .expect(200);

      const secondAccessToken = loginResponse.body.accessToken;

      // 5. Verify session persistence
      const meResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${secondAccessToken}`)
        .expect(200);

      expect(meResponse.body.username).toBe(username);
    });
  });
});
