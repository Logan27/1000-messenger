import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { SessionService } from '../../../src/services/session.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { config } from '../../../src/config/env';
import { LIMITS } from '../../../src/config/constants';

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/services/session.service');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockSessionService: jest.Mocked<SessionService>;

  const mockUser = {
    id: 'user-id-123',
    username: 'testuser',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    avatarUrl: '',
    status: 'online',
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocked instances
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    mockSessionService = new SessionService() as jest.Mocked<SessionService>;

    // Create service instance
    authService = new AuthService(mockUserRepo, mockSessionService);
  });

  describe('register', () => {
    const username = 'newuser';
    const password = 'password123';
    const displayName = 'New User';

    it('should successfully register a new user', async () => {
      // Arrange
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastSeen.mockResolvedValue(undefined as any);
      mockSessionService.createSession.mockResolvedValue(undefined as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Act
      const result = await authService.register(username, password, undefined, displayName);

      // Assert
      expect(mockUserRepo.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, LIMITS.BCRYPT_ROUNDS);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username,
        passwordHash: 'hashed-password',
        displayName,
      });
      expect(mockSessionService.createSession).toHaveBeenCalled();
      expect(mockUserRepo.updateLastSeen).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          displayName: mockUser.displayName,
          avatarUrl: mockUser.avatarUrl,
        },
      });
    });

    it('should use username as displayName if not provided', async () => {
      // Arrange
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastSeen.mockResolvedValue(undefined as any);
      mockSessionService.createSession.mockResolvedValue(undefined as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Act
      await authService.register(username, password);

      // Assert
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username,
        passwordHash: 'hashed-password',
        displayName: username, // Should default to username
      });
    });

    it('should throw error if username is too short', async () => {
      // Act & Assert
      await expect(authService.register('ab', password)).rejects.toThrow(
        `Username must be between ${LIMITS.USERNAME_MIN_LENGTH} and ${LIMITS.USERNAME_MAX_LENGTH} characters`
      );
    });

    it('should throw error if username is too long', async () => {
      // Arrange
      const longUsername = 'a'.repeat(LIMITS.USERNAME_MAX_LENGTH + 1);

      // Act & Assert
      await expect(authService.register(longUsername, password)).rejects.toThrow(
        `Username must be between ${LIMITS.USERNAME_MIN_LENGTH} and ${LIMITS.USERNAME_MAX_LENGTH} characters`
      );
    });

    it('should throw error if username contains invalid characters', async () => {
      // Act & Assert
      await expect(authService.register('user-name', password)).rejects.toThrow(
        'Username can only contain letters, numbers, and underscores'
      );
      await expect(authService.register('user@mail', password)).rejects.toThrow(
        'Username can only contain letters, numbers, and underscores'
      );
    });

    it('should throw error if password is too short', async () => {
      // Act & Assert
      await expect(authService.register(username, '1234567')).rejects.toThrow(
        `Password must be at least ${LIMITS.PASSWORD_MIN_LENGTH} characters`
      );
    });

    it('should throw error if username is already taken', async () => {
      // Arrange
      mockUserRepo.findByUsername.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(authService.register(username, password)).rejects.toThrow('Username already taken');
    });

    it('should create session with device info if provided', async () => {
      // Arrange
      const deviceInfo = {
        deviceId: 'device-123',
        deviceType: 'mobile',
        deviceName: 'iPhone 12',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };
      mockUserRepo.findByUsername.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastSeen.mockResolvedValue(undefined as any);
      mockSessionService.createSession.mockResolvedValue(undefined as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Act
      await authService.register(username, password, deviceInfo);

      // Assert
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
        })
      );
    });
  });

  describe('login', () => {
    const username = 'testuser';
    const password = 'password123';

    it('should successfully log in a user with correct credentials', async () => {
      // Arrange
      mockUserRepo.findByUsername.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastSeen.mockResolvedValue(undefined as any);
      mockSessionService.createSession.mockResolvedValue(undefined as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Act
      const result = await authService.login(username, password);

      // Assert
      expect(mockUserRepo.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(mockSessionService.createSession).toHaveBeenCalled();
      expect(mockUserRepo.updateLastSeen).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          displayName: mockUser.displayName,
          avatarUrl: mockUser.avatarUrl,
        },
      });
    });

    it('should throw error if user does not exist', async () => {
      // Arrange
      mockUserRepo.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(username, password)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      // Arrange
      mockUserRepo.findByUsername.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(username, password)).rejects.toThrow('Invalid credentials');
    });

    it('should create session with device info if provided', async () => {
      // Arrange
      const deviceInfo = {
        deviceId: 'device-456',
        deviceType: 'desktop',
        deviceName: 'Chrome Browser',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0',
      };
      mockUserRepo.findByUsername.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastSeen.mockResolvedValue(undefined as any);
      mockSessionService.createSession.mockResolvedValue(undefined as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      // Act
      await authService.login(username, password, deviceInfo);

      // Assert
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
        })
      );
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockSession = {
      id: 'session-id',
      userId: 'user-id-123',
      sessionToken: refreshToken,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    it('should successfully refresh access token with valid refresh token', async () => {
      // Arrange
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id-123', type: 'refresh' });
      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

      // Act
      const result = await authService.refreshAccessToken(refreshToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, config.JWT_REFRESH_SECRET);
      expect(mockSessionService.findByToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should throw error if refresh token is invalid', async () => {
      // Arrange
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshAccessToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if session does not exist', async () => {
      // Arrange
      mockSessionService.findByToken.mockResolvedValue(null);
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id-123', type: 'refresh' });

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if session is not active', async () => {
      // Arrange
      mockSessionService.findByToken.mockResolvedValue({ ...mockSession, isActive: false });
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id-123', type: 'refresh' });

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if session is expired', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      mockSessionService.findByToken.mockResolvedValue(expiredSession);
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id-123', type: 'refresh' });

      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    const userId = 'user-id-123';
    const sessionToken = 'session-token';

    it('should invalidate specific session if token provided', async () => {
      // Arrange
      mockSessionService.invalidateSession.mockResolvedValue(undefined as any);

      // Act
      await authService.logout(userId, sessionToken);

      // Assert
      expect(mockSessionService.invalidateSession).toHaveBeenCalledWith(sessionToken);
    });

    it('should invalidate all user sessions if no token provided', async () => {
      // Arrange
      mockSessionService.invalidateAllUserSessions.mockResolvedValue(undefined as any);

      // Act
      await authService.logout(userId);

      // Assert
      expect(mockSessionService.invalidateAllUserSessions).toHaveBeenCalledWith(userId);
    });
  });

  describe('verifyAccessToken', () => {
    const accessToken = 'valid-access-token';

    it('should successfully verify valid access token', async () => {
      // Arrange
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id-123', type: 'access' });

      // Act
      const result = await authService.verifyAccessToken(accessToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(accessToken, config.JWT_SECRET);
      expect(result).toEqual({ userId: 'user-id-123', type: 'access' });
    });

    it('should throw error if token is invalid', async () => {
      // Arrange
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyAccessToken('invalid-token')).rejects.toThrow('Invalid access token');
    });
  });
});
