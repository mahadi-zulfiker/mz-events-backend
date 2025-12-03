import { z } from 'zod';

export const updateUserSchema = z.object({
    body: z.object({
        fullName: z.string().min(2).optional(),
        bio: z.string().max(500).optional(),
        profileImage: z.string().url().optional(),
        location: z.string().optional(),
        interests: z.array(z.string()).optional(),
    }),
});
