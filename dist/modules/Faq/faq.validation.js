"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFaqSchema = exports.createFaqSchema = void 0;
const zod_1 = require("zod");
exports.createFaqSchema = zod_1.z.object({
    body: zod_1.z.object({
        question: zod_1.z.string().min(5, 'Question is required'),
        answer: zod_1.z.string().min(5, 'Answer is required'),
        category: zod_1.z.string().optional(),
    }),
});
exports.updateFaqSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        question: zod_1.z.string().min(5).optional(),
        answer: zod_1.z.string().min(5).optional(),
        category: zod_1.z.string().optional().or(zod_1.z.literal('')),
    })
        .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required',
    }),
});
