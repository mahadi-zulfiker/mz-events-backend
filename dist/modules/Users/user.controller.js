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
exports.UserController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield database_1.default.user.findUnique({
            where: { id },
            include: {
                hostedEvents: true,
                participants: {
                    include: {
                        event: true,
                    },
                },
                receivedReviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            data: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                bio: user.bio,
                interests: user.interests,
                location: user.location,
                averageRating: user.averageRating,
                createdAt: user.createdAt,
                hostedEventsCount: user.hostedEvents.length,
                joinedEventsCount: user.participants.length,
                reviews: user.receivedReviews,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get profile',
            error,
        });
    }
});
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (id !== userId && role !== 'ADMIN') {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'You can only update your own profile',
            });
        }
        const { fullName, bio, profileImage, location, interests } = req.body;
        const updatedUser = yield database_1.default.user.update({
            where: { id },
            data: {
                fullName,
                bio,
                profileImage,
                location,
                interests,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                bio: true,
                profileImage: true,
                location: true,
                interests: true,
            },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update profile',
            error,
        });
    }
});
const getUserEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const [hosted, joined] = yield Promise.all([
            database_1.default.event.findMany({
                where: { hostId: id },
                orderBy: { date: 'asc' },
                include: {
                    _count: { select: { participants: true } },
                },
            }),
            database_1.default.participant.findMany({
                where: { userId: id },
                include: {
                    event: {
                        include: {
                            _count: { select: { participants: true } },
                        },
                    },
                },
            }),
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: {
                hosted,
                joined: joined.map((p) => p.event),
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get user events',
            error,
        });
    }
});
const getUserReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const reviews = yield database_1.default.review.findMany({
            where: { hostId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                    },
                },
                event: {
                    select: { id: true, title: true },
                },
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
            message: error.message || 'Failed to get reviews',
            error,
        });
    }
});
exports.UserController = {
    getProfile,
    updateProfile,
    getUserEvents,
    getUserReviews,
};
