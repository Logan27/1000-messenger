import { Socket } from 'socket.io';
import { UserRepository } from '../../repositories/user.repository';
export declare class PresenceHandler {
    private userRepo;
    constructor(userRepo: UserRepository);
    setupHandlers(socket: Socket): void;
}
//# sourceMappingURL=presence.handler.d.ts.map