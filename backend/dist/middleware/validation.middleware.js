"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAsync = exports.createPaginationSchema = exports.createUuidParamsSchema = exports.createValidator = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validateMultiple = exports.validate = exports.chatSchema = exports.messageSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const validators_util_1 = require("../utils/validators.util");
const logger_util_1 = require("../utils/logger.util");
exports.registerSchema = validators_util_1.userRegistrationSchema;
exports.loginSchema = validators_util_1.userLoginSchema;
exports.messageSchema = validators_util_1.createMessageSchema;
exports.chatSchema = validators_util_1.createGroupChatSchema;
function formatZodError(error, prefix) {
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
const validate = (schema, target = 'body', options = {}) => {
    const { stripUnknown = true, abortEarly = false, errorPrefix, logErrors = false } = options;
    return (req, res, next) => {
        try {
            const data = req[target];
            const parseOptions = {
                errorMap: abortEarly
                    ? undefined
                    : (issue, ctx) => ({
                        message: ctx.defaultError,
                    }),
            };
            let validatedData;
            if (stripUnknown) {
                validatedData = schema.parse(data, parseOptions);
            }
            else {
                if ('strict' in schema && typeof schema.strict === 'function') {
                    validatedData = schema.strict().parse(data, parseOptions);
                }
                else {
                    validatedData = schema.parse(data, parseOptions);
                }
            }
            req[target] = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const formattedError = formatZodError(error, errorPrefix);
                if (logErrors) {
                    logger_util_1.logger.warn('Validation error', {
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
            next(error);
        }
    };
};
exports.validate = validate;
const validateMultiple = (schemas, options = {}) => {
    const { stripUnknown = true, abortEarly = false, errorPrefix, logErrors = false } = options;
    return (req, res, next) => {
        try {
            const errors = [];
            for (const [target, schema] of Object.entries(schemas)) {
                try {
                    const data = req[target];
                    let validatedData;
                    if (stripUnknown) {
                        validatedData = schema.parse(data);
                    }
                    else {
                        if ('strict' in schema && typeof schema.strict === 'function') {
                            validatedData = schema.strict().parse(data);
                        }
                        else {
                            validatedData = schema.parse(data);
                        }
                    }
                    req[target] = validatedData;
                }
                catch (error) {
                    if (error instanceof zod_1.z.ZodError) {
                        errors.push(error);
                        if (abortEarly)
                            break;
                    }
                    else {
                        throw error;
                    }
                }
            }
            if (errors.length > 0) {
                const combinedErrors = errors.reduce((acc, err) => {
                    acc.errors.push(...err.errors);
                    return acc;
                }, new zod_1.z.ZodError([]));
                const formattedError = formatZodError(combinedErrors, errorPrefix);
                if (logErrors) {
                    logger_util_1.logger.warn('Validation error (multiple targets)', {
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
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateMultiple = validateMultiple;
const validateBody = (schema, options) => (0, exports.validate)(schema, 'body', options);
exports.validateBody = validateBody;
const validateQuery = (schema, options) => (0, exports.validate)(schema, 'query', options);
exports.validateQuery = validateQuery;
const validateParams = (schema, options) => (0, exports.validate)(schema, 'params', options);
exports.validateParams = validateParams;
const createValidator = (defaultOptions) => {
    return (schema, target = 'body', overrideOptions) => (0, exports.validate)(schema, target, { ...defaultOptions, ...overrideOptions });
};
exports.createValidator = createValidator;
const createUuidParamsSchema = (...paramNames) => {
    const shape = {};
    for (const name of paramNames) {
        shape[name] = zod_1.z.string().uuid(`${name} must be a valid UUID`);
    }
    return zod_1.z.object(shape);
};
exports.createUuidParamsSchema = createUuidParamsSchema;
const createPaginationSchema = (maxLimit = 100, defaultLimit = 50) => {
    return zod_1.z.object({
        limit: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : defaultLimit))
            .pipe(zod_1.z.number().int().positive().max(maxLimit, `Limit must not exceed ${maxLimit}`)),
        offset: zod_1.z
            .string()
            .optional()
            .transform(val => (val ? parseInt(val, 10) : 0))
            .pipe(zod_1.z.number().int().min(0, 'Offset must be non-negative')),
    });
};
exports.createPaginationSchema = createPaginationSchema;
const validateAsync = (validatorFn, target = 'body', options = {}) => {
    const { errorPrefix, logErrors = false } = options;
    return async (req, res, next) => {
        try {
            const validatedData = await validatorFn(req);
            req[target] = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const formattedError = formatZodError(error, errorPrefix);
                if (logErrors) {
                    logger_util_1.logger.warn('Async validation error', {
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
            next(error);
        }
    };
};
exports.validateAsync = validateAsync;
//# sourceMappingURL=validation.middleware.js.map