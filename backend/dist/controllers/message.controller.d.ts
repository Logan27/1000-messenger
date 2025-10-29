import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
export declare class MessageController {
    private messageService;
    constructor(messageService: MessageService);
    sendMessage: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getMessages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    editMessage: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    markAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    addReaction: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    removeReaction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=message.controller.d.ts.map