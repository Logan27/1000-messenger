import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    login: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    logout: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
}
//# sourceMappingURL=auth.controller.d.ts.map