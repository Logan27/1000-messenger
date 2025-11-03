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

export {};
