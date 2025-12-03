import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../config/database';
import httpStatus from 'http-status';

const buildFilters = (query: Record<string, any>) => {
    const where: Prisma.EventWhereInput = {};

    if (query.search) {
        where.OR = [
            { title: { contains: query.search as string, mode: 'insensitive' } },
            { description: { contains: query.search as string, mode: 'insensitive' } },
        ];
    }

    if (query.category) {
        where.category = query.category as any;
    }

    if (query.location) {
        where.location = { contains: query.location as string, mode: 'insensitive' };
    }

    if (query.status) {
        where.status = query.status as any;
    }

    if (query.date) {
        where.date = new Date(query.date as string);
    }

    if (query.minFee || query.maxFee) {
        const feeFilter: Prisma.DecimalFilter = {};
        if (query.minFee) feeFilter.gte = Number(query.minFee);
        if (query.maxFee) feeFilter.lte = Number(query.maxFee);
        if (Object.keys(feeFilter).length) {
            where.joiningFee = feeFilter;
        }
    }

    return where;
};

const createEvent = async (req: Request, res: Response) => {
    try {
        const hostId = req.user?.userId;
        const role = req.user?.role;

        if (!hostId || (role !== 'HOST' && role !== 'ADMIN')) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only hosts or admins can create events',
            });
        }

        const {
            title,
            description,
            category,
            date,
            time,
            location,
            address,
            minParticipants,
            maxParticipants,
            joiningFee,
            imageUrl,
        } = req.body;

        const event = await prisma.event.create({
            data: {
                title,
                description,
                category,
                date: new Date(date),
                time,
                location,
                address,
                minParticipants: Number(minParticipants),
                maxParticipants: Number(maxParticipants),
                joiningFee: new Prisma.Decimal(joiningFee || 0),
                imageUrl,
                hostId,
            },
            include: {
                host: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        averageRating: true,
                    },
                },
            },
        });

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Event created successfully',
            data: event,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create event',
            error,
        });
    }
};

const getAllEvents = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const where = buildFilters(req.query);

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                skip,
                take: limit,
                include: {
                    host: {
                        select: {
                            id: true,
                            fullName: true,
                            profileImage: true,
                            averageRating: true,
                        },
                    },
                    _count: {
                        select: { participants: true },
                    },
                },
                orderBy: { date: 'asc' },
            }),
            prisma.event.count({ where }),
        ]);

        res.status(httpStatus.OK).json({
            success: true,
            data: events,
            meta: {
                page,
                limit,
                total,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get events',
            error,
        });
    }
};

const getEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                host: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        averageRating: true,
                    },
                },
                participants: {
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
                reviews: {
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
                _count: {
                    select: { participants: true },
                },
            },
        });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        res.status(httpStatus.OK).json({
            success: true,
            data: event,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get event',
            error,
        });
    }
};

const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (event.hostId !== userId && userRole !== 'ADMIN') {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'You can only update your own events',
            });
        }

        const {
            title,
            description,
            category,
            date,
            time,
            location,
            address,
            minParticipants,
            maxParticipants,
            joiningFee,
            imageUrl,
            status,
        } = req.body;

        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                category,
                date: date ? new Date(date) : undefined,
                time,
                location,
                address,
                minParticipants: minParticipants ? Number(minParticipants) : undefined,
                maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
                joiningFee:
                    joiningFee !== undefined ? new Prisma.Decimal(joiningFee) : undefined,
                imageUrl,
                status,
            },
            include: {
                host: {
                    select: { id: true, fullName: true, profileImage: true },
                },
            },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update event',
            error,
        });
    }
};

const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (event.hostId !== userId && userRole !== 'ADMIN') {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'You can only delete your own events',
            });
        }

        await prisma.event.delete({ where: { id } });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete event',
            error,
        });
    }
};

export const EventController = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
};
