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
export type ValidationTarget = 'body' | 'query' | 'params';
export interface ValidationOptions {
    stripUnknown?: boolean;
    abortEarly?: boolean;
    errorPrefix?: string;
    logErrors?: boolean;
}
export interface ValidationErrorResponse {
    error: string;
    details: Array<{
        field: string;
        message: string;
        code?: string;
    }>;
}
export interface ValidationSchemas {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
}
export declare const validate: (schema: z.ZodSchema, target?: ValidationTarget, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateMultiple: (schemas: ValidationSchemas, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateBody: (schema: z.ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: z.ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: z.ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createValidator: (defaultOptions: ValidationOptions) => (schema: z.ZodSchema, target?: ValidationTarget, overrideOptions?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createUuidParamsSchema: (...paramNames: string[]) => z.ZodObject<Record<string, z.ZodString>, "strip", z.ZodTypeAny, {
    [x: string]: string;
}, {
    [x: string]: string;
}>;
export declare const createPaginationSchema: (maxLimit?: number, defaultLimit?: number) => z.ZodObject<{
    limit: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, z.ZodNumber>;
    offset: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: string | undefined;
    offset?: string | undefined;
}>;
export declare const validateAsync: (validatorFn: (req: Request) => Promise<any>, target?: ValidationTarget, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validation.middleware.d.ts.map