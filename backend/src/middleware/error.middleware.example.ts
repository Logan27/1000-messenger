/**
 * Error Middleware Usage Examples
 * 
 * This file demonstrates how to use the error handling middleware
 * and custom error classes in controllers and services.
 */

import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  asyncHandler,
} from './error.middleware';

// ============================================================================
// Example 1: Using custom error classes in services
// ============================================================================

class ExampleService {
  async getUser(userId: string) {
    // Check if user exists
    const user = null; // simulated database query
    
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }
    
    return user;
  }

  async createUser(username: string, requesterId: string) {
    // Check if username is taken
    const existingUser = null; // simulated database query
    
    if (existingUser) {
      throw new ConflictError('Username already taken', {
        field: 'username',
        value: username,
      });
    }

    // Check permissions
    if (!requesterId) {
      throw new UnauthorizedError('Authentication required');
    }

    return { id: '123', username };
  }

  async updateUser(userId: string, requesterId: string, data: any) {
    // Authorization check
    if (userId !== requesterId) {
      throw new ForbiddenError('Cannot update another user');
    }

    // Validation check
    if (data.age && data.age < 0) {
      throw new BadRequestError('Age must be a positive number', {
        field: 'age',
        value: data.age,
      });
    }

    return { id: userId, ...data };
  }
}

// ============================================================================
// Example 2: Traditional controller with try-catch
// ============================================================================

// Example controller class - demonstrates error handling patterns
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ExampleController {
  constructor(private service: ExampleService) {}

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.service.getUser(req.params['id'] as string);
      res.json(user);
    } catch (error) {
      // Error middleware automatically handles conversion
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = req.body;
      const requesterId = (req as any).user?.userId;
      
      const user = await this.service.createUser(username, requesterId);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================================
// Example 3: Using asyncHandler to eliminate try-catch
// ============================================================================

const service = new ExampleService();

export const getUserHandler = asyncHandler(async (req, res) => {
  const user = await service.getUser(req.params['id'] as string);
  res.json(user);
  // No try-catch needed - asyncHandler catches and passes to error middleware
});

export const createUserHandler = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const requesterId = (req as any).user?.userId;
  
  const user = await service.createUser(username, requesterId);
  res.status(201).json(user);
});

export const updateUserHandler = asyncHandler(async (req, res) => {
  const userId = req.params['id'] as string;
  const requesterId = (req as any).user?.userId;
  
  const user = await service.updateUser(userId, requesterId, req.body);
  res.json(user);
});

// ============================================================================
// Example 4: Throwing errors based on business logic
// ============================================================================

export const complexBusinessLogic = asyncHandler(async (req, res) => {
  const { action } = req.body;
  
  // Check resource exists
  const resource = null; // simulated query
  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  
  // Check permissions
  const hasPermission = false; // simulated permission check
  if (!hasPermission) {
    throw new ForbiddenError('Insufficient permissions for this action');
  }
  
  // Validate action
  const validActions = ['read', 'write', 'delete'];
  if (!validActions.includes(action)) {
    throw new ValidationError('Invalid action', {
      field: 'action',
      message: `Action must be one of: ${validActions.join(', ')}`,
      provided: action,
    });
  }
  
  res.json({ success: true });
});

// ============================================================================
// Example 5: Using base AppError for custom error codes
// ============================================================================

export const customErrorExample = asyncHandler(async (req, res) => {
  const { operationType } = req.params;
  
  if (operationType === 'maintenance') {
    throw new AppError(
      'System is under maintenance',
      503,
      'MAINTENANCE_MODE',
      {
        estimatedDowntime: '30 minutes',
        nextCheckTime: new Date(Date.now() + 30 * 60 * 1000),
      }
    );
  }
  
  res.json({ success: true });
});

// ============================================================================
// Example Response Formats
// ============================================================================

/*
// NotFoundError response (404):
{
  "error": "NOT_FOUND",
  "message": "User with ID 123 not found",
  "statusCode": 404
}

// ConflictError with details (409):
{
  "error": "CONFLICT",
  "message": "Username already taken",
  "statusCode": 409,
  "details": {
    "field": "username",
    "value": "john_doe"
  }
}

// ValidationError with field details (422):
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid action",
  "statusCode": 422,
  "details": {
    "field": "action",
    "message": "Action must be one of: read, write, delete",
    "provided": "invalid_action"
  }
}

// Custom AppError (503):
{
  "error": "MAINTENANCE_MODE",
  "message": "System is under maintenance",
  "statusCode": 503,
  "details": {
    "estimatedDowntime": "30 minutes",
    "nextCheckTime": "2025-10-31T12:30:00.000Z"
  }
}

// Development mode includes additional context:
{
  "error": "INTERNAL_ERROR",
  "message": "Database connection failed",
  "statusCode": 500,
  "stack": "Error: Database connection failed\n    at ...",
  "path": "/api/users",
  "method": "POST",
  "timestamp": "2025-10-31T12:00:00.000Z"
}
*/
