import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt.util';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                tokenPayload?: JwtPayload;
            };
        }
    }
}
export declare class AuthMiddleware {
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const authMiddleware: AuthMiddleware;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map