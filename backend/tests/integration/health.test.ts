import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { connectTestRedis, closeTestRedis } from '../helpers/test-setup';

/**
 * Integration tests for health check endpoint
 * 
 * Requirements:
 * - System health monitoring
 * - Database connectivity check
 * - Redis connectivity check
 * - Service availability
 */

describe('Health Check Endpoints', () => {
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await createApp();
    prisma = new PrismaClient();
    
    await prisma.$connect();
    await connectTestRedis();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await closeTestRedis();
  });

  describe('GET /api/health', () => {
    it('should return healthy status with all services available', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
    });

    it('should include uptime information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return timestamp in valid date format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should respond quickly (under 1 second)', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return ready status when all services are available', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready', true);
      expect(response.body).toHaveProperty('services');
    });

    it('should include database readiness check', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services.database).toHaveProperty('ready');
    });

    it('should include redis readiness check', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.services).toHaveProperty('redis');
      expect(response.body.services.redis).toHaveProperty('ready');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('alive', true);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should respond immediately without dependency checks', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health/live')
        .expect(200);
      
      const duration = Date.now() - startTime;
      // Liveness should be faster than readiness
      expect(duration).toBeLessThan(500);
    });
  });
});
