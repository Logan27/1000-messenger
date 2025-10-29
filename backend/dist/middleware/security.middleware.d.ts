export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const messageRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sanitizeContent: (content: string) => string;
export declare const validateImageUpload: (req: any, res: any, next: any) => any;
//# sourceMappingURL=security.middleware.d.ts.map