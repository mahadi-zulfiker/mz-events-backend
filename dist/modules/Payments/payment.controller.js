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
const database_1 = __importDefault(require("../../config/database"));
const stripe_1 = __importDefault(require("../../config/stripe"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
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
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
exports.PaymentController = {
    createPaymentIntent,
    handleWebhook,
};
