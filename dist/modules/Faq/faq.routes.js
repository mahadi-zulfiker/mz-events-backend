"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqRoutes = void 0;
const express_1 = __importDefault(require("express"));
const faq_controller_1 = require("./faq.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const validator_middleware_1 = require("../../middlewares/validator.middleware");
const faq_validation_1 = require("./faq.validation");
const router = express_1.default.Router();
router.get('/', faq_controller_1.FaqController.getFaqs);
router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('ADMIN'), (0, validator_middleware_1.validateRequest)(faq_validation_1.createFaqSchema), faq_controller_1.FaqController.createFaq);
router.patch('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('ADMIN'), (0, validator_middleware_1.validateRequest)(faq_validation_1.updateFaqSchema), faq_controller_1.FaqController.updateFaq);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('ADMIN'), faq_controller_1.FaqController.deleteFaq);
exports.FaqRoutes = router;
