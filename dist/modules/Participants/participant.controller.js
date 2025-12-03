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
exports.ParticipantController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const http_status_1 = __importDefault(require("http-status"));
const joinEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { eventId } = req.params;
        const { paymentStatus, paymentId } = req.body;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const event = yield database_1.default.event.findUnique({
            where: { id: eventId },
            include: {
                _count: { select: { participants: true } },
            },
        });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        if (event.status !== 'OPEN') {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'Event is not open for joining',
            });
        }
        if (event._count.participants >= event.maxParticipants) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'Event is full',
            });
        }
        const existing = yield database_1.default.participant.findFirst({
            where: { userId, eventId },
        });
        if (existing) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'You have already joined this event',
            });
        }
        if (Number(event.joiningFee) > 0 &&
            paymentStatus !== 'COMPLETED') {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'Payment must be completed to join this paid event',
            });
        }
        const participant = yield database_1.default.participant.create({
            data: {
                userId,
                eventId,
                paymentStatus: Number(event.joiningFee) > 0
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
        yield database_1.default.event.update({
            where: { id: eventId },
            data: {
                status: participantCount >= event.maxParticipants ? 'FULL' : 'OPEN',
            },
        });
        res.status(http_status_1.default.CREATED).json({
            success: true,
            message: 'Joined event successfully',
            data: participant,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to join event',
            error,
        });
    }
});
const leaveEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { eventId } = req.params;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const participant = yield database_1.default.participant.findFirst({
            where: { userId, eventId },
        });
        if (!participant) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'You are not a participant of this event',
            });
        }
        yield database_1.default.participant.delete({ where: { id: participant.id } });
        const [count, event] = yield Promise.all([
            database_1.default.participant.count({
                where: { eventId },
            }),
            database_1.default.event.findUnique({ where: { id: eventId } }),
        ]);
        if (event) {
            const newStatus = event.status === 'CANCELLED' || event.status === 'COMPLETED'
                ? event.status
                : count >= event.maxParticipants
                    ? 'FULL'
                    : 'OPEN';
            yield database_1.default.event.update({
                where: { id: eventId },
                data: { status: newStatus },
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Left event successfully',
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to leave event',
            error,
        });
    }
});
const getParticipants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { eventId } = req.params;
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const requesterRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const event = yield database_1.default.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        if (requesterRole !== 'ADMIN' && event.hostId !== requesterId) {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'Only the host or admin can view participants',
            });
        }
        const participants = yield database_1.default.participant.findMany({
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
        res.status(http_status_1.default.OK).json({
            success: true,
            data: participants,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch participants',
            error,
        });
    }
});
exports.ParticipantController = {
    joinEvent,
    leaveEvent,
    getParticipants,
};
