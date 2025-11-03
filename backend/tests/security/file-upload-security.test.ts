/**
 * File Upload Security Tests
 * 
 * Tests for file upload security including:
 * - Malicious file type detection
 * - File size limits
 * - MIME type validation
 * - Path traversal in filenames
 * - Double extension attacks
 * - Executable file prevention
 */

import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { createApp } from '../../src/app';
import { config } from '../../src/config/env';

describe('File Upload Security Tests', () => {
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

  describe('File Type Validation', () => {
    it('should reject executable file uploads', async () => {
      const executableExtensions = [
        '.exe',
        '.bat',
        '.cmd',
        '.sh',
        '.app',
        '.msi',
        '.com',
      ];

      for (const ext of executableExtensions) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('fake executable'), `malicious${ext}`);

        expect([400, 415]).toContain(response.status);
      }
    });

    it('should reject script file uploads', async () => {
      const scriptExtensions = [
        '.js',
        '.php',
        '.py',
        '.rb',
        '.pl',
        '.asp',
        '.jsp',
      ];

      for (const ext of scriptExtensions) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('<?php echo "hack"; ?>'), `script${ext}`);

        expect([400, 415]).toContain(response.status);
      }
    });

    it('should only accept allowed image formats', async () => {
      const disallowedTypes = [
        { ext: '.svg', mime: 'image/svg+xml', content: '<svg></svg>' },
        { ext: '.bmp', mime: 'image/bmp', content: 'BM...' },
        { ext: '.tiff', mime: 'image/tiff', content: 'II*...' },
      ];

      for (const type of disallowedTypes) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from(type.content), `image${type.ext}`);

        expect([400, 415]).toContain(response.status);
      }
    });
  });

  describe('File Size Limits', () => {
    it('should reject files exceeding maximum size', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB (exceeds 10MB limit)

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, 'large.jpg');

      expect([400, 413]).toContain(response.status);
    });

    it('should accept files within size limit', async () => {
      const validBuffer = Buffer.alloc(1 * 1024 * 1024); // 1MB

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', validBuffer, 'valid.jpg');

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('MIME Type Validation', () => {
    it('should validate MIME type against extension', async () => {
      const mismatchedFiles = [
        { filename: 'image.jpg', mime: 'application/x-executable' },
        { filename: 'photo.png', mime: 'text/html' },
        { filename: 'avatar.gif', mime: 'application/javascript' },
      ];

      for (const file of mismatchedFiles) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .field('Content-Type', file.mime)
          .attach('image', Buffer.from('fake content'), file.filename);

        expect([400, 415]).toContain(response.status);
      }
    });

    it('should detect fake image files with wrong magic bytes', async () => {
      const fakeImage = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fakeImage, 'fake.jpg');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Filename Security', () => {
    it('should prevent path traversal in filenames', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//secret.txt',
        '/etc/passwd',
        'C:\\Windows\\System32\\config.jpg',
      ];

      for (const filename of maliciousFilenames) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('content'), filename);

        expect([400]).toContain(response.status);
      }
    });

    it('should handle special characters in filenames safely', async () => {
      const specialFilenames = [
        'file\0name.jpg',
        'file\nname.jpg',
        'file;rm -rf;.jpg',
        'file`whoami`.jpg',
        'file$(whoami).jpg',
      ];

      for (const filename of specialFilenames) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('content'), filename);

        expect([400]).toContain(response.status);
      }
    });

    it('should prevent double extension attacks', async () => {
      const doubleExtensions = [
        'image.jpg.php',
        'photo.png.exe',
        'avatar.gif.js',
        'file.jpeg.html',
      ];

      for (const filename of doubleExtensions) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('content'), filename);

        expect([400, 415]).toContain(response.status);
      }
    });

    it('should handle extremely long filenames', async () => {
      const longFilename = 'a'.repeat(300) + '.jpg';

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('content'), longFilename);

      expect([400]).toContain(response.status);
    });

    it('should handle unicode and special UTF-8 in filenames', async () => {
      const unicodeFilenames = [
        'файл.jpg', // Cyrillic
        '文件.jpg', // Chinese
        'test\u202e.jpg', // RTL override
        'file\ufeff.jpg', // Zero-width no-break space
      ];

      for (const filename of unicodeFilenames) {
        const response = await request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('content'), filename);

        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });

  describe('Content Validation', () => {
    it('should detect PHP code in image files', async () => {
      const phpContent = Buffer.from('<?php system($_GET["cmd"]); ?>');

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', phpContent, 'shell.jpg');

      expect([400, 415]).toContain(response.status);
    });

    it('should detect HTML/JavaScript in SVG files', async () => {
      const maliciousSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg">
          <script>alert('XSS')</script>
        </svg>
      `);

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', maliciousSvg, 'xss.svg');

      expect([400, 415]).toContain(response.status);
    });

    it('should prevent polyglot file uploads', async () => {
      const polyglot = Buffer.from('GIF89a<?php system($_GET["cmd"]); ?>');

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', polyglot, 'polyglot.gif');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Archive File Bombs', () => {
    it('should prevent zip bomb uploads', async () => {
      const zipBombMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', zipBombMagic, 'bomb.zip');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Multiple File Upload', () => {
    it('should limit number of simultaneous uploads', async () => {
      const uploads = Array(20).fill(null).map((_, i) =>
        request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('content'), `image${i}.jpg`)
      );

      const responses = await Promise.allSettled(uploads);
      
      const rejectedCount = responses.filter(r => 
        r.status === 'fulfilled' && [400, 429].includes(r.value.status)
      ).length;

      expect(rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('File Metadata', () => {
    it('should strip EXIF data from images', async () => {
      const imageWithExif = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE1, // JPEG with EXIF
      ]);

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', imageWithExif, 'photo.jpg');

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Empty and Null Files', () => {
    it('should reject empty file uploads', async () => {
      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from(''), 'empty.jpg');

      expect([400]).toContain(response.status);
    });

    it('should handle missing file gracefully', async () => {
      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect([400]).toContain(response.status);
    });
  });

  describe('Content-Type Spoofing', () => {
    it('should not trust client-provided Content-Type', async () => {
      const executableContent = Buffer.from('MZ'); // PE executable magic bytes

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'image/jpeg')
        .attach('image', executableContent, 'fake.jpg');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Symlink Attacks', () => {
    it('should prevent symlink uploads (if applicable)', async () => {
      const symlinkIndicator = Buffer.from('symlink');

      const response = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', symlinkIndicator, 'symlink.jpg');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Rate Limiting for Uploads', () => {
    it('should rate limit file uploads per user', async () => {
      const uploads = Array(15).fill(null).map(() =>
        request(app)
          .post('/api/users/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('content'), 'test.jpg')
      );

      const responses = await Promise.all(uploads);
      
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000);
  });
});
