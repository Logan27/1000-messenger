import {
  userRegistrationSchema,
  userLoginSchema,
  usernameSchema,
  passwordSchema,
} from '../validators.util';

describe('Auth Validation Schemas', () => {
  describe('usernameSchema', () => {
    it('should accept valid usernames', () => {
      expect(() => usernameSchema.parse('john_doe')).not.toThrow();
      expect(() => usernameSchema.parse('user123')).not.toThrow();
      expect(() => usernameSchema.parse('abc')).not.toThrow();
      expect(() => usernameSchema.parse('a'.repeat(50))).not.toThrow();
    });

    it('should reject usernames that are too short', () => {
      expect(() => usernameSchema.parse('ab')).toThrow('Username must be at least 3 characters');
    });

    it('should reject usernames that are too long', () => {
      expect(() => usernameSchema.parse('a'.repeat(51))).toThrow('Username must not exceed 50 characters');
    });

    it('should reject usernames with invalid characters', () => {
      expect(() => usernameSchema.parse('user-name')).toThrow('Username can only contain letters, numbers, and underscores');
      expect(() => usernameSchema.parse('user@name')).toThrow('Username can only contain letters, numbers, and underscores');
      expect(() => usernameSchema.parse('user name')).toThrow('Username can only contain letters, numbers, and underscores');
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      expect(() => passwordSchema.parse('password')).not.toThrow();
      expect(() => passwordSchema.parse('12345678')).not.toThrow();
      expect(() => passwordSchema.parse('a'.repeat(128))).not.toThrow();
    });

    it('should reject passwords that are too short', () => {
      expect(() => passwordSchema.parse('1234567')).toThrow('Password must be at least 8 characters');
    });

    it('should reject passwords that are too long', () => {
      expect(() => passwordSchema.parse('a'.repeat(129))).toThrow('Password must not exceed 128 characters');
    });
  });

  describe('userRegistrationSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        username: 'john_doe',
        password: 'password123',
        passwordConfirm: 'password123',
        displayName: 'John Doe',
      };
      
      expect(() => userRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should accept registration without displayName', () => {
      const validData = {
        username: 'john_doe',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      
      expect(() => userRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should reject when passwords do not match', () => {
      const invalidData = {
        username: 'john_doe',
        password: 'password123',
        passwordConfirm: 'different_password',
        displayName: 'John Doe',
      };
      
      expect(() => userRegistrationSchema.parse(invalidData)).toThrow('Passwords do not match');
    });

    it('should reject when passwordConfirm is missing', () => {
      const invalidData = {
        username: 'john_doe',
        password: 'password123',
        displayName: 'John Doe',
      };
      
      expect(() => userRegistrationSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid username format', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      
      expect(() => userRegistrationSchema.parse(invalidData)).toThrow('Username must be at least 3 characters');
    });

    it('should reject invalid password length', () => {
      const invalidData = {
        username: 'john_doe',
        password: '1234567',
        passwordConfirm: '1234567',
      };
      
      expect(() => userRegistrationSchema.parse(invalidData)).toThrow('Password must be at least 8 characters');
    });
  });

  describe('userLoginSchema', () => {
    it('should accept valid login data', () => {
      const validData = {
        username: 'john_doe',
        password: 'password123',
      };
      
      expect(() => userLoginSchema.parse(validData)).not.toThrow();
    });

    it('should reject when username is empty', () => {
      const invalidData = {
        username: '',
        password: 'password123',
      };
      
      expect(() => userLoginSchema.parse(invalidData)).toThrow('Username is required');
    });

    it('should reject when password is empty', () => {
      const invalidData = {
        username: 'john_doe',
        password: '',
      };
      
      expect(() => userLoginSchema.parse(invalidData)).toThrow('Password is required');
    });

    it('should reject when username is missing', () => {
      const invalidData = {
        password: 'password123',
      };
      
      expect(() => userLoginSchema.parse(invalidData)).toThrow();
    });

    it('should reject when password is missing', () => {
      const invalidData = {
        username: 'john_doe',
      };
      
      expect(() => userLoginSchema.parse(invalidData)).toThrow();
    });
  });
});
