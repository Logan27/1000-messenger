export interface Session {
    id: string;
    userId: string;
    sessionToken: string;
    deviceId?: string;
    deviceType?: string;
    deviceName?: string;
    socketId?: string;
    ipAddress?: string;
    userAgent?: string;
    isActive: boolean;
    lastActivity: Date;
    createdAt: Date;
    expiresAt: Date;
}
export declare class SessionService {
    createSession(data: {
        userId: string;
        sessionToken: string;
        deviceId?: string;
        deviceType?: string;
        deviceName?: string;
        ipAddress?: string;
        userAgent?: string;
        expiresAt: Date;
    }): Promise<Session>;
    findByToken(token: string): Promise<Session | null>;
    getActiveUserSessions(userId: string): Promise<Session[]>;
    updateSocketId(sessionId: string, socketId: string): Promise<void>;
    invalidateSession(sessionToken: string): Promise<void>;
    invalidateAllUserSessions(userId: string): Promise<void>;
    updateLastActivity(sessionToken: string): Promise<void>;
    private cacheSession;
    private getCachedSession;
    private mapRow;
}
//# sourceMappingURL=session.service.d.ts.map