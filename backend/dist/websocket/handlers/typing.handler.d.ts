import { Socket } from 'socket.io';
export declare class TypingHandler {
    private typingUsers;
    setupHandlers(socket: Socket): void;
    private cleanupUserTyping;
    getTypingUsers(chatId: string): string[];
}
//# sourceMappingURL=typing.handler.d.ts.map