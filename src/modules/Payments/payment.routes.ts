import express from 'express';
import { PaymentController } from './payment.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = express.Router();

router.post(
    '/create-intent',
    authMiddleware,
    PaymentController.createPaymentIntent
);

router.post(
    '/confirm',
    authMiddleware,
    PaymentController.confirmPayment
);

router.get(
    '/history',
    authMiddleware,
    PaymentController.getPaymentHistory
);

router.get(
    '/revenue',
    authMiddleware,
    requireRole('HOST', 'ADMIN'),
    PaymentController.getHostRevenue
);

router.post(
    '/refund',
    authMiddleware,
    requireRole('HOST', 'ADMIN'),
    PaymentController.requestRefund
);

router.post('/webhook', PaymentController.handleWebhook);

export const PaymentRoutes = router;
