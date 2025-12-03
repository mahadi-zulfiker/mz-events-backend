import express from 'express';
import { PaymentController } from './payment.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = express.Router();

router.post(
    '/create-intent',
    authMiddleware,
    PaymentController.createPaymentIntent
);

router.post('/webhook', PaymentController.handleWebhook);

export const PaymentRoutes = router;
