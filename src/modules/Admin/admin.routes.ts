import express from 'express';
import { AdminController } from './admin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = express.Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id', AdminController.updateUser);

router.get('/events', AdminController.getEvents);
router.delete('/events/:id', AdminController.deleteEvent);

router.get('/reviews', AdminController.getReviews);
router.delete('/reviews/:id', AdminController.deleteReview);

export const AdminRoutes = router;
