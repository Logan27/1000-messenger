import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../../src/config/redis';

/**
 * Integration tests for user endpoints
 * 
 * Tests User Story 9: User Profile Management
 * 
 * Requirements:
 * - FR-009: Users MUST be able to view and edit their display name
 * - FR-010: Users MUST be able to upload and change their avatar image
 * - FR-011: Users MUST be able to set their online status (online, offline, away)
 * - FR-012: System MUST display last seen timestamp for offline users
 * - FR-180: System MUST restrict user profile access to authorized users only
 */

describe('User Endpoints', () => {
  let app: any;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
  let otherUserId: string;

  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'TestPass123!',
  };

  const otherUser = {
    username: `otheruser_${Date.now()}`,
    password: 'TestPass123!',
  };

  beforeAll(async () => {
    app = await createApp();
    prisma = new PrismaClient();
    
    await prisma.$connect();
    await redisClient.ping();

    // Register test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUser.username,
        password: testUser.password,
        passwordConfirm: testUser.password,
        displayName: 'Test User',
      });
    
    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Register another user for profile access tests
    const otherRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: otherUser.username,
        password: otherUser.password,
        passwordConfirm: otherUser.password,
      });
    
    otherUserId = otherRegisterResponse.body.user.id;
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { username: testUser.username },
            { username: otherUser.username },
          ],
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await prisma.$disconnect();
    await redisClient.quit();
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('displayName');
      expect(response.body).toHaveProperty('status');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should successfully update display name (FR-009)', async () => {
      const newDisplayName = 'Updated Test User';
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: newDisplayName,
        })
        .expect(200);

      expect(response.body).toHaveProperty('displayName', newDisplayName);
      expect(response.body).toHaveProperty('id', userId);
    });

    it('should successfully update avatarUrl', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          avatarUrl,
        })
        .expect(200);

      expect(response.body).toHaveProperty('avatarUrl', avatarUrl);
    });

    it('should update both displayName and avatarUrl', async () => {
      const updates = {
        displayName: 'Fully Updated',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('displayName', updates.displayName);
      expect(response.body).toHaveProperty('avatarUrl', updates.avatarUrl);
    });

    it('should reject update without authentication', async () => {
      await request(app)
        .put('/api/users/me')
        .send({
          displayName: 'New Name',
        })
        .expect(401);
    });

    it('should reject invalid update data', async () => {
      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: '', // Empty display name
        })
        .expect(400);
    });
  });

  describe('PATCH /api/users/me/status', () => {
    it('should successfully update status to online (FR-011)', async () => {
      const response = await request(app)
        .patch('/api/users/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'online',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'online');
    });

    it('should successfully update status to offline (FR-011)', async () => {
      const response = await request(app)
        .patch('/api/users/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'offline',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'offline');
    });

    it('should successfully update status to away (FR-011)', async () => {
      const response = await request(app)
        .patch('/api/users/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'away',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'away');
    });

    it('should reject invalid status value', async () => {
      await request(app)
        .patch('/api/users/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'busy', // Invalid status
        })
        .expect(400);
    });

    it('should reject status update without authentication', async () => {
      await request(app)
        .patch('/api/users/me/status')
        .send({
          status: 'online',
        })
        .expect(401);
    });

    it('should update lastSeen timestamp when status changes (FR-012)', async () => {
      const response = await request(app)
        .patch('/api/users/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'offline',
        })
        .expect(200);

      expect(response.body).toHaveProperty('lastSeen');
      expect(new Date(response.body.lastSeen)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow user to view their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('username', testUser.username);
    });

    it('should restrict profile access to non-contacts (FR-180)', async () => {
      // Try to view other user's profile without being contacts
      const response = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('permission');
    });

    it('should reject profile view without authentication', async () => {
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 for invalid user ID format', async () => {
      await request(app)
        .get('/api/users/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ query: testUser.username.substring(0, 8) })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some((user: any) => user.username === testUser.username)).toBe(true);
    });

    it('should return empty array for non-matching query', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ query: 'nonexistentuser12345' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should not include password hash in search results', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ query: testUser.username.substring(0, 8) })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should reject search without authentication', async () => {
      await request(app)
        .get('/api/users/search')
        .query({ query: 'test' })
        .expect(401);
    });

    it('should reject search with missing query', async () => {
      await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should reject search with empty query', async () => {
      await request(app)
        .get('/api/users/search')
        .query({ query: '' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should limit search results to maximum 20 users', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ query: 'test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Profile Management - Complete Flow', () => {
    it('should complete full profile management flow', async () => {
      // 1. Get initial profile
      const initialProfile = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 2. Update display name
      const updatedProfile = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'New Display Name',
        })
        .expect(200);

      expect(updatedProfile.body.displayName).toBe('New Display Name');
      expect(updatedProfile.body.displayName).not.toBe(initialProfile.body.displayName);

      // 3. Update status
      await request(app)
        .patch('/api/users/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'away',
        })
        .expect(200);

      // 4. Verify all changes
      const finalProfile = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(finalProfile.body.displayName).toBe('New Display Name');
      expect(finalProfile.body.status).toBe('away');
    });
  });
});
