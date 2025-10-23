import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  contentType: z.enum(['text', 'image', 'system']).optional(),
  metadata: z.record(z.any()).optional(),
  replyToId: z.string().uuid().optional(),
});

export const chatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  participantIds: z.array(z.string().uuid()).min(1).max(300),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
