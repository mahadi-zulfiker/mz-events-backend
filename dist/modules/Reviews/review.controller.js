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
exports.ReviewController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { eventId, hostId, rating, comment } = req.body;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const event = yield database_1.default.event.findUnique({
            where: { id: eventId },
            include: { participants: true },
        });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        if (event.status !== 'COMPLETED') {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'Reviews can only be added after the event is completed',
            });
        }
        const attended = event.participants.some((p) => p.userId === userId);
        if (!attended) {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'You must attend the event to leave a review',
            });
        }
        const existingReview = yield database_1.default.review.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });
        if (existingReview) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'You have already reviewed this event',
            });
        }
        const review = yield database_1.default.review.create({
            data: {
                eventId,
                userId,
                hostId,
                rating: Number(rating),
                comment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
            },
        });
        // Update host average rating
        const hostReviews = yield database_1.default.review.findMany({
            where: { hostId },
        });
        const avg = hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length;
        yield database_1.default.user.update({
            where: { id: hostId },
            data: { averageRating: Number(avg.toFixed(1)) },
        });
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: 'Review created successfully',
            data: review,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create review',
            error,
        });
    }
});
const getHostReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hostId } = req.params;
        const reviews = yield database_1.default.review.findMany({
            where: { hostId },
            include: {
                user: {
                    select: { id: true, fullName: true, profileImage: true },
                },
                event: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        res.status(http_status_1.default.OK).json({
            success: true,
            data: {
                reviews,
                avgRating: Number(avgRating.toFixed(1)),
                totalReviews: reviews.length,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get reviews',
            error,
        });
    }
});
const getEventReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const reviews = yield database_1.default.review.findMany({
            where: { eventId },
            include: {
                user: { select: { id: true, fullName: true, profileImage: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            data: reviews,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get event reviews',
            error,
        });
    }
});
exports.ReviewController = {
    createReview,
    getHostReviews,
    getEventReviews,
};
