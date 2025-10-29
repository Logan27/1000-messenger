import { Socket } from 'socket.io';
import { MessageService } from '../../services/message.service';
export declare class ReadReceiptHandler {
    private messageService;
    constructor(messageService: MessageService);
    setupHandlers(socket: Socket): void;
}
//# sourceMappingURL=read-receipt.handler.d.ts.map