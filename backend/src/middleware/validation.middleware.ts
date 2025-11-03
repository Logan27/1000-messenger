import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  userRegistrationSchema,
  userLoginSchema,
  createMessageSchema,
  createGroupChatSchema,
} from '../utils/validators.util';
import { logger } from '../utils/logger.util';

// Re-export schemas from validators.util for backward compatibility
export const registerSchema = userRegistrationSchema;
export const loginSchema = userLoginSchema;
export const messageSchema = createMessageSchema;
export const chatSchema = createGroupChatSchema;

/**
 * Validation target specifies which part of the request to validate
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation options for customizing behavior
 */
export interface ValidationOptions {
  /** Whether to strip unknown keys from the validated data (default: true) */
  stripUnknown?: boolean;
  /** Whether to abort validation on first error (default: false) */
  abortEarly?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
  /** Whether to log validation errors (default: false) */
  logErrors?: boolean;
}

/**
 * Formatted validation error response
 */
export interface ValidationErrorResponse {
  error: string;
  details: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Schema configuration for validating multiple request parts
 */
export interface ValidationSchemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

/**
 * Format Zod errors into user-friendly messages
 */
function formatZodError(error: z.ZodError, prefix?: string): ValidationErrorResponse {
  const details = error.errors.map(err => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    code: err.code,
  }));

  return {
    error: prefix || 'Validation failed',
    details,
  };
}

/**
 * Validate a single part of the request (body, query, or params)
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of request to validate (default: 'body')
 * @param options - Validation options
 *
 * @example
 * // Validate request body
 * router.post('/users', validate(userRegistrationSchema), handler);
 *
 * @example
 * // Validate query parameters
 * router.get('/users', validate(userSearchSchema, 'query'), handler);
 *
 * @example
 * // Validate route parameters
 * router.get('/users/:userId', validate(uuidParamSchema, 'params'), handler);
 */
export const validate = (
  schema: z.ZodSchema,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) => {
  const { stripUnknown = true, abortEarly = false, errorPrefix, logErrors = false } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get the data to validate based on target
      const data = req[target];

      // Configure parse options
      const parseOptions = {
        errorMap: abortEarly
          ? undefined
          : (_issue: z.ZodIssueOptionalMessage, ctx: z.ErrorMapCtx) => ({
              message: ctx.defaultError,
            }),
      };

      // Validate the data - handle strict mode differently based on schema type
      let validatedData: any;
      if (stripUnknown) {
        validatedData = schema.parse(data, parseOptions);
      } else {
        // For strict mode, we want to reject unknown keys
        // This is achieved by using passthrough: false implicitly in zod objects
        if ('strict' in schema && typeof (schema as any).strict === 'function') {
          validatedData = (schema as any).strict().parse(data, parseOptions);
        } else {
          // If strict is not available on this schema type, just use regular parse
          validatedData = schema.parse(data, parseOptions);
        }
      }

      // Replace the request data with validated data
      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error, errorPrefix);

        if (logErrors) {
          logger.warn('Validation error', {
            target,
            path: req.path,
            method: req.method,
            errors: formattedError.details,
            ip: req.ip,
          });
        }

        res.status(400).json(formattedError);
        return;
      }

      // Unexpected error - pass to error handler
      next(error);
    }
  };
};

/**
 * Validate multiple parts of the request simultaneously
 *
 * @param schemas - Object containing schemas for body, query, and/or params
 * @param options - Validation options
 *
 * @example
 * // Validate body and query together
 * router.post('/messages',
 *   validateMultiple({
 *     body: createMessageSchema,
 *     query: paginationSchema
 *   }),
 *   handler
 * );
 *
 * @example
 * // Validate all three parts
 * router.put('/chats/:chatId/messages',
 *   validateMultiple({
 *     params: z.object({ chatId: z.string().uuid() }),
 *     body: updateMessageSchema,
 *     query: optionsSchema
 *   }),
 *   handler
 * );
 */
export const validateMultiple = (schemas: ValidationSchemas, options: ValidationOptions = {}) => {
  const { stripUnknown = true, abortEarly = false, errorPrefix, logErrors = false } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: z.ZodError[] = [];

      // Validate each specified part
      for (const [target, schema] of Object.entries(schemas) as Array<
        [ValidationTarget, z.ZodSchema]
      >) {
        try {
          const data = req[target];
          let validatedData: any;
          if (stripUnknown) {
            validatedData = schema.parse(data);
          } else {
            // For strict mode, we want to reject unknown keys
            if ('strict' in schema && typeof (schema as any).strict === 'function') {
              validatedData = (schema as any).strict().parse(data);
            } else {
              validatedData = schema.parse(data);
            }
          }
          req[target] = validatedData;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(error);
            if (abortEarly) break;
          } else {
            throw error;
          }
        }
      }

      // If there were validation errors, combine and return them
      if (errors.length > 0) {
        const combinedErrors: z.ZodError = errors.reduce((acc, err) => {
          acc.errors.push(...err.errors);
          return acc;
        }, new z.ZodError([]));

        const formattedError = formatZodError(combinedErrors, errorPrefix);

        if (logErrors) {
          logger.warn('Validation error (multiple targets)', {
            path: req.path,
            method: req.method,
            errors: formattedError.details,
            ip: req.ip,
          });
        }

        res.status(400).json(formattedError);
        return;
      }

      next();
    } catch (error) {
      // Unexpected error - pass to error handler
      next(error);
    }
  };
};

/**
 * Validate request body (convenience wrapper)
 *
 * @example
 * router.post('/login', validateBody(loginSchema), handler);
 */
export const validateBody = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'body', options);

/**
 * Validate query parameters (convenience wrapper)
 *
 * @example
 * router.get('/messages', validateQuery(paginationSchema), handler);
 */
export const validateQuery = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'query', options);

/**
 * Validate route parameters (convenience wrapper)
 *
 * @example
 * router.get('/users/:userId', validateParams(uuidParamSchema), handler);
 */
export const validateParams = (schema: z.ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'params', options);

/**
 * Create a reusable validator with preset options
 *
 * @example
 * const strictValidator = createValidator({ stripUnknown: false, logErrors: true });
 * router.post('/api/data', strictValidator(mySchema), handler);
 */
export const createValidator = (defaultOptions: ValidationOptions) => {
  return (
    schema: z.ZodSchema,
    target: ValidationTarget = 'body',
    overrideOptions?: ValidationOptions
  ) => validate(schema, target, { ...defaultOptions, ...overrideOptions });
};

/**
 * Helper to create UUID parameter validation schema
 * Commonly used for route parameters like :userId, :chatId, etc.
 *
 * @example
 * router.get('/users/:userId', validateParams(createUuidParamsSchema('userId')), handler);
 */
export const createUuidParamsSchema = (...paramNames: string[]) => {
  const shape: Record<string, z.ZodString> = {};
  for (const name of paramNames) {
    shape[name] = z.string().uuid(`${name} must be a valid UUID`);
  }
  return z.object(shape);
};

/**
 * Helper to create pagination schema with custom limits
 *
 * @example
 * const schema = createPaginationSchema(100, 50);
 * router.get('/items', validateQuery(schema), handler);
 */
export const createPaginationSchema = (maxLimit = 100, defaultLimit = 50) => {
  return z.object({
    limit: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : defaultLimit))
      .pipe(z.number().int().positive().max(maxLimit, `Limit must not exceed ${maxLimit}`)),
    offset: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : 0))
      .pipe(z.number().int().min(0, 'Offset must be non-negative')),
  });
};

/**
 * Async validation middleware for complex validation logic
 * Useful when validation requires database lookups or external API calls
 *
 * @param validatorFn - Async function that performs validation
 *
 * @example
 * router.post('/users', validateAsync(async (req) => {
 *   const schema = userSchema.refine(async (data) => {
 *     const exists = await checkUsernameExists(data.username);
 *     return !exists;
 *   }, 'Username already taken');
 *   return schema.parseAsync(req.body);
 * }), handler);
 */
export const validateAsync = (
  validatorFn: (req: Request) => Promise<any>,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) => {
  const { errorPrefix, logErrors = false } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await validatorFn(req);
      req[target] = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error, errorPrefix);

        if (logErrors) {
          logger.warn('Async validation error', {
            target,
            path: req.path,
            method: req.method,
            errors: formattedError.details,
            ip: req.ip,
          });
        }

        res.status(400).json(formattedError);
        return;
      }

      // Unexpected error - pass to error handler
      next(error);
    }
  };
};
