"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const validator_middleware_1 = require("../../middlewares/validator.middleware");
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
router.post('/register', (0, validator_middleware_1.validateRequest)(auth_validation_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validator_middleware_1.validateRequest)(auth_validation_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh', auth_controller_1.AuthController.refresh);
router.post('/logout', auth_controller_1.AuthController.logout);
exports.AuthRoutes = router;
