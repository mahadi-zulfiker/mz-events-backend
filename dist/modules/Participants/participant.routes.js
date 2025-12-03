"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantRoutes = void 0;
const express_1 = __importDefault(require("express"));
const participant_controller_1 = require("./participant.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = express_1.default.Router();
router.post('/:eventId/join', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('USER', 'HOST', 'ADMIN'), participant_controller_1.ParticipantController.joinEvent);
router.post('/:eventId/leave', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('USER', 'HOST', 'ADMIN'), participant_controller_1.ParticipantController.leaveEvent);
router.get('/:eventId/participants', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('HOST', 'ADMIN'), participant_controller_1.ParticipantController.getParticipants);
exports.ParticipantRoutes = router;
