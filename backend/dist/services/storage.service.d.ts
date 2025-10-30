export interface UploadResult {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    originalUrl: string;
    thumbnailUrl?: string;
    mediumUrl?: string;
    width?: number;
    height?: number;
    storageKey: string;
    thumbnailKey?: string;
    mediumKey?: string;
}
export declare class StorageService {
    uploadImage(file: Express.Multer.File, userId: string): Promise<UploadResult>;
    deleteImage(storageKey: string, thumbnailKey?: string, mediumKey?: string): Promise<void>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    private uploadToS3;
    private deleteFromS3;
    private validateImage;
}
//# sourceMappingURL=storage.service.d.ts.map