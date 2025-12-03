"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).optional(),
        bio: zod_1.z.string().max(500).optional(),
        profileImage: zod_1.z.string().url().optional(),
        location: zod_1.z.string().optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
