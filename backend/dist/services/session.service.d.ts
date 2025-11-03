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
export interface SessionMetadata {
    userId: string;
    deviceType?: string | undefined;
    deviceName?: string | undefined;
    lastActivity: Date;
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
    findById(sessionId: string): Promise<Session | null>;
    getActiveUserSessions(userId: string): Promise<Session[]>;
    getSessionCount(userId: string): Promise<number>;
    updateSocketId(sessionId: string, socketId: string): Promise<void>;
    invalidateSession(sessionToken: string): Promise<void>;
    invalidateAllUserSessions(userId: string): Promise<void>;
    updateLastActivity(sessionToken: string): Promise<void>;
    extendSession(sessionToken: string, newExpiryDate: Date): Promise<void>;
    cleanupExpiredSessions(): Promise<number>;
    getSessionMetadata(sessionToken: string): Promise<SessionMetadata | null>;
    private cacheSession;
    private cacheUserSessions;
    private addSessionToUserSet;
    private removeCachedSession;
    private getCachedSessionByToken;
    private getCachedSessionById;
    private getSessionTokenKey;
    private getSessionIdKey;
    private getUserSessionsKey;
    private mapRow;
}
//# sourceMappingURL=session.service.d.ts.map