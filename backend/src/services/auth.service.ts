import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { config, JWT_CONFIG } from '../config/env';
import { LIMITS } from '../config/constants';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { logger } from '../utils/logger.util';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private sessionService: SessionService
  ) {}

  async register(
    username: string,
    password: string,
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    displayName?: string
  ) {
    // Validate username length
    if (username.length < LIMITS.USERNAME_MIN_LENGTH || username.length > LIMITS.USERNAME_MAX_LENGTH) {
      throw new Error(`Username must be between ${LIMITS.USERNAME_MIN_LENGTH} and ${LIMITS.USERNAME_MAX_LENGTH} characters`);
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // Validate password length
    if (password.length < LIMITS.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${LIMITS.PASSWORD_MIN_LENGTH} characters`);
    }

    // Check if user exists
    const existingUser = await this.userRepo.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Hash password with bcrypt (12 rounds as per spec)
    const passwordHash = await bcrypt.hash(password, LIMITS.BCRYPT_ROUNDS);

    // Create user
    const user = await this.userRepo.create({
      username,
      passwordHash,
      displayName: displayName || username,
    });

    logger.info(`User registered: ${username}`);

    // Auto-login after registration (FR-004)
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Create session
    const sessionData: any = {
      userId: user.id,
      sessionToken: refreshToken,
      expiresAt: new Date(Date.now() + LIMITS.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000),
    };
    
    if (deviceInfo?.deviceId !== undefined) {
      sessionData.deviceId = deviceInfo.deviceId;
    }
    if (deviceInfo?.deviceType !== undefined) {
      sessionData.deviceType = deviceInfo.deviceType;
    }
    if (deviceInfo?.deviceName !== undefined) {
      sessionData.deviceName = deviceInfo.deviceName;
    }
    if (deviceInfo?.ipAddress !== undefined) {
      sessionData.ipAddress = deviceInfo.ipAddress;
    }
    if (deviceInfo?.userAgent !== undefined) {
      sessionData.userAgent = deviceInfo.userAgent;
    }
    
    await this.sessionService.createSession(sessionData);

    // Update last seen
    await this.userRepo.updateLastSeen(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async login(
    username: string,
    password: string,
    deviceInfo?: {
      deviceId?: string;
      deviceType?: string;
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    // Find user
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Create session
    const sessionData: any = {
      userId: user.id,
      sessionToken: refreshToken,
      expiresAt: new Date(Date.now() + LIMITS.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000),
    };
    
    if (deviceInfo?.deviceId !== undefined) {
      sessionData.deviceId = deviceInfo.deviceId;
    }
    if (deviceInfo?.deviceType !== undefined) {
      sessionData.deviceType = deviceInfo.deviceType;
    }
    if (deviceInfo?.deviceName !== undefined) {
      sessionData.deviceName = deviceInfo.deviceName;
    }
    if (deviceInfo?.ipAddress !== undefined) {
      sessionData.ipAddress = deviceInfo.ipAddress;
    }
    if (deviceInfo?.userAgent !== undefined) {
      sessionData.userAgent = deviceInfo.userAgent;
    }
    
    await this.sessionService.createSession(sessionData);

    // Update last seen
    await this.userRepo.updateLastSeen(user.id);

    logger.info(`User logged in: ${username}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { userId: string };

      // Check if session exists and is valid
      const session = await this.sessionService.findByToken(refreshToken);
      if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
        throw new Error('Invalid session');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(payload.userId);

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, sessionToken?: string) {
    if (sessionToken) {
      await this.sessionService.invalidateSession(sessionToken);
    } else {
      await this.sessionService.invalidateAllUserSessions(userId);
    }

    logger.info(`User logged out: ${userId}`);
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' },
      config.JWT_SECRET,
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.JWT_REFRESH_SECRET,
      { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
    );
  }

  async verifyAccessToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}
