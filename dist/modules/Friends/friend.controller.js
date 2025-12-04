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
exports.FriendController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const follow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const followerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { userId: followingId } = req.params;
        if (!followerId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        if (followerId === followingId) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'You cannot follow yourself',
            });
        }
        const target = yield database_1.default.user.findUnique({ where: { id: followingId } });
        if (!target) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'User not found',
            });
        }
        yield database_1.default.friendship.upsert({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
            update: {},
            create: {
                followerId,
                followingId,
            },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Followed user',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to follow user',
            error,
        });
    }
});
const unfollow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const followerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { userId: followingId } = req.params;
        if (!followerId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        yield database_1.default.friendship.deleteMany({
            where: { followerId, followingId },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Unfollowed user',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to unfollow user',
            error,
        });
    }
});
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const [followers, following] = yield Promise.all([
            database_1.default.friendship.findMany({
                where: { followingId: userId },
                include: { follower: { select: { id: true, fullName: true, profileImage: true } } },
            }),
            database_1.default.friendship.findMany({
                where: { followerId: userId },
                include: { following: { select: { id: true, fullName: true, profileImage: true } } },
            }),
        ]);
        const suggestions = yield database_1.default.user.findMany({
            where: {
                id: { notIn: [userId, ...following.map((f) => f.followingId)] },
                role: 'USER',
            },
            select: { id: true, fullName: true, profileImage: true, location: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            data: {
                followers: followers.map((f) => f.follower),
                following: following.map((f) => f.following),
                suggestions,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch friends',
            error,
        });
    }
});
const activities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const following = yield database_1.default.friendship.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);
        if (followingIds.length === 0) {
            return res.status(http_status_1.default.OK).json({
                success: true,
                data: [],
            });
        }
        const upcoming = yield database_1.default.event.findMany({
            where: {
                date: { gte: new Date() },
                OR: [
                    { hostId: { in: followingIds } },
                    { participants: { some: { userId: { in: followingIds } } } },
                ],
            },
            include: {
                host: { select: { id: true, fullName: true, profileImage: true } },
                _count: { select: { participants: true } },
            },
            orderBy: { date: 'asc' },
            take: 20,
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            data: upcoming,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch activities',
            error,
        });
    }
});
exports.FriendController = {
    follow,
    unfollow,
    list,
    activities,
};
