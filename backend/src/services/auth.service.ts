import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { LIMITS } from '../config/constants';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { logger } from '../utils/logger.util';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private sessionService: SessionService
  ) {}

  async register(username: string, password: string) {
    // Validate username
    if (username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }

    // Check if user exists
    const existingUser = await this.userRepo.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.userRepo.create({
      username,
      passwordHash,
      displayName: username,
    });

    logger.info(`User registered: ${username}`);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
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
    await this.sessionService.createSession({
      userId: user.id,
      sessionToken: refreshToken,
      deviceId: deviceInfo?.deviceId,
      deviceType: deviceInfo?.deviceType,
      deviceName: deviceInfo?.deviceName,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      expiresAt: new Date(Date.now() + LIMITS.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000),
    });

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
      { expiresIn: LIMITS.ACCESS_TOKEN_DURATION }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.JWT_REFRESH_SECRET,
      { expiresIn: LIMITS.REFRESH_TOKEN_DURATION }
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
