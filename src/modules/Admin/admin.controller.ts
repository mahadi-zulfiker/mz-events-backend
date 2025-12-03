import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const getStats = async (_req: Request, res: Response) => {
    try {
        const [users, events, participants] = await Promise.all([
            prisma.user.count(),
            prisma.event.count(),
            prisma.participant.findMany({
                where: { paymentStatus: 'COMPLETED' },
                include: { event: true },
            }),
        ]);

        const revenue = participants.reduce((sum, p) => {
            return sum + Number(p.event.joiningFee);
        }, 0);

        res.status(httpStatus.OK).json({
            success: true,
            data: {
                totalUsers: users,
                totalEvents: events,
                completedPayments: participants.length,
                revenue,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch stats',
            error,
        });
    }
};

const getUsers = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const roleQuery = (req.query.role as string | undefined)?.toUpperCase();
        const allowedRoles = ['USER', 'HOST', 'ADMIN'];
        const where =
            roleQuery && allowedRoles.includes(roleQuery)
                ? { role: roleQuery as any }
                : undefined;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        res.status(httpStatus.OK).json({
            success: true,
            data: users,
            meta: { page, limit, total },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch users',
            error,
        });
    }
};

const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role, isActive } = req.body;

        const updated = await prisma.user.update({
            where: { id },
            data: { role, isActive },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'User updated',
            data: updated,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update user',
            error,
        });
    }
};

const getEvents = async (_req: Request, res: Response) => {
    try {
        const page = Number(_req.query.page) || 1;
        const limit = Number(_req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                include: {
                    host: { select: { id: true, fullName: true } },
                    _count: { select: { participants: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.event.count(),
        ]);

        res.status(httpStatus.OK).json({
            success: true,
            data: events,
            meta: { page, limit, total },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch events',
            error,
        });
    }
};

const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id } });
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Event deleted',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete event',
            error,
        });
    }
};

const getReviews = async (_req: Request, res: Response) => {
    try {
        const page = Number(_req.query.page) || 1;
        const limit = Number(_req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                include: {
                    user: { select: { id: true, fullName: true } },
                    host: { select: { id: true, fullName: true } },
                    event: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.review.count(),
        ]);

        res.status(httpStatus.OK).json({
            success: true,
            data: reviews,
            meta: { page, limit, total },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch reviews',
            error,
        });
    }
};

const deleteReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.review.delete({ where: { id } });
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Review deleted',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete review',
            error,
        });
    }
};

export const AdminController = {
    getStats,
    getUsers,
    updateUser,
    getEvents,
    deleteEvent,
    getReviews,
    deleteReview,
};
