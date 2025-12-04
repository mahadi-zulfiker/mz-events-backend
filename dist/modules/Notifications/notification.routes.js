"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authMiddleware);
router.get('/', notification_controller_1.NotificationController.list);
router.put('/:id/read', notification_controller_1.NotificationController.markRead);
router.put('/read-all', notification_controller_1.NotificationController.markAllRead);
exports.NotificationRoutes = router;
