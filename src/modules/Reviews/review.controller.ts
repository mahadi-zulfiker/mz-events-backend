import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const createReview = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { eventId, hostId, rating, comment } = req.body;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { participants: true },
        });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (event.hostId !== hostId) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Review host mismatch with event',
            });
        }

        if (event.status !== 'COMPLETED') {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Reviews can only be added after the event is completed',
            });
        }

        const attended = event.participants.some((p) => p.userId === userId);

        if (!attended) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'You must attend the event to leave a review',
            });
        }

        const existingReview = await prisma.review.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });

        if (existingReview) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'You have already reviewed this event',
            });
        }

        const review = await prisma.review.create({
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
        const hostReviews = await prisma.review.findMany({
            where: { hostId },
        });
        const avg =
            hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length;
        await prisma.user.update({
            where: { id: hostId },
            data: { averageRating: Number(avg.toFixed(1)) },
        });

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Review created successfully',
            data: review,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create review',
            error,
        });
    }
};

const getHostReviews = async (req: Request, res: Response) => {
    try {
        const { hostId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { hostId },
            include: {
                user: {
                    select: { id: true, fullName: true, profileImage: true },
                },
                event: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const avgRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                reviews,
                avgRating: Number(avgRating.toFixed(1)),
                totalReviews: reviews.length,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get reviews',
            error,
        });
    }
};

const getEventReviews = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { eventId },
            include: {
                user: { select: { id: true, fullName: true, profileImage: true } },
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
            message: error.message || 'Failed to get event reviews',
            error,
        });
    }
};

export const ReviewController = {
    createReview,
    getHostReviews,
    getEventReviews,
};
