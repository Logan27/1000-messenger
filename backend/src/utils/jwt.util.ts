import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' }, config.JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): { userId: string } {
  return jwt.verify(token, config.JWT_SECRET) as { userId: string };
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as { userId: string };
}
