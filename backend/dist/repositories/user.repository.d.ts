export interface User {
    id: string;
    username: string;
    passwordHash: string;
    displayName?: string;
    avatarUrl?: string;
    status: string;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserRepository {
    create(data: Partial<User>): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    updateStatus(userId: string, status: string): Promise<void>;
    updateLastSeen(userId: string): Promise<void>;
    update(userId: string, data: Partial<User>): Promise<User>;
    search(query: string, limit?: number): Promise<User[]>;
    private mapRow;
}
//# sourceMappingURL=user.repository.d.ts.map