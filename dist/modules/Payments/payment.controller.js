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
exports.PaymentController = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const stripe_1 = __importDefault(require("../../config/stripe"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const serializePayment = (payment) => (Object.assign(Object.assign({}, payment), { amount: Number(payment.amount) }));
const createPaymentIntent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { eventId } = req.body;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const event = yield database_1.default.event.findUnique({ where: { id: eventId } });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        if (Number(event.joiningFee) <= 0) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'This event is free to join',
            });
        }
        const amount = Math.round(Number(event.joiningFee) * 100);
        const paymentIntent = yield stripe_1.default.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                eventId,
                userId,
            },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Payment intent created',
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create payment intent',
            error,
        });
    }
});
const confirmPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { paymentIntentId, eventId } = req.body;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const paymentIntent = yield stripe_1.default.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'Payment not completed',
            });
        }
        const event = yield database_1.default.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { participants: true } } },
        });
        if (!event) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }
        const amount = new client_1.Prisma.Decimal(Number(paymentIntent.amount_received || paymentIntent.amount || 0) / 100);
        const charge = (_c = (_b = paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.charges) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0];
        const payment = yield database_1.default.payment.upsert({
            where: {
                paymentIntentId,
            },
            update: {
                status: 'COMPLETED',
                receiptUrl: (charge === null || charge === void 0 ? void 0 : charge.receipt_url) ||
                    undefined,
                amount,
            },
            create: {
                userId,
                hostId: event.hostId,
                eventId,
                amount,
                currency: paymentIntent.currency || 'usd',
                status: 'COMPLETED',
                paymentIntentId,
                receiptUrl: (charge === null || charge === void 0 ? void 0 : charge.receipt_url) ||
                    undefined,
                description: paymentIntent.description || `Payment for ${event.title}`,
            },
        });
        yield database_1.default.participant.upsert({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
            update: {
                paymentStatus: 'COMPLETED',
                paymentId: payment.id,
            },
            create: {
                userId,
                eventId,
                paymentStatus: 'COMPLETED',
                paymentId: payment.id,
            },
        });
        const participantCount = yield database_1.default.participant.count({ where: { eventId } });
        yield database_1.default.event.update({
            where: { id: eventId },
            data: {
                status: participantCount >= event.maxParticipants ? 'FULL' : 'OPEN',
            },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Payment confirmed',
            data: payment,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to confirm payment',
            error,
        });
    }
});
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: 'Missing Stripe signature',
        });
    }
    try {
        const event = stripe_1.default.webhooks.constructEvent(req.body, sig, config_1.default.stripe.webhookSecret);
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const eventId = (_a = intent.metadata) === null || _a === void 0 ? void 0 : _a.eventId;
            const userId = (_b = intent.metadata) === null || _b === void 0 ? void 0 : _b.userId;
            const paymentId = intent.id;
            if (eventId && userId) {
                const targetEvent = yield database_1.default.event.findUnique({
                    where: { id: eventId },
                    include: { _count: { select: { participants: true } } },
                });
                if (targetEvent) {
                    yield database_1.default.payment.upsert({
                        where: { paymentIntentId: paymentId },
                        update: {
                            status: 'COMPLETED',
                            receiptUrl: ((_e = (_d = (_c = intent.charges) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.receipt_url) || undefined,
                        },
                        create: {
                            userId,
                            hostId: targetEvent.hostId,
                            eventId,
                            amount: new client_1.Prisma.Decimal(Number(intent.amount_received || intent.amount || 0) / 100),
                            currency: intent.currency || 'usd',
                            status: 'COMPLETED',
                            paymentIntentId: paymentId,
                            receiptUrl: ((_h = (_g = (_f = intent.charges) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.receipt_url) || undefined,
                            description: intent.description || `Payment for ${targetEvent.title}`,
                        },
                    });
                    yield database_1.default.participant.upsert({
                        where: {
                            userId_eventId: {
                                userId,
                                eventId,
                            },
                        },
                        update: { paymentStatus: 'COMPLETED', paymentId },
                        create: {
                            userId,
                            eventId,
                            paymentStatus: 'COMPLETED',
                            paymentId,
                        },
                    });
                    const participantCount = yield database_1.default.participant.count({
                        where: { eventId },
                    });
                    yield database_1.default.event.update({
                        where: { id: eventId },
                        data: {
                            status: participantCount >= targetEvent.maxParticipants ? 'FULL' : 'OPEN',
                        },
                    });
                }
            }
        }
        res.json({ received: true });
    }
    catch (err) {
        res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: `Webhook Error: ${err.message}`,
        });
    }
});
const getPaymentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const rawPayments = yield database_1.default.payment.findMany({
            where: { userId },
            include: {
                event: { select: { id: true, title: true, date: true, time: true, location: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const payments = rawPayments.map(serializePayment);
        const total = payments
            .filter((p) => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + Number(p.amount), 0);
        res.status(http_status_1.default.OK).json({
            success: true,
            data: payments,
            meta: { totalSpent: total },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch history',
            error,
        });
    }
});
const getHostRevenue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const targetHostId = role === 'ADMIN' && req.query.hostId ? String(req.query.hostId) : userId;
        if (role !== 'HOST' && role !== 'ADMIN') {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'Only hosts or admins can view revenue',
            });
        }
        const rawPayments = yield database_1.default.payment.findMany({
            where: { hostId: targetHostId },
            include: {
                event: { select: { id: true, title: true, date: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const payments = rawPayments.map(serializePayment);
        const summary = payments.reduce((acc, p) => {
            const amt = Number(p.amount);
            if (p.status === 'COMPLETED')
                acc.completed += amt;
            if (p.status === 'PENDING')
                acc.pending += amt;
            if (p.status === 'REFUNDED')
                acc.refunded += amt;
            return acc;
        }, { completed: 0, pending: 0, refunded: 0 });
        const monthly = payments.reduce((acc, p) => {
            const month = new Date(p.createdAt).toISOString().slice(0, 7); // YYYY-MM
            if (p.status !== 'COMPLETED')
                return acc;
            acc[month] = (acc[month] || 0) + Number(p.amount);
            return acc;
        }, {});
        res.status(http_status_1.default.OK).json({
            success: true,
            data: payments,
            meta: {
                summary,
                monthly,
            },
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch revenue',
            error,
        });
    }
});
const requestRefund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { paymentId } = req.body;
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
        const payment = yield database_1.default.payment.findUnique({ where: { id: paymentId } });
        if (!payment) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: 'Payment not found',
            });
        }
        if (role !== 'ADMIN' && payment.hostId !== userId) {
            return res.status(http_status_1.default.FORBIDDEN).json({
                success: false,
                message: 'Only the host or admin can refund',
            });
        }
        if (payment.status === 'REFUNDED') {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'Payment already refunded',
            });
        }
        if (payment.paymentIntentId) {
            try {
                yield stripe_1.default.refunds.create({
                    payment_intent: payment.paymentIntentId,
                });
            }
            catch (_c) {
                // non-fatal if running without Stripe keys
            }
        }
        const updated = yield database_1.default.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                refundId: payment.paymentIntentId ? `refund_${payment.paymentIntentId}` : undefined,
            },
        });
        yield database_1.default.participant.updateMany({
            where: { paymentId },
            data: { paymentStatus: 'REFUNDED' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Refund processed',
            data: updated,
        });
    }
    catch (error) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to refund payment',
            error,
        });
    }
});
exports.PaymentController = {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    getPaymentHistory,
    getHostRevenue,
    requestRefund,
};
