"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const getStats = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [users, events, participants] = yield Promise.all([
            database_1.default.user.count(),
            database_1.default.event.count(),
            database_1.default.participant.findMany({
                where: { paymentStatus: 'COMPLETED' },
                include: { event: true },
            }),
        ]);
        const revenue = participants.reduce((sum, p) => {
            return sum + Number(p.event.joiningFee);
        }, 0);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: {
                totalUsers: users,
                totalEvents: events,
                completedPayments: participants.length,
                revenue,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch stats',
            error,
        });
    }
});
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const roleQuery = (_a = req.query.role) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        const allowedRoles = ['USER', 'HOST', 'ADMIN'];
        const where = roleQuery && allowedRoles.includes(roleQuery)
            ? { role: roleQuery }
            : undefined;
        const [users, total] = yield Promise.all([
            database_1.default.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.user.count({ where }),
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: users,
            meta: { page, limit, total },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch users',
            error,
        });
    }
});
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { role, isActive } = req.body;
        const updated = yield database_1.default.user.update({
            where: { id },
            data: { role, isActive },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'User updated',
            data: updated,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update user',
            error,
        });
    }
});
const getEvents = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(_req.query.page) || 1;
        const limit = Number(_req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [events, total] = yield Promise.all([
            database_1.default.event.findMany({
                include: {
                    host: { select: { id: true, fullName: true } },
                    _count: { select: { participants: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.event.count(),
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: events,
            meta: { page, limit, total },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch events',
            error,
        });
    }
});
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.default.event.delete({ where: { id } });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Event deleted',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete event',
            error,
        });
    }
});
const getReviews = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(_req.query.page) || 1;
        const limit = Number(_req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [reviews, total] = yield Promise.all([
            database_1.default.review.findMany({
                include: {
                    user: { select: { id: true, fullName: true } },
                    host: { select: { id: true, fullName: true } },
                    event: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.default.review.count(),
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: reviews,
            meta: { page, limit, total },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch reviews',
            error,
        });
    }
});
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.default.review.delete({ where: { id } });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Review deleted',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete review',
            error,
        });
    }
});
exports.AdminController = {
    getStats,
    getUsers,
    updateUser,
    getEvents,
    deleteEvent,
    getReviews,
    deleteReview,
};
