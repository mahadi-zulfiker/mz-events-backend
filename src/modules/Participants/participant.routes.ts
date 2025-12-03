import express from 'express';
import { ParticipantController } from './participant.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = express.Router();

router.post(
    '/:eventId/join',
    authMiddleware,
    requireRole('USER', 'HOST', 'ADMIN'),
    ParticipantController.joinEvent
);

router.post(
    '/:eventId/leave',
    authMiddleware,
    requireRole('USER', 'HOST', 'ADMIN'),
    ParticipantController.leaveEvent
);

router.get(
    '/:eventId/participants',
    authMiddleware,
    requireRole('HOST', 'ADMIN'),
    ParticipantController.getParticipants
);

export const ParticipantRoutes = router;
