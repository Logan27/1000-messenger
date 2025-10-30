import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  userRegistrationSchema,
  userLoginSchema,
  createMessageSchema,
  createGroupChatSchema,
} from '../utils/validators.util';

// Re-export schemas from validators.util for backward compatibility
export const registerSchema = userRegistrationSchema;
export const loginSchema = userLoginSchema;
export const messageSchema = createMessageSchema;
export const chatSchema = createGroupChatSchema;

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
