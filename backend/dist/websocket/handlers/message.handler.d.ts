import { Socket } from 'socket.io';
import { MessageService } from '../../services/message.service';
export declare class MessageHandler {
    private messageService;
    constructor(messageService: MessageService);
    setupHandlers(socket: Socket): void;
}
//# sourceMappingURL=message.handler.d.ts.map