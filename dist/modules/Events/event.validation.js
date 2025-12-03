"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
const baseEventSchema = {
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    category: zod_1.z.enum([
        'CONCERT',
        'SPORTS',
        'GAMING',
        'FOOD',
        'TECH',
        'ART',
        'TRAVEL',
        'OTHER',
    ]),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    location: zod_1.z.string().min(2),
    address: zod_1.z.string().min(5),
    minParticipants: zod_1.z.number().int().positive(),
    maxParticipants: zod_1.z.number().int().positive(),
    joiningFee: zod_1.z.number().nonnegative().optional(),
    imageUrl: zod_1.z.string().url().optional(),
};
exports.createEventSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign({}, baseEventSchema)).refine((data) => data.maxParticipants > data.minParticipants, {
        message: 'Max participants must be greater than min participants',
        path: ['maxParticipants'],
    }),
});
exports.updateEventSchema = zod_1.z.object({
    body: zod_1.z
        .object(Object.assign(Object.assign({}, baseEventSchema), { status: zod_1.z
            .enum(['OPEN', 'FULL', 'CANCELLED', 'COMPLETED'])
            .optional() }))
        .partial()
        .refine((data) => !data.minParticipants ||
        !data.maxParticipants ||
        data.maxParticipants > data.minParticipants, {
        message: 'Max participants must be greater than min participants',
        path: ['maxParticipants'],
    }),
});
