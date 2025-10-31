export declare enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh"
}
export interface JwtPayload {
    userId: string;
    type: TokenType;
    iat?: number;
    exp?: number;
    nbf?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class JwtError extends Error {
    constructor(message: string);
}
export declare class JwtExpiredError extends JwtError {
    constructor(message?: string);
}
export declare class JwtInvalidError extends JwtError {
    constructor(message?: string);
}
export declare class JwtMalformedError extends JwtError {
    constructor(message?: string);
}
export declare function generateAccessToken(userId: string, additionalClaims?: Record<string, any>): string;
export declare function generateRefreshToken(userId: string, additionalClaims?: Record<string, any>): string;
export declare function generateTokenPair(userId: string, additionalClaims?: Record<string, any>): TokenPair;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): JwtPayload;
export declare function decodeToken(token: string): JwtPayload | null;
export declare function extractTokenFromHeader(authHeader?: string): string | null;
export declare function isTokenExpired(token: string): boolean;
export declare function getTokenExpiration(token: string): Date | null;
export declare function refreshAccessToken(refreshToken: string): string;
export declare function isValidTokenFormat(token: string): boolean;
//# sourceMappingURL=jwt.util.d.ts.map