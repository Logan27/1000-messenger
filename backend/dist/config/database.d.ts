import { Pool } from 'pg';
export declare const pool: Pool;
export declare const readPool: Pool;
export declare function testConnection(): Promise<boolean>;
export declare function closeConnections(): Promise<void>;
//# sourceMappingURL=database.d.ts.map