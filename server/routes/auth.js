import { Router } from 'express';
import { register, login, logout, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const authWriteLimiter = createRateLimiter({
  keyPrefix: 'auth-write',
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});
const passwordResetLimiter = createRateLimiter({
  keyPrefix: 'password-reset',
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many password reset attempts. Please wait a bit and try again.',
});

router.post('/register', authWriteLimiter, register);
router.post('/login', authWriteLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/logout', logout);
router.get('/me', auth, getMe);

export default router;
