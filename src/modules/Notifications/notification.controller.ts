import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const list = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        res.status(httpStatus.OK).json({
            success: true,
            data: notifications,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch notifications',
            error,
        });
    }
};

const markRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update notification',
            error,
        });
    }
};

const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update notifications',
            error,
        });
    }
};

export const NotificationController = {
    list,
    markRead,
    markAllRead,
};
