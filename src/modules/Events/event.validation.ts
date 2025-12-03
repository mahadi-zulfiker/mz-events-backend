import { z } from 'zod';

const baseEventSchema = {
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.enum([
        'CONCERT',
        'SPORTS',
        'GAMING',
        'FOOD',
        'TECH',
        'ART',
        'TRAVEL',
        'OTHER',
    ]),
    date: z.string(),
    time: z.string(),
    location: z.string().min(2),
    address: z.string().min(5),
    minParticipants: z.number().int().positive(),
    maxParticipants: z.number().int().positive(),
    joiningFee: z.number().nonnegative().optional(),
    imageUrl: z.string().url().optional(),
};

export const createEventSchema = z.object({
    body: z.object({
        ...baseEventSchema,
    }).refine((data) => data.maxParticipants > data.minParticipants, {
        message: 'Max participants must be greater than min participants',
        path: ['maxParticipants'],
    }),
});

export const updateEventSchema = z.object({
    body: z
        .object({
            ...baseEventSchema,
            status: z
                .enum(['OPEN', 'FULL', 'CANCELLED', 'COMPLETED'])
                .optional(),
        })
        .partial()
        .refine(
            (data) =>
                !data.minParticipants ||
                !data.maxParticipants ||
                data.maxParticipants > data.minParticipants,
            {
                message: 'Max participants must be greater than min participants',
                path: ['maxParticipants'],
            }
        ),
});
