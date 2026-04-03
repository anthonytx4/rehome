import { Router } from 'express';
import {
  createCheckoutSession,
  verifySession,
  createPortalSession,
  processPaymentMock,
  getPaymentHistory,
  getStripeConfig,
} from '../controllers/paymentsController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/config', getStripeConfig);

// Stripe Checkout flow
router.post('/checkout', auth, createCheckoutSession);
router.get('/verify', auth, verifySession);
router.post('/portal', auth, createPortalSession);

// Mock/fallback payment (used by PaymentModal when Stripe not configured)
router.post('/process', auth, processPaymentMock);

// History
router.get('/history', auth, getPaymentHistory);

export default router;
