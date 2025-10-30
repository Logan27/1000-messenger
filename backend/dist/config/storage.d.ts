import { S3Client } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare const S3_CONFIG: {
    bucket: string;
    region: string;
    publicUrl: string | undefined;
    endpoint: string;
    paths: {
        images: string;
        avatars: string;
        attachments: string;
    };
    imageSizes: {
        original: {
            quality: number;
            progressive: boolean;
        };
        medium: {
            maxWidth: number;
            maxHeight: number;
            quality: number;
        };
        thumbnail: {
            width: number;
            height: number;
            quality: number;
        };
    };
    signedUrlExpiry: number;
    cors: {
        AllowedHeaders: string[];
        AllowedMethods: string[];
        AllowedOrigins: string[];
        ExposeHeaders: string[];
        MaxAgeSeconds: number;
    }[];
};
export declare function initializeStorage(): Promise<void>;
export declare function testStorageConnection(): Promise<boolean>;
export declare function healthCheck(): Promise<{
    healthy: boolean;
    message: string;
}>;
export declare function getStorageInfo(): {
    type: string;
    bucket: string;
    region: string;
    endpoint: string;
};
//# sourceMappingURL=storage.d.ts.map