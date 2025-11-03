import {
  validateUsername,
  validatePassword,
  validateStrongPassword,
  validateEmail,
  validateUuid,
  sanitizeString,
  sanitizeMessageContent,
  validate,
  validateOrThrow,
  usernameSchema,
  userRegistrationSchema,
  userLoginSchema,
  createMessageSchema,
  createGroupChatSchema,
  addReactionSchema,
  paginationSchema,
  searchQuerySchema,
} from '../../../src/utils/validators.util';

describe('Validators Utility', () => {
  describe('Basic Validators', () => {
    describe('validateUsername', () => {
      it('should accept valid usernames', () => {
        expect(validateUsername('user123')).toBe(true);
        expect(validateUsername('test_user')).toBe(true);
        expect(validateUsername('abc')).toBe(true);
        expect(validateUsername('a'.repeat(50))).toBe(true);
      });

      it('should reject invalid usernames', () => {
        expect(validateUsername('ab')).toBe(false); // too short
        expect(validateUsername('a'.repeat(51))).toBe(false); // too long
        expect(validateUsername('user-name')).toBe(false); // contains dash
        expect(validateUsername('user name')).toBe(false); // contains space
        expect(validateUsername('user@mail')).toBe(false); // contains @
        expect(validateUsername('')).toBe(false); // empty
      });
    });

    describe('validatePassword', () => {
      it('should accept valid passwords', () => {
        expect(validatePassword('password')).toBe(true);
        expect(validatePassword('12345678')).toBe(true);
        expect(validatePassword('a'.repeat(128))).toBe(true);
      });

      it('should reject invalid passwords', () => {
        expect(validatePassword('1234567')).toBe(false); // too short
        expect(validatePassword('a'.repeat(129))).toBe(false); // too long
        expect(validatePassword('')).toBe(false); // empty
      });
    });

    describe('validateStrongPassword', () => {
      it('should accept strong passwords', () => {
        expect(validateStrongPassword('Password123!')).toBe(true);
        expect(validateStrongPassword('Str0ng!Pass')).toBe(true);
        expect(validateStrongPassword('MyP@ssw0rd')).toBe(true);
      });

      it('should reject weak passwords', () => {
        expect(validateStrongPassword('password123')).toBe(false); // no uppercase
        expect(validateStrongPassword('PASSWORD123')).toBe(false); // no lowercase
        expect(validateStrongPassword('Password!!!')).toBe(false); // no number
        expect(validateStrongPassword('Password123')).toBe(false); // no special char
        expect(validateStrongPassword('12345678')).toBe(false); // only numbers
      });
    });

    describe('validateEmail', () => {
      it('should accept valid emails', () => {
        expect(validateEmail('user@example.com')).toBe(true);
        expect(validateEmail('test.user@domain.co.uk')).toBe(true);
        expect(validateEmail('name+tag@email.com')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(validateEmail('notanemail')).toBe(false);
        expect(validateEmail('missing@domain')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('user@')).toBe(false);
        expect(validateEmail('')).toBe(false);
      });
    });

    describe('validateUuid', () => {
      it('should accept valid UUIDs', () => {
        expect(validateUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        expect(validateUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      });

      it('should reject invalid UUIDs', () => {
        expect(validateUuid('not-a-uuid')).toBe(false);
        expect(validateUuid('123')).toBe(false);
        expect(validateUuid('')).toBe(false);
        expect(validateUuid('123e4567-e89b-12d3-a456')).toBe(false);
      });
    });
  });

  describe('Sanitization Functions', () => {
    describe('sanitizeString', () => {
      it('should remove angle brackets', () => {
        expect(sanitizeString('hello<world>')).toBe('helloworld');
        expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      });

      it('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
        expect(sanitizeString('\n\ttest\n\t')).toBe('test');
      });
    });

    describe('sanitizeMessageContent', () => {
      it('should remove HTML tags', () => {
        expect(sanitizeMessageContent('hello <b>world</b>')).toBe('hello world');
        expect(sanitizeMessageContent('<p>paragraph</p>')).toBe('paragraph');
      });

      it('should remove script tags and content', () => {
        expect(sanitizeMessageContent('<script>alert("xss")</script>hello')).toBe('hello');
        expect(sanitizeMessageContent('test<script src="evil.js"></script>message')).toBe('testmessage');
      });

      it('should trim whitespace', () => {
        expect(sanitizeMessageContent('  hello  ')).toBe('hello');
      });
    });
  });

  describe('Schema Validation', () => {
    describe('userRegistrationSchema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          username: 'testuser',
          password: 'password123',
          passwordConfirm: 'password123',
          displayName: 'Test User',
        };
        const result = userRegistrationSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate registration without displayName', () => {
        const validData = {
          username: 'testuser',
          password: 'password123',
          passwordConfirm: 'password123',
        };
        const result = userRegistrationSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid username', () => {
        const invalidData = {
          username: 'ab',
          password: 'password123',
          passwordConfirm: 'password123',
        };
        const result = userRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject short password', () => {
        const invalidData = {
          username: 'testuser',
          password: '1234567',
          passwordConfirm: '1234567',
        };
        const result = userRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject non-matching passwords', () => {
        const invalidData = {
          username: 'testuser',
          password: 'password123',
          passwordConfirm: 'different123',
        };
        const result = userRegistrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some(e => e.message === 'Passwords do not match')).toBe(true);
        }
      });
    });

    describe('userLoginSchema', () => {
      it('should validate correct login data', () => {
        const validData = {
          username: 'testuser',
          password: 'anypassword',
        };
        const result = userLoginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty username', () => {
        const invalidData = {
          username: '',
          password: 'password',
        };
        const result = userLoginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const invalidData = {
          username: 'testuser',
          password: '',
        };
        const result = userLoginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('createMessageSchema', () => {
      it('should validate text message', () => {
        const validData = {
          content: 'Hello, world!',
          contentType: 'text',
        };
        const result = createMessageSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate message with reply', () => {
        const validData = {
          content: 'Reply message',
          replyToId: '123e4567-e89b-12d3-a456-426614174000',
        };
        const result = createMessageSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate message with metadata', () => {
        const validData = {
          content: 'Formatted message',
          metadata: {
            formatting: {
              bold: [[0, 5]],
            },
          },
        };
        const result = createMessageSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty content', () => {
        const invalidData = {
          content: '',
        };
        const result = createMessageSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject content exceeding limit', () => {
        const invalidData = {
          content: 'a'.repeat(10001),
        };
        const result = createMessageSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('createGroupChatSchema', () => {
      it('should validate group chat creation', () => {
        const validData = {
          name: 'My Group',
          participantIds: ['123e4567-e89b-12d3-a456-426614174000'],
        };
        const result = createGroupChatSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate with multiple participants', () => {
        const validData = {
          name: 'Team Chat',
          participantIds: [
            '123e4567-e89b-12d3-a456-426614174000',
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
          ],
        };
        const result = createGroupChatSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty name', () => {
        const invalidData = {
          name: '',
          participantIds: ['123e4567-e89b-12d3-a456-426614174000'],
        };
        const result = createGroupChatSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject empty participant list', () => {
        const invalidData = {
          name: 'Group',
          participantIds: [],
        };
        const result = createGroupChatSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject too many participants', () => {
        const invalidData = {
          name: 'Group',
          participantIds: new Array(300).fill('123e4567-e89b-12d3-a456-426614174000'),
        };
        const result = createGroupChatSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('addReactionSchema', () => {
      it('should validate emoji reaction', () => {
        const validData = { emoji: '👍' };
        const result = addReactionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate text emoji', () => {
        const validData = { emoji: ':smile:' };
        const result = addReactionSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty emoji', () => {
        const invalidData = { emoji: '' };
        const result = addReactionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject too long emoji', () => {
        const invalidData = { emoji: 'a'.repeat(11) };
        const result = addReactionSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('paginationSchema', () => {
      it('should validate with defaults', () => {
        const result = paginationSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(result.data.offset).toBe(0);
        }
      });

      it('should validate custom pagination', () => {
        const validData = { limit: 20, offset: 40 };
        const result = paginationSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative offset', () => {
        const invalidData = { limit: 10, offset: -1 };
        const result = paginationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject limit over 100', () => {
        const invalidData = { limit: 101, offset: 0 };
        const result = paginationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('searchQuerySchema', () => {
      it('should validate search query', () => {
        const validData = { query: 'search term' };
        const result = searchQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate search with chat filter', () => {
        const validData = {
          query: 'search term',
          chatId: '123e4567-e89b-12d3-a456-426614174000',
        };
        const result = searchQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty query', () => {
        const invalidData = { query: '' };
        const result = searchQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject too long query', () => {
        const invalidData = { query: 'a'.repeat(101) };
        const result = searchQuerySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('validate', () => {
      it('should return success with valid data', () => {
        const result = validate(usernameSchema, 'validuser');
        expect(result.success).toBe(true);
        expect(result.data).toBe('validuser');
        expect(result.errors).toBeUndefined();
      });

      it('should return errors with invalid data', () => {
        const result = validate(usernameSchema, 'ab');
        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.errors).toBeDefined();
        expect(result.errors?.length).toBeGreaterThan(0);
      });

      it('should include field path in errors', () => {
        const schema = userRegistrationSchema;
        const result = validate(schema, { username: 'ab', password: '123', passwordConfirm: '123' });
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.field === 'username')).toBe(true);
        expect(result.errors?.some(e => e.field === 'password')).toBe(true);
      });
    });

    describe('validateOrThrow', () => {
      it('should return data with valid input', () => {
        const result = validateOrThrow(usernameSchema, 'validuser');
        expect(result).toBe('validuser');
      });

      it('should throw error with invalid input', () => {
        expect(() => validateOrThrow(usernameSchema, 'ab')).toThrow();
      });
    });
  });
});
