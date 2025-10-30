import winston from 'winston';
export declare const logger: winston.Logger;
export declare const createChildLogger: (metadata: Record<string, any>) => winston.Logger;
export declare const logRequest: (method: string, url: string, statusCode: number, duration: number, metadata?: Record<string, any>) => void;
export declare const logQuery: (query: string, duration: number, metadata?: Record<string, any>) => void;
export declare const logWebSocket: (event: string, userId?: string, metadata?: Record<string, any>) => void;
export default logger;
//# sourceMappingURL=logger.util.d.ts.map