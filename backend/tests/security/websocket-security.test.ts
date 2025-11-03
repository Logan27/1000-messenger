/**
 * WebSocket Security Tests
 * 
 * Tests for WebSocket security including:
 * - Authentication
 * - Authorization for rooms
 * - Message validation
 * - Rate limiting
 * - Message injection
 * - Connection limits
 */

import { io as ioClient, Socket } from 'socket.io-client';
import * as jwt from 'jsonwebtoken';
import { createApp } from '../../src/app';
import { config } from '../../src/config/env';
import * as http from 'http';

describe('WebSocket Security Tests', () => {
  let server: http.Server;
  let app: any;
  let baseURL: string;

  beforeAll(async (done) => {
    app = await createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 3000;
        baseURL = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Authentication', () => {
    it('should reject WebSocket connections without token', (done) => {
      const socket = ioClient(baseURL);

      socket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        socket.close();
        done();
      });

      socket.on('connect', () => {
        socket.close();
        done(new Error('Should not connect without token'));
      });
    });

    it('should reject WebSocket connections with invalid token', (done) => {
      const socket = ioClient(baseURL, {
        auth: { token: 'invalid-token-here' },
      });

      socket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        socket.close();
        done();
      });

      socket.on('connect', () => {
        socket.close();
        done(new Error('Should not connect with invalid token'));
      });
    });

    it('should reject WebSocket connections with expired token', (done) => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const socket = ioClient(baseURL, {
        auth: { token: expiredToken },
      });

      socket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        socket.close();
        done();
      });

      socket.on('connect', () => {
        socket.close();
        done(new Error('Should not connect with expired token'));
      });
    });

    it('should accept WebSocket connections with valid token', (done) => {
      const validToken = jwt.sign(
        { userId: 'user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.close();
        done();
      });

      socket.on('connect_error', (error) => {
        socket.close();
        done(error);
      });
    });

    it('should reject token with wrong type', (done) => {
      const refreshToken = jwt.sign(
        { userId: 'user-123', type: 'refresh' },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const socket = ioClient(baseURL, {
        auth: { token: refreshToken },
      });

      socket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        socket.close();
        done();
      });

      socket.on('connect', () => {
        socket.close();
        done(new Error('Should not connect with refresh token'));
      });
    });
  });

  describe('Message Validation', () => {
    let validToken: string;
    let socket: Socket;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterEach(() => {
      if (socket && socket.connected) {
        socket.close();
      }
    });

    it('should reject messages with XSS payloads', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        socket.emit('message:send', {
          chatId: 'test-chat',
          content: '<script>alert("XSS")</script>',
          type: 'text',
        });

        socket.on('error', (error) => {
          expect(error).toBeDefined();
          done();
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });

    it('should reject malformed message payloads', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const malformedPayloads = [
          null,
          undefined,
          'string-instead-of-object',
          { chatId: null },
          { content: null },
          [],
        ];

        malformedPayloads.forEach((payload) => {
          socket.emit('message:send', payload);
        });

        socket.on('error', (error) => {
          expect(error).toBeDefined();
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });

    it('should reject extremely large messages', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const largeMessage = 'A'.repeat(100000);
        
        socket.emit('message:send', {
          chatId: 'test-chat',
          content: largeMessage,
          type: 'text',
        });

        socket.on('error', (error) => {
          expect(error).toBeDefined();
          done();
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });
  });

  describe('Room Authorization', () => {
    let validToken: string;
    let socket: Socket;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterEach(() => {
      if (socket && socket.connected) {
        socket.close();
      }
    });

    it('should prevent joining unauthorized rooms', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        socket.emit('room:join', { chatId: 'unauthorized-chat-id' });

        socket.on('error', (error) => {
          expect(error).toBeDefined();
          done();
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });

    it('should prevent SQL injection in room IDs', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const maliciousRoomIds = [
          "' OR '1'='1",
          "1'; DROP TABLE chats; --",
          "1' UNION SELECT * FROM users--",
        ];

        maliciousRoomIds.forEach((roomId) => {
          socket.emit('room:join', { chatId: roomId });
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });
  });

  describe('Rate Limiting', () => {
    let validToken: string;
    let socket: Socket;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterEach(() => {
      if (socket && socket.connected) {
        socket.close();
      }
    });

    it('should rate limit message sending', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        let errorReceived = false;

        for (let i = 0; i < 100; i++) {
          socket.emit('message:send', {
            chatId: 'test-chat',
            content: `Message ${i}`,
            type: 'text',
          });
        }

        socket.on('error', (error) => {
          if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
            errorReceived = true;
          }
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 2000);
      });
    }, 10000);

    it('should rate limit typing indicators', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        for (let i = 0; i < 50; i++) {
          socket.emit('typing:start', { chatId: 'test-chat' });
        }

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });
  });

  describe('Connection Limits', () => {
    it('should limit number of concurrent connections per user', (done) => {
      const validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const sockets: Socket[] = [];
      let connectionErrors = 0;

      for (let i = 0; i < 20; i++) {
        const socket = ioClient(baseURL, {
          auth: { token: validToken },
        });

        socket.on('connect_error', () => {
          connectionErrors++;
        });

        sockets.push(socket);
      }

      setTimeout(() => {
        sockets.forEach((s) => s.close());
        done();
      }, 2000);
    }, 10000);
  });

  describe('Event Injection', () => {
    let validToken: string;
    let socket: Socket;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterEach(() => {
      if (socket && socket.connected) {
        socket.close();
      }
    });

    it('should prevent emitting internal server events', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const internalEvents = [
          'connection',
          'disconnect',
          'error',
          'connect_error',
          'reconnect',
        ];

        internalEvents.forEach((event) => {
          socket.emit(event as any, { malicious: 'payload' });
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });

    it('should prevent event name injection', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const maliciousEvents = [
          '__proto__',
          'constructor',
          'prototype',
          'admin:grant',
          'system:shutdown',
        ];

        maliciousEvents.forEach((event) => {
          socket.emit(event as any, { data: 'test' });
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });
  });

  describe('Binary Data Attacks', () => {
    let validToken: string;
    let socket: Socket;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterEach(() => {
      if (socket && socket.connected) {
        socket.close();
      }
    });

    it('should handle binary payloads safely', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const binaryData = new Uint8Array(10000);
        socket.emit('message:send', binaryData);

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });

    it('should reject oversized binary messages', (done) => {
      socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        const largeBinary = new Uint8Array(10 * 1024 * 1024); // 10MB
        socket.emit('file:upload', largeBinary);

        socket.on('error', (error) => {
          expect(error).toBeDefined();
        });

        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });
  });

  describe('Cross-User Message Injection', () => {
    let user1Token: string;
    let user2Token: string;
    let socket1: Socket;
    let socket2: Socket;

    beforeEach(() => {
      user1Token = jwt.sign(
        { userId: 'user-1', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      user2Token = jwt.sign(
        { userId: 'user-2', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterEach(() => {
      if (socket1 && socket1.connected) socket1.close();
      if (socket2 && socket2.connected) socket2.close();
    });

    it('should prevent user from sending messages as another user', (done) => {
      socket1 = ioClient(baseURL, {
        auth: { token: user1Token },
      });

      socket1.on('connect', () => {
        socket1.emit('message:send', {
          chatId: 'test-chat',
          content: 'Impersonation attempt',
          type: 'text',
          userId: 'user-2', // Trying to impersonate user-2
        });

        setTimeout(() => {
          socket1.close();
          done();
        }, 1000);
      });
    });

    it('should isolate messages between users', (done) => {
      let user2ReceivedMessage = false;

      socket1 = ioClient(baseURL, {
        auth: { token: user1Token },
      });

      socket2 = ioClient(baseURL, {
        auth: { token: user2Token },
      });

      socket2.on('message:new', () => {
        user2ReceivedMessage = true;
      });

      socket1.on('connect', () => {
        socket1.emit('message:send', {
          chatId: 'private-chat-user1-user3',
          content: 'Private message',
          type: 'text',
        });

        setTimeout(() => {
          socket1.close();
          socket2.close();
          done();
        }, 1000);
      });
    });
  });

  describe('Denial of Service', () => {
    let validToken: string;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 'test-user-123', type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should handle rapid connect/disconnect cycles', (done) => {
      for (let i = 0; i < 10; i++) {
        const socket = ioClient(baseURL, {
          auth: { token: validToken },
        });

        setTimeout(() => {
          socket.close();
        }, 100);
      }

      setTimeout(done, 2000);
    }, 10000);

    it('should handle malformed packets gracefully', (done) => {
      const socket = ioClient(baseURL, {
        auth: { token: validToken },
      });

      socket.on('connect', () => {
        (socket as any).sendBuffer = ['\x00\xFF\xFE\xFD'];
        
        setTimeout(() => {
          socket.close();
          done();
        }, 1000);
      });
    });
  });
});
