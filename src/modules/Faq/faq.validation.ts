import { z } from 'zod';

export const createFaqSchema = z.object({
    body: z.object({
        question: z.string().min(5, 'Question is required'),
        answer: z.string().min(5, 'Answer is required'),
        category: z.string().optional(),
    }),
});

export const updateFaqSchema = z.object({
    body: z
        .object({
            question: z.string().min(5).optional(),
            answer: z.string().min(5).optional(),
            category: z.string().optional().or(z.literal('')),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required',
        }),
});
