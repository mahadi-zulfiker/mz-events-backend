import { Request, Response } from 'express';
import prisma from '../../config/database';
import stripeClient from '../../config/stripe';
import httpStatus from 'http-status';
import config from '../../config';

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

export const PaymentController = {
    createPaymentIntent,
    handleWebhook,
};
