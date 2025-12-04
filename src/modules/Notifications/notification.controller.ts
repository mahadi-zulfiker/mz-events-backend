import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';
import { JwtPayload } from '../../utils/jwt.util';

type AuthRequest = Request & { user?: JwtPayload };

const list = async (req: AuthRequest, res: Response) => {
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

const contact = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Message is required',
            });
        }

        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'No admin available to receive contact message',
            });
        }

        const senderName = name || 'Guest';
        const senderEmail = email || 'N/A';

        await prisma.notification.create({
            data: {
                userId: admin.id,
                title: `Contact form: ${senderName}`,
                body: message,
                type: 'GENERAL',
                data: {
                    fromName: senderName,
                    fromEmail: senderEmail,
                    userId: req.user?.userId,
                },
            },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Message delivered to admin',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to send message',
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
    contact,
    markRead,
    markAllRead,
};
