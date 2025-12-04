import express from 'express';
import { ReviewController } from './review.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validator.middleware';
import { createReviewSchema } from './review.validation';

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    requireRole('USER', 'HOST', 'ADMIN'),
    validateRequest(createReviewSchema),
    ReviewController.createReview
);
router.get('/host/:hostId', ReviewController.getHostReviews);
router.get('/event/:eventId', ReviewController.getEventReviews);
router.put('/:id', authMiddleware, requireRole('USER', 'HOST', 'ADMIN'), ReviewController.updateReview);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), ReviewController.deleteReview);

export const ReviewRoutes = router;
