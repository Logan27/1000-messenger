import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
export declare class AuthService {
    private userRepo;
    private sessionService;
    constructor(userRepo: UserRepository, sessionService: SessionService);
    register(username: string, password: string, deviceInfo?: {
        deviceId?: string;
        deviceType?: string;
        deviceName?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            username: string;
            displayName: string | undefined;
            avatarUrl: string | undefined;
        };
    }>;
    login(username: string, password: string, deviceInfo?: {
        deviceId?: string;
        deviceType?: string;
        deviceName?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            username: string;
            displayName: string | undefined;
            avatarUrl: string | undefined;
        };
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string, sessionToken?: string): Promise<void>;
    private generateAccessToken;
    private generateRefreshToken;
    verifyAccessToken(token: string): Promise<{
        userId: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map