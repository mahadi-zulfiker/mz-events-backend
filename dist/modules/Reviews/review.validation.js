"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.string().uuid(),
        hostId: zod_1.z.string().uuid(),
        rating: zod_1.z.number().min(1).max(5),
        comment: zod_1.z.string().max(500).optional(),
    }),
});
