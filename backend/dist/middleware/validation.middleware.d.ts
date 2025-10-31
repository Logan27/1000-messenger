import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
    displayName?: string | undefined;
}, {
    password: string;
    username: string;
    displayName?: string | undefined;
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
    metadata: z.ZodOptional<z.ZodObject<{
        formatting: z.ZodOptional<z.ZodObject<{
            bold: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
            italic: z.ZodOptional<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">>;
        }, "strip", z.ZodTypeAny, {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        }, {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        }>>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        systemMessageType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    }, {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    }>>;
    replyToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    contentType?: "text" | "image" | "system" | undefined;
    metadata?: {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    } | undefined;
    replyToId?: string | undefined;
}, {
    content: string;
    contentType?: "text" | "image" | "system" | undefined;
    metadata?: {
        formatting?: {
            bold?: [number, number][] | undefined;
            italic?: [number, number][] | undefined;
        } | undefined;
        attachments?: string[] | undefined;
        systemMessageType?: string | undefined;
    } | undefined;
    replyToId?: string | undefined;
}>;
export declare const chatSchema: z.ZodObject<{
    name: z.ZodString;
    participantIds: z.ZodArray<z.ZodString, "many">;
    avatarUrl: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    participantIds: string[];
    avatarUrl?: string | undefined;
    slug?: string | undefined;
}, {
    name: string;
    participantIds: string[];
    avatarUrl?: string | undefined;
    slug?: string | undefined;
}>;
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map