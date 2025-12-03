import express from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validator.middleware';
import { loginSchema, registerSchema } from './auth.validation';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export const AuthRoutes = router;
