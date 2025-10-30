"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.chatSchema = exports.messageSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    password: zod_1.z.string().min(8).max(128),
});
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
exports.messageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(10000),
    contentType: zod_1.z.enum(['text', 'image', 'system']).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    replyToId: zod_1.z.string().uuid().optional(),
});
exports.chatSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    participantIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(300),
});
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validate = validate;
//# sourceMappingURL=validation.middleware.js.map