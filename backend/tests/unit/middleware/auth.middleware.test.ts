import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthenticate } from '../../../src/middleware/auth.middleware';
import * as jwtUtil from '../../../src/utils/jwt.util';

jest.mock('../../../src/utils/jwt.util');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
      get: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and set user in request', async () => {
      // Arrange
      const token = 'valid-token';
      const userId = 'user-id-123';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({ userId, type: 'access' });

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(jwtUtil.extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${token}`);
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockRequest).toHaveProperty('user');
      expect((mockRequest as any).user).toMatchObject({ userId });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      mockRequest.headers = {};
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('token'),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue('invalid-token');
      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new jwtUtil.JwtInvalidError('Invalid token');
      });

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue('expired-token');
      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new jwtUtil.JwtExpiredError('Token expired');
      });

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate valid token if provided', async () => {
      // Arrange
      const token = 'valid-token';
      const userId = 'user-id-123';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(token);
      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({ userId, type: 'access' });

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect((mockRequest as any).user).toMatchObject({ userId });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without authentication if no token provided', async () => {
      // Arrange
      mockRequest.headers = {};
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest).not.toHaveProperty('user');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication if token is invalid', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      (jwtUtil.extractTokenFromHeader as jest.Mock).mockReturnValue('invalid-token');
      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest).not.toHaveProperty('user');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
