import express from 'express';
import { FaqController } from './faq.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validator.middleware';
import { createFaqSchema, updateFaqSchema } from './faq.validation';

const router = express.Router();

router.get('/', FaqController.getFaqs);

router.post(
    '/',
    authMiddleware,
    requireRole('ADMIN'),
    validateRequest(createFaqSchema),
    FaqController.createFaq
);

router.patch(
    '/:id',
    authMiddleware,
    requireRole('ADMIN'),
    validateRequest(updateFaqSchema),
    FaqController.updateFaq
);

router.delete(
    '/:id',
    authMiddleware,
    requireRole('ADMIN'),
    FaqController.deleteFaq
);

export const FaqRoutes = router;
