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
exports.EventController = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const buildFilters = (query) => {
    const where = {};
    if (query.search) {
        where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.category) {
        where.category = query.category;
    }
    if (query.location) {
        where.location = { contains: query.location, mode: 'insensitive' };
    }
    if (query.status) {
        where.status = query.status;
    }
    if (query.date) {
        where.date = new Date(query.date);
    }
    if (query.startDate || query.endDate) {
        where.date = {
            gte: query.startDate ? new Date(query.startDate) : undefined,
            lte: query.endDate ? new Date(query.endDate) : undefined,
        };
    }
    if (query.minFee || query.maxFee) {
        const feeFilter = {};
        if (query.minFee)
            feeFilter.gte = Number(query.minFee);
        if (query.maxFee)
            feeFilter.lte = Number(query.maxFee);
        if (Object.keys(feeFilter).length) {
            where.joiningFee = feeFilter;
        }
    }
    return where;
};
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const hostId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!hostId || (role !== 'HOST' && role !== 'ADMIN')) {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'Only hosts or admins can create events',
            });
        }
        const { title, description, category, date, time, location, address, latitude, longitude, minParticipants, maxParticipants, joiningFee, imageUrl, } = req.body;
        const event = yield database_1.default.event.create({
            data: {
                title,
                description,
                category,
                date: new Date(date),
                time,
                location,
                address,
                latitude: latitude !== undefined ? Number(latitude) : null,
                longitude: longitude !== undefined ? Number(longitude) : null,
                minParticipants: Number(minParticipants),
                maxParticipants: Number(maxParticipants),
                joiningFee: new client_1.Prisma.Decimal(joiningFee || 0),
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
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: 'Event created successfully',
            data: event,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create event',
            error,
        });
    }
});
const getAllEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const where = buildFilters(req.query);
        const sortField = req.query.sort || 'date';
        const order = req.query.order === 'desc' ? 'desc' : 'asc';
        const orderBy = sortField === 'popularity'
            ? { _count: { participants: order } }
            : sortField === 'price'
                ? { joiningFee: order }
                : { date: order };
        const [events, total] = yield Promise.all([
            database_1.default.event.findMany({
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
                orderBy,
            }),
            database_1.default.event.count({ where }),
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: events,
            meta: {
                page,
                limit,
                total,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get events',
            error,
        });
    }
});
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const event = yield database_1.default.event.findUnique({
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
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            data: event,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to get event',
            error,
        });
    }
});
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const event = yield database_1.default.event.findUnique({ where: { id } });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        if (event.hostId !== userId && userRole !== 'ADMIN') {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'You can only update your own events',
            });
        }
        const { title, description, category, date, time, location, address, minParticipants, maxParticipants, joiningFee, imageUrl, status, latitude, longitude, } = req.body;
        const updatedEvent = yield database_1.default.event.update({
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
                joiningFee: joiningFee !== undefined ? new client_1.Prisma.Decimal(joiningFee) : undefined,
                imageUrl,
                status,
                latitude: latitude !== undefined ? Number(latitude) : undefined,
                longitude: longitude !== undefined ? Number(longitude) : undefined,
            },
            include: {
                host: {
                    select: { id: true, fullName: true, profileImage: true },
                },
            },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to update event',
            error,
        });
    }
});
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const event = yield database_1.default.event.findUnique({ where: { id } });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        if (event.hostId !== userId && userRole !== 'ADMIN') {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'You can only delete your own events',
            });
        }
        yield database_1.default.event.delete({ where: { id } });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Event deleted successfully',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to delete event',
            error,
        });
    }
});
const getHostedEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const events = yield database_1.default.event.findMany({
            where: { hostId: userId },
            include: { _count: { select: { participants: true } } },
            orderBy: { date: 'asc' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            data: events,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch hosted events',
            error,
        });
    }
});
const getJoinedEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const joined = yield database_1.default.participant.findMany({
            where: { userId },
            include: {
                event: {
                    include: { _count: { select: { participants: true } } },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            data: joined.map((j) => j.event),
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch joined events',
            error,
        });
    }
});
exports.EventController = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getHostedEvents,
    getJoinedEvents,
};
