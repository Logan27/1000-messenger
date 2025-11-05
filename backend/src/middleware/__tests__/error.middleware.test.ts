/**
 * Error Middleware Tests
 * 
 * Tests for error handling middleware functionality
 */

import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  asyncHandler,
} from '../error.middleware';

// Mock dependencies
jest.mock('../../utils/logger.util', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../../config/env', () => ({
  config: {
    NODE_ENV: 'test',
  },
}));

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      path: '/test',
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  describe('Custom Error Classes', () => {
    test('AppError should have correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', { detail: 'value' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ detail: 'value' });
      expect(error.isOperational).toBe(true);
    });

    test('BadRequestError should have status 400', () => {
      const error = new BadRequestError('Bad input');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Bad input');
    });

    test('UnauthorizedError should have status 401', () => {
      const error = new UnauthorizedError('Not authenticated');
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    test('ForbiddenError should have status 403', () => {
      const error = new ForbiddenError('No permission');
      
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    test('NotFoundError should have status 404', () => {
      const error = new NotFoundError('Not found');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    test('ConflictError should have status 409', () => {
      const error = new ConflictError('Already exists');
      
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    test('ValidationError should have status 422', () => {
      const error = new ValidationError('Invalid data');
      
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('RateLimitError should have status 429', () => {
      const error = new RateLimitError('Too many requests');
      
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('InternalServerError should have status 500', () => {
      const error = new InternalServerError('Server error');
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    test('ServiceUnavailableError should have status 503', () => {
      const error = new ServiceUnavailableError('Service down');
      
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('errorHandler', () => {
    test('should handle AppError correctly', () => {
      const error = new NotFoundError('User not found');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'User not found',
        statusCode: 404,
      });
    });

    test('should include details when present', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'username', message: 'Too short' },
      ]);
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 422,
        details: [{ field: 'username', message: 'Too short' }],
      });
    });

    test('should convert generic Error to InternalServerError', () => {
      const error = new Error('Unexpected error');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INTERNAL_ERROR',
          statusCode: 500,
        })
      );
    });

    test('should handle "Invalid credentials" message as UnauthorizedError', () => {
      const error = new Error('Invalid credentials');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'UNAUTHORIZED',
        message: 'Invalid credentials',
        statusCode: 401,
      });
    });

    test('should handle "Username already taken" as ConflictError', () => {
      const error = new Error('Username already taken');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'CONFLICT',
        message: 'Username already taken',
        statusCode: 409,
      });
    });

    test('should handle errors with "not found" in message', () => {
      const error = new Error('User not found');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    test('should handle errors with "not a participant" as ForbiddenError', () => {
      const error = new Error('User is not a participant');
      
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('notFoundHandler', () => {
    test('should return 404 with route information', () => {
      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'Route not found',
        statusCode: 404,
        path: '/test',
        method: 'GET',
      });
    });
  });

  describe('asyncHandler', () => {
    test('should call the wrapped function', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(mockHandler);

      await wrapped(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockHandler).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockNext
      );
    });

    test('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const mockHandler = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(mockHandler);

      await wrapped(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should catch sync errors and pass to next', async () => {
      const mockHandler = jest.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      const wrapped = asyncHandler(mockHandler);

      await wrapped(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0]?.[0]).toBeInstanceOf(Error);
      expect((mockNext.mock.calls[0]?.[0] as any)?.message).toBe('Sync error');
    });
  });
});
