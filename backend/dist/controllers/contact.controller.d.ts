import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
export declare class ContactController {
    private contactService;
    constructor(contactService: ContactService);
    getContacts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPendingRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    sendRequest: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    acceptRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    rejectRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    removeContact: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    blockContact: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    unblockContact: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
//# sourceMappingURL=contact.controller.d.ts.map