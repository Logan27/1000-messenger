import { Pool, QueryResult } from 'pg';
export declare const pool: Pool;
export declare const readPool: Pool;
export declare function testConnection(): Promise<boolean>;
export declare function getPoolStats(): {
    primary: {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
    replica: {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
};
export declare function queryWithRetry<T = any>(queryText: string, values?: any[], useReadPool?: boolean, maxRetries?: number): Promise<QueryResult<T>>;
export declare function checkReplicaHealth(): Promise<boolean>;
export declare function closeConnections(): Promise<void>;
//# sourceMappingURL=database.d.ts.map