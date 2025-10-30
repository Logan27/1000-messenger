import { Socket } from 'socket.io';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
export declare class SocketAuthMiddleware {
    private authService;
    private sessionService;
    constructor(authService: AuthService, sessionService: SessionService);
    authenticate(socket: Socket, next: (err?: Error) => void): Promise<void>;
}
//# sourceMappingURL=socket-auth.middleware.d.ts.map