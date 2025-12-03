import express from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validator.middleware';
import { updateUserSchema } from './user.validation';

const router = express.Router();

router.get('/:id', UserController.getProfile);
router.patch(
    '/:id',
    authMiddleware,
    validateRequest(updateUserSchema),
    UserController.updateProfile
);
router.get('/:id/events', UserController.getUserEvents);
router.get('/:id/reviews', UserController.getUserReviews);

export const UserRoutes = router;
