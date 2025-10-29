import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
            };
        }
    }
}
export declare class AuthMiddleware {
    private authService;
    constructor(authService: AuthService);
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=auth.middleware.d.ts.map