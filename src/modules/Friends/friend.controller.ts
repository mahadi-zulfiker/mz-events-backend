import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const follow = async (req: Request, res: Response) => {
    try {
        const followerId = req.user?.userId;
        const { userId: followingId } = req.params;

        if (!followerId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        if (followerId === followingId) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'You cannot follow yourself',
            });
        }

        const target = await prisma.user.findUnique({ where: { id: followingId } });
        if (!target) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'User not found',
            });
        }

        await prisma.friendship.upsert({
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

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Followed user',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to follow user',
            error,
        });
    }
};

const unfollow = async (req: Request, res: Response) => {
    try {
        const followerId = req.user?.userId;
        const { userId: followingId } = req.params;

        if (!followerId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        await prisma.friendship.deleteMany({
            where: { followerId, followingId },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Unfollowed user',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to unfollow user',
            error,
        });
    }
};

const list = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const [followers, following] = await Promise.all([
            prisma.friendship.findMany({
                where: { followingId: userId },
                include: { follower: { select: { id: true, fullName: true, profileImage: true } } },
            }),
            prisma.friendship.findMany({
                where: { followerId: userId },
                include: { following: { select: { id: true, fullName: true, profileImage: true } } },
            }),
        ]);

        const suggestions = await prisma.user.findMany({
            where: {
                id: { notIn: [userId, ...following.map((f) => f.followingId)] },
                role: 'USER',
            },
            select: { id: true, fullName: true, profileImage: true, location: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                followers: followers.map((f) => f.follower),
                following: following.map((f) => f.following),
                suggestions,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch friends',
            error,
        });
    }
};

const activities = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const following = await prisma.friendship.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = following.map((f) => f.followingId);

        if (followingIds.length === 0) {
            return res.status(httpStatus.OK).json({
                success: true,
                data: [],
            });
        }

        const upcoming = await prisma.event.findMany({
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

        res.status(httpStatus.OK).json({
            success: true,
            data: upcoming,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch activities',
            error,
        });
    }
};

export const FriendController = {
    follow,
    unfollow,
    list,
    activities,
};
