import express from 'express';
import { EventController } from './event.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validator.middleware';
import { createEventSchema, updateEventSchema } from './event.validation';

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    requireRole('HOST', 'ADMIN'),
    validateRequest(createEventSchema),
    EventController.createEvent
);

router.get('/', EventController.getAllEvents);
router.get('/search', EventController.getAllEvents);
router.get('/hosted/me', authMiddleware, requireRole('HOST', 'ADMIN', 'USER'), EventController.getHostedEvents);
router.get('/joined/me', authMiddleware, requireRole('HOST', 'ADMIN', 'USER'), EventController.getJoinedEvents);
router.get('/:id', EventController.getEventById);

router.patch(
    '/:id',
    authMiddleware,
    requireRole('HOST', 'ADMIN'),
    validateRequest(updateEventSchema),
    EventController.updateEvent
);

router.delete(
    '/:id',
    authMiddleware,
    requireRole('HOST', 'ADMIN'),
    EventController.deleteEvent
);

export const EventRoutes = router;
