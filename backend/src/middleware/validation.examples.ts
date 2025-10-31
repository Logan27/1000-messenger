/**
 * Validation Middleware Usage Examples
 *
 * This file demonstrates various usage patterns for the validation middleware.
 * These are example patterns - not meant to be executed directly.
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
  createValidator,
  createUuidParamsSchema,
  createPaginationSchema,
  validateAsync,
  registerSchema,
  loginSchema,
  messageSchema,
} from './validation.middleware';
import { userUpdateSchema, userSearchSchema, paginationSchema } from '../utils/validators.util';

const exampleRouter = Router();

// ============================================================================
// EXAMPLE 1: Basic Body Validation
// ============================================================================

// Validate POST request body
exampleRouter.post('/register', validate(registerSchema), async (req, res) => {
  // req.body is now validated and typed
  const { username, password, displayName } = req.body;
  res.json({ message: 'User registered', username });
});

// Alternative: Use convenience wrapper
exampleRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  const { username, password } = req.body;
  res.json({ message: 'User logged in', username });
});

// ============================================================================
// EXAMPLE 2: Query Parameter Validation
// ============================================================================

// Validate GET request query parameters
exampleRouter.get('/users/search', validate(userSearchSchema, 'query'), async (req, res) => {
  const { query, limit } = req.query;
  res.json({ results: [], query, limit });
});

// Alternative: Use convenience wrapper
exampleRouter.get('/users', validateQuery(paginationSchema), async (req, res) => {
  const { limit, offset } = req.query;
  res.json({ users: [], limit, offset });
});

// ============================================================================
// EXAMPLE 3: Route Parameter Validation
// ============================================================================

// Validate UUID route parameters
exampleRouter.get(
  '/users/:userId',
  validateParams(createUuidParamsSchema('userId')),
  async (req, res) => {
    const { userId } = req.params;
    res.json({ userId, user: {} });
  }
);

// Validate multiple route parameters
exampleRouter.get(
  '/chats/:chatId/messages/:messageId',
  validateParams(createUuidParamsSchema('chatId', 'messageId')),
  async (req, res) => {
    const { chatId, messageId } = req.params;
    res.json({ chatId, messageId, message: {} });
  }
);

// ============================================================================
// EXAMPLE 4: Multiple Validation Targets
// ============================================================================

// Validate params, body, and query together
exampleRouter.put(
  '/chats/:chatId/messages/:messageId',
  validateMultiple({
    params: createUuidParamsSchema('chatId', 'messageId'),
    body: messageSchema,
    query: paginationSchema,
  }),
  async (req, res) => {
    const { chatId, messageId } = req.params;
    const { content } = req.body;
    const { limit } = req.query;
    res.json({ chatId, messageId, content, limit });
  }
);

// ============================================================================
// EXAMPLE 5: Custom Validation Options
// ============================================================================

// Strict mode - reject unknown fields
exampleRouter.post(
  '/users/strict',
  validate(userUpdateSchema, 'body', {
    stripUnknown: false, // Reject unknown fields
    logErrors: true, // Log validation errors
    errorPrefix: 'User update failed', // Custom error message
  }),
  async (req, res) => {
    const { displayName, avatarUrl } = req.body;
    res.json({ displayName, avatarUrl });
  }
);

// Abort on first error (faster for complex schemas)
exampleRouter.post(
  '/data',
  validate(
    z.object({
      field1: z.string(),
      field2: z.number(),
      field3: z.boolean(),
    }),
    'body',
    { abortEarly: true }
  ),
  async (req, res) => {
    res.json({ data: req.body });
  }
);

// ============================================================================
// EXAMPLE 6: Custom Pagination
// ============================================================================

// Create pagination schema with custom limits
const largePaginationSchema = createPaginationSchema(200, 100);

exampleRouter.get('/large-dataset', validateQuery(largePaginationSchema), async (req, res) => {
  const { limit, offset } = req.query;
  res.json({ items: [], limit, offset });
});

// ============================================================================
// EXAMPLE 7: Reusable Validator with Preset Options
// ============================================================================

// Create validator with preset options for strict validation across multiple routes
const strictValidator = createValidator({
  stripUnknown: false,
  logErrors: true,
  errorPrefix: 'Strict validation failed',
});

exampleRouter.post(
  '/api/data1',
  strictValidator(
    z.object({
      name: z.string(),
      value: z.number(),
    })
  ),
  async (req, res) => {
    res.json(req.body);
  }
);

exampleRouter.post(
  '/api/data2',
  strictValidator(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  async (req, res) => {
    res.json(req.body);
  }
);

// ============================================================================
// EXAMPLE 8: Async Validation (Business Logic)
// ============================================================================

// Simulate a user repository for async validation
const mockUserRepo = {
  findByUsername: async (username: string) => {
    // Simulate database lookup
    return username === 'existinguser' ? { id: '123', username } : null;
  },
};

// Async validation with database lookup
exampleRouter.post(
  '/register-unique',
  validateAsync(async req => {
    // First validate the basic schema
    const data = registerSchema.parse(req.body);

    // Then perform async business logic validation
    const existingUser = await mockUserRepo.findByUsername(data.username);
    if (existingUser) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['username'],
          message: 'Username is already taken',
        },
      ]);
    }

    return data;
  }),
  async (req, res) => {
    const { username } = req.body;
    res.json({ message: 'User registered with unique username', username });
  }
);

// ============================================================================
// EXAMPLE 9: Complex Schema with Refinements
// ============================================================================

// Custom validation schema with complex rules
const complexSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
    email: z.string().email(),
    age: z.number().int().min(18).max(120),
    termsAccepted: z.boolean(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(data => data.termsAccepted === true, {
    message: 'You must accept the terms and conditions',
    path: ['termsAccepted'],
  });

exampleRouter.post('/register-complex', validate(complexSchema), async (req, res) => {
  const { email, age } = req.body;
  res.json({ message: 'Registration successful', email, age });
});

// ============================================================================
// EXAMPLE 10: Combining with Other Middleware
// ============================================================================

// Example: Combining authentication and validation
import { authMiddleware } from './auth.middleware';
import { messageRateLimit } from './rate-limit.middleware';

exampleRouter.post(
  '/chats/:chatId/messages',
  authMiddleware.authenticate, // First: Authenticate user
  validateParams(createUuidParamsSchema('chatId')), // Second: Validate params
  validateBody(messageSchema), // Third: Validate body
  messageRateLimit, // Fourth: Rate limiting
  async (req, res) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { content } = req.body;

    res.json({
      message: 'Message sent',
      userId,
      chatId,
      content,
    });
  }
);

// ============================================================================
// EXAMPLE 11: Optional Fields and Defaults
// ============================================================================

const optionalFieldsSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  age: z.number().int().optional().default(18),
  tags: z.array(z.string()).optional().default([]),
});

exampleRouter.post('/users/with-defaults', validate(optionalFieldsSchema), async (req, res) => {
  const { name, email, age, tags } = req.body;
  // age will be 18 if not provided
  // tags will be [] if not provided
  res.json({ name, email, age, tags });
});

// ============================================================================
// EXAMPLE 12: Array and Nested Object Validation
// ============================================================================

const nestedSchema = z.object({
  title: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  tags: z.array(z.string()).min(1).max(10),
  metadata: z
    .object({
      views: z.number().int().min(0),
      likes: z.number().int().min(0),
    })
    .optional(),
});

exampleRouter.post('/posts', validate(nestedSchema), async (req, res) => {
  const { title, author, tags, metadata } = req.body;
  res.json({ title, author, tags, metadata });
});

// Note: This file is for documentation purposes only
export default exampleRouter;
