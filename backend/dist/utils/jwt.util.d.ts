export declare function generateAccessToken(userId: string): string;
export declare function generateRefreshToken(userId: string): string;
export declare function verifyAccessToken(token: string): {
    userId: string;
};
export declare function verifyRefreshToken(token: string): {
    userId: string;
};
//# sourceMappingURL=jwt.util.d.ts.map