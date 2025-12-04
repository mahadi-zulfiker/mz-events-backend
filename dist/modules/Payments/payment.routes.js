"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("./payment.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = express_1.default.Router();
router.post('/create-intent', auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.createPaymentIntent);
router.post('/confirm', auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.confirmPayment);
router.get('/history', auth_middleware_1.authMiddleware, payment_controller_1.PaymentController.getPaymentHistory);
router.get('/revenue', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('HOST', 'ADMIN'), payment_controller_1.PaymentController.getHostRevenue);
router.post('/refund', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('HOST', 'ADMIN'), payment_controller_1.PaymentController.requestRefund);
router.post('/webhook', payment_controller_1.PaymentController.handleWebhook);
exports.PaymentRoutes = router;
