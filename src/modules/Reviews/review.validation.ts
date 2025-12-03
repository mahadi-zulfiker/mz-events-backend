import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        eventId: z.string().uuid(),
        hostId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(500).optional(),
    }),
});
