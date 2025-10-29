import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { UserRepository } from '../repositories/user.repository';
export declare class SocketManager {
    private authService;
    private sessionService;
    private userRepo;
    private io;
    constructor(httpServer: HttpServer, authService: AuthService, sessionService: SessionService, userRepo: UserRepository);
    private setupRedisAdapter;
    private setupMiddleware;
    private setupConnectionHandler;
    private setupEventHandlers;
    private joinUserChats;
    broadcastToChat(chatId: string, event: string, data: any): void;
    sendToUser(userId: string, event: string, data: any): void;
    broadcastUserStatus(userId: string, status: string): void;
    addUserToChat(userId: string, chatId: string): Promise<void>;
    removeUserFromChat(userId: string, chatId: string): Promise<void>;
    private getUserChatIds;
    getIO(): SocketServer;
}
//# sourceMappingURL=socket.manager.d.ts.map