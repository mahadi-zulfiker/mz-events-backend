"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validator_middleware_1 = require("../../middlewares/validator.middleware");
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
router.get('/:id', user_controller_1.UserController.getProfile);
router.patch('/:id', auth_middleware_1.authMiddleware, (0, validator_middleware_1.validateRequest)(user_validation_1.updateUserSchema), user_controller_1.UserController.updateProfile);
router.get('/:id/events', user_controller_1.UserController.getUserEvents);
router.get('/:id/reviews', user_controller_1.UserController.getUserReviews);
exports.UserRoutes = router;
