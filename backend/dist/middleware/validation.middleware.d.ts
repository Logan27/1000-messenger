import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
}, {
    password: string;
    username: string;
}>;
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
}, {
    password: string;
    username: string;
}>;
export declare const messageSchema: z.ZodObject<{
    content: z.ZodString;
    contentType: z.ZodOptional<z.ZodEnum<["text", "image", "system"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    replyToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    contentType?: "text" | "image" | "system" | undefined;
    metadata?: Record<string, any> | undefined;
    replyToId?: string | undefined;
}, {
    content: string;
    contentType?: "text" | "image" | "system" | undefined;
    metadata?: Record<string, any> | undefined;
    replyToId?: string | undefined;
}>;
export declare const chatSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    participantIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    participantIds: string[];
    name?: string | undefined;
}, {
    participantIds: string[];
    name?: string | undefined;
}>;
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.middleware.d.ts.map