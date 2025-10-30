import { Request, Response, NextFunction } from 'express';
export declare class HealthController {
    health: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    ready: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    detailed: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=health.controller.d.ts.map