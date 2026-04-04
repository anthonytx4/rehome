import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  createCheckoutSession,
  verifySession,
  getPaymentHistory,
  releaseEscrow,
  getStripeConfig,
  createPortalSession
} from '../controllers/paymentsController.js';

const router = express.Router();
const paymentWriteLimiter = createRateLimiter({
  keyPrefix: 'payments-write',
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'Payment requests are being made too quickly. Please wait and try again.',
});
const paymentReadLimiter = createRateLimiter({
  keyPrefix: 'payments-read',
  windowMs: 5 * 60 * 1000,
  max: 40,
  message: 'Too many payment status checks. Please slow down and try again.',
});

// Public config
router.get('/config', getStripeConfig);

// All other routes require auth
router.use(authenticate);

router.post('/checkout', paymentWriteLimiter, createCheckoutSession);
router.get('/verify', paymentReadLimiter, verifySession);
router.get('/history', paymentReadLimiter, getPaymentHistory);
router.post('/portal', paymentWriteLimiter, createPortalSession);

// Admin / Escrow management
router.post('/escrow/:paymentId/release', paymentWriteLimiter, authorize('admin'), releaseEscrow);

export default router;
