import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        fullName: z.string().min(2, 'Full name is required'),
        email: z.string().email('Valid email required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['USER', 'HOST', 'ADMIN']).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
