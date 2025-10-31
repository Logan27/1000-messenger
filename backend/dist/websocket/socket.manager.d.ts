import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { MessageService } from '../services/message.service';
import { UserRepository } from '../repositories/user.repository';
import { ChatRepository } from '../repositories/chat.repository';
export declare class SocketManager {
    private authService;
    private sessionService;
    private userRepo;
    private chatRepo;
    private io;
    private messageHandler?;
    private presenceHandler;
    private typingHandler;
    private readReceiptHandler?;
    private socketAuthMiddleware;
    private initialized;
    constructor(httpServer: HttpServer, authService: AuthService, sessionService: SessionService, userRepo: UserRepository, chatRepo: ChatRepository);
    initializeMessageHandlers(messageService: MessageService): void;
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
    getStats(): Promise<{
        totalConnections: number;
        initialized: boolean;
    }>;
    broadcast(event: string, data: any): void;
    getChatUsers(chatId: string): Promise<string[]>;
    isUserOnline(userId: string): Promise<boolean>;
    disconnectUser(userId: string): Promise<void>;
    emitToUser(userId: string, event: string, data: any): void;
}
export declare function setSocketManager(instance: SocketManager): void;
export declare function getSocketManager(): SocketManager | null;
//# sourceMappingURL=socket.manager.d.ts.map