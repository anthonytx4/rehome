import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const authWriteLimiter = createRateLimiter({
  keyPrefix: 'auth-write',
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});

router.post('/register', authWriteLimiter, register);
router.post('/login', authWriteLimiter, login);
router.post('/logout', logout);
router.get('/me', auth, getMe);

export default router;
