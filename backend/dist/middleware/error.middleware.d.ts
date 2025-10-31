import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string, details?: any);
}
export declare const errorHandler: (error: Error, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map