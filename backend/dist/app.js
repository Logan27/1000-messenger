"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const security_middleware_1 = require("./middleware/security.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const chat_routes_1 = require("./routes/chat.routes");
const message_routes_1 = require("./routes/message.routes");
const contact_routes_1 = require("./routes/contact.routes");
const health_routes_1 = require("./routes/health.routes");
const env_1 = require("./config/env");
const logger_util_1 = require("./utils/logger.util");
function createApp() {
    const app = (0, express_1.default)();
    app.use(security_middleware_1.securityHeaders);
    app.use((0, cors_1.default)({
        origin: env_1.config.FRONTEND_URL,
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    app.use('/api/', security_middleware_1.apiRateLimit);
    app.use('/health', health_routes_1.healthRoutes);
    app.use('/api/auth', auth_routes_1.authRoutes);
    app.use('/api/users', user_routes_1.userRoutes);
    app.use('/api/chats', chat_routes_1.chatRoutes);
    app.use('/api/messages', message_routes_1.messageRoutes);
    app.use('/api/contacts', contact_routes_1.contactRoutes);
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    logger_util_1.logger.info('Express app initialized');
    return app;
}
//# sourceMappingURL=app.js.map