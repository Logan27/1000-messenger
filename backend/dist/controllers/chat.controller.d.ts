import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getUserChats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getChatById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getChatBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createDirectChat: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createGroupChat: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateChat: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    addParticipants: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    removeParticipant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    leaveChat: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteChat: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=chat.controller.d.ts.map