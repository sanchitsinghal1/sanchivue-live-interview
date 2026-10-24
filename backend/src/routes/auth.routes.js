// src/routes/auth.routes.js
import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

// All auth routes are mounted under /api/v1/auth.
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', verifyJWT, logout);
router.post('/refresh', refresh);
router.get('/me', verifyJWT, me);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/change-password', verifyJWT, validate(changePasswordSchema), changePassword);

export default router;
