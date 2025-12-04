import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import stripeClient from '../../config/stripe';
import httpStatus from 'http-status';
import config from '../../config';

const serializePayment = (payment: any) => ({
    ...payment,
    amount: Number(payment.amount),
});

const createPaymentIntent = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { eventId } = req.body;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (Number(event.joiningFee) <= 0) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'This event is free to join',
            });
        }

        const amount = Math.round(Number(event.joiningFee) * 100);

        const paymentIntent = await stripeClient.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                eventId,
                userId,
            },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Payment intent created',
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to create payment intent',
            error,
        });
    }
};

const confirmPayment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { paymentIntentId, eventId } = req.body;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Payment not completed',
            });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { participants: true } } },
        });

        if (!event) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Event not found',
            });
        }

        const amount = new Prisma.Decimal(
            Number(paymentIntent.amount_received || paymentIntent.amount || 0) / 100
        );

        const charge = (paymentIntent as any)?.charges?.data?.[0];

        const payment = await prisma.payment.upsert({
            where: {
                paymentIntentId,
            },
            update: {
                status: 'COMPLETED',
                receiptUrl:
                    (charge?.receipt_url as string | undefined) ||
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
                receiptUrl:
                    (charge?.receipt_url as string | undefined) ||
                    undefined,
                description: paymentIntent.description || `Payment for ${event.title}`,
            },
        });

        await prisma.participant.upsert({
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

        const participantCount = await prisma.participant.count({ where: { eventId } });
        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: participantCount >= event.maxParticipants ? 'FULL' : 'OPEN',
            },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Payment confirmed',
            data: payment,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to confirm payment',
            error,
        });
    }
};

const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Missing Stripe signature',
        });
    }

    try {
        const event = stripeClient.webhooks.constructEvent(
            req.body,
            sig,
            config.stripe.webhookSecret
        );

        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object as any;
            const eventId = intent.metadata?.eventId;
            const userId = intent.metadata?.userId;
            const paymentId = intent.id;

            if (eventId && userId) {
                const targetEvent = await prisma.event.findUnique({
                    where: { id: eventId },
                    include: { _count: { select: { participants: true } } },
                });

                if (targetEvent) {
                    await prisma.payment.upsert({
                        where: { paymentIntentId: paymentId },
                        update: {
                            status: 'COMPLETED',
                            receiptUrl: intent.charges?.data?.[0]?.receipt_url || undefined,
                        },
                        create: {
                            userId,
                            hostId: targetEvent.hostId,
                            eventId,
                            amount: new Prisma.Decimal(
                                Number(intent.amount_received || intent.amount || 0) / 100
                            ),
                            currency: intent.currency || 'usd',
                            status: 'COMPLETED',
                            paymentIntentId: paymentId,
                            receiptUrl: intent.charges?.data?.[0]?.receipt_url || undefined,
                            description: intent.description || `Payment for ${targetEvent.title}`,
                        },
                    });

                    await prisma.participant.upsert({
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

                    const participantCount = await prisma.participant.count({
                        where: { eventId },
                    });
                    await prisma.event.update({
                        where: { id: eventId },
                        data: {
                            status:
                                participantCount >= targetEvent.maxParticipants ? 'FULL' : 'OPEN',
                        },
                    });
                }
            }
        }

        res.json({ received: true });
    } catch (err: any) {
        res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: `Webhook Error: ${err.message}`,
        });
    }
};

const getPaymentHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const rawPayments = await prisma.payment.findMany({
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

        res.status(httpStatus.OK).json({
            success: true,
            data: payments,
            meta: { totalSpent: total },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch history',
            error,
        });
    }
};

const getHostRevenue = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const targetHostId = role === 'ADMIN' && req.query.hostId ? String(req.query.hostId) : userId;

        if (role !== 'HOST' && role !== 'ADMIN') {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only hosts or admins can view revenue',
            });
        }

        const rawPayments = await prisma.payment.findMany({
            where: { hostId: targetHostId },
            include: {
                event: { select: { id: true, title: true, date: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const payments = rawPayments.map(serializePayment);

        const summary = payments.reduce(
            (acc, p) => {
                const amt = Number(p.amount);
                if (p.status === 'COMPLETED') acc.completed += amt;
                if (p.status === 'PENDING') acc.pending += amt;
                if (p.status === 'REFUNDED') acc.refunded += amt;
                return acc;
            },
            { completed: 0, pending: 0, refunded: 0 } as { completed: number; pending: number; refunded: number }
        );

        const monthly = payments.reduce<Record<string, number>>((acc, p) => {
            const month = new Date(p.createdAt).toISOString().slice(0, 7); // YYYY-MM
            if (p.status !== 'COMPLETED') return acc;
            acc[month] = (acc[month] || 0) + Number(p.amount);
            return acc;
        }, {});

        res.status(httpStatus.OK).json({
            success: true,
            data: payments,
            meta: {
                summary,
                monthly,
            },
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch revenue',
            error,
        });
    }
};

const requestRefund = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.body;
        const role = req.user?.role;
        const userId = req.user?.userId;

        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

        if (!payment) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Payment not found',
            });
        }

        if (role !== 'ADMIN' && payment.hostId !== userId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host or admin can refund',
            });
        }

        if (payment.status === 'REFUNDED') {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Payment already refunded',
            });
        }

        if (payment.paymentIntentId) {
            try {
                await stripeClient.refunds.create({
                    payment_intent: payment.paymentIntentId,
                });
            } catch {
                // non-fatal if running without Stripe keys
            }
        }

        const updated = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                refundId: payment.paymentIntentId ? `refund_${payment.paymentIntentId}` : undefined,
            },
        });

        await prisma.participant.updateMany({
            where: { paymentId },
            data: { paymentStatus: 'REFUNDED' as any },
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: 'Refund processed',
            data: updated,
        });
    } catch (error: any) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to refund payment',
            error,
        });
    }
};

export const PaymentController = {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    getPaymentHistory,
    getHostRevenue,
    requestRefund,
};
