"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("./review.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const validator_middleware_1 = require("../../middlewares/validator.middleware");
const review_validation_1 = require("./review.validation");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('USER', 'HOST', 'ADMIN'), (0, validator_middleware_1.validateRequest)(review_validation_1.createReviewSchema), review_controller_1.ReviewController.createReview);
router.get('/host/:hostId', review_controller_1.ReviewController.getHostReviews);
router.get('/event/:eventId', review_controller_1.ReviewController.getEventReviews);
router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('USER', 'HOST', 'ADMIN'), review_controller_1.ReviewController.updateReview);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('ADMIN'), review_controller_1.ReviewController.deleteReview);
exports.ReviewRoutes = router;
