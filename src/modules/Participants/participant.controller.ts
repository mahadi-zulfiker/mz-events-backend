import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const joinEvent = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { eventId } = req.params;
        const { paymentStatus, paymentId } = req.body;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: { select: { participants: true } },
            },
        });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (event.status !== 'OPEN') {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Event is not open for joining',
            });
        }

        if (event._count.participants >= event.maxParticipants) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Event is full',
            });
        }

        const existing = await prisma.participant.findFirst({
            where: { userId, eventId },
        });

        if (existing) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'You have already joined this event',
            });
        }

        if (
            Number(event.joiningFee) > 0 &&
            paymentStatus !== 'COMPLETED'
        ) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Payment must be completed to join this paid event',
            });
        }

        const participant = await prisma.participant.create({
            data: {
                userId,
                eventId,
                paymentStatus:
                    Number(event.joiningFee) > 0
                        ? paymentStatus || 'PENDING'
                        : 'COMPLETED',
                paymentId,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, profileImage: true },
                },
            },
        });

        const participantCount = event._count.participants + 1;

        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: participantCount >= event.maxParticipants ? 'FULL' : 'OPEN',
            },
        });

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Joined event successfully',
            data: participant,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to join event',
            error,
        });
    }
};

const leaveEvent = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { eventId } = req.params;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const participant = await prisma.participant.findFirst({
            where: { userId, eventId },
        });

        if (!participant) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'You are not a participant of this event',
            });
        }

        await prisma.participant.delete({ where: { id: participant.id } });

        const [count, event] = await Promise.all([
            prisma.participant.count({
                where: { eventId },
            }),
            prisma.event.findUnique({ where: { id: eventId } }),
        ]);

        if (event) {
            const newStatus =
                event.status === 'CANCELLED' || event.status === 'COMPLETED'
                    ? event.status
                    : count >= event.maxParticipants
                        ? 'FULL'
                        : 'OPEN';
            await prisma.event.update({
                where: { id: eventId },
                data: { status: newStatus },
            });
        }

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Left event successfully',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to leave event',
            error,
        });
    }
};

const getParticipants = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const requesterId = req.user?.userId;
        const requesterRole = req.user?.role;
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (requesterRole !== 'ADMIN' && event.hostId !== requesterId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host or admin can view participants',
            });
        }

        const participants = await prisma.participant.findMany({
            where: { eventId },
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

        res.status(httpStatus.OK).json({
            success: true,
            data: participants,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch participants',
            error,
        });
    }
};

export const ParticipantController = {
    joinEvent,
    leaveEvent,
    getParticipants,
};
