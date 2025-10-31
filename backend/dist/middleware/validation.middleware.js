"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.chatSchema = exports.messageSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const validators_util_1 = require("../utils/validators.util");
exports.registerSchema = validators_util_1.userRegistrationSchema;
exports.loginSchema = validators_util_1.userLoginSchema;
exports.messageSchema = validators_util_1.createMessageSchema;
exports.chatSchema = validators_util_1.createGroupChatSchema;
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validate = validate;
//# sourceMappingURL=validation.middleware.js.map