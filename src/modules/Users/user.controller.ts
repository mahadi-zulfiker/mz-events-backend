import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';
import { JwtPayload } from '../../utils/jwt.util';

type AuthRequest = Request & { user?: JwtPayload };

const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
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
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'User not found',
            });
        }

        const [followersCount, followingCount] = await Promise.all([
            prisma.friendship.count({ where: { followingId: id } }),
            prisma.friendship.count({ where: { followerId: id } }),
        ]);

        res.status(httpStatus.OK).json({
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
                followersCount,
                followingCount,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get profile',
            error,
        });
    }
};

const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (id !== userId && role !== 'ADMIN') {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'You can only update your own profile',
            });
        }

        const { fullName, bio, profileImage, location, interests } = req.body;

        const updatedUser = await prisma.user.update({
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

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update profile',
            error,
        });
    }
};

const getUserEvents = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const [hosted, joined] = await Promise.all([
            prisma.event.findMany({
                where: { hostId: id },
                orderBy: { date: 'asc' },
                include: {
                    participants: {
                        select: { paymentStatus: true },
                    },
                    _count: { select: { participants: true } },
                },
            }),
            prisma.participant.findMany({
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

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                hosted,
                joined: joined.map((p) => p.event),
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get user events',
            error,
        });
    }
};

const getUserReviews = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const reviews = await prisma.review.findMany({
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

        res.status(httpStatus.OK).json({
            success: true,
            data: reviews,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get reviews',
            error,
        });
    }
};

export const UserController = {
    getProfile,
    updateProfile,
    getUserEvents,
    getUserReviews,
};
