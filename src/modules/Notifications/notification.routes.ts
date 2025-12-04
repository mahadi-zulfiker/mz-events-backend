import express from 'express';
import { NotificationController } from './notification.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = express.Router();

// Public contact-to-admin endpoint (stores as admin notification)
router.post('/contact', NotificationController.contact);

router.use(authMiddleware);

router.get('/', NotificationController.list);
router.put('/:id/read', NotificationController.markRead);
router.put('/read-all', NotificationController.markAllRead);

export const NotificationRoutes = router;
