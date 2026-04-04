import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createCheckoutSession,
  verifySession,
  getPaymentHistory,
  releaseEscrow,
  getStripeConfig,
  createPortalSession
} from '../controllers/paymentsController.js';

const router = express.Router();

// Public config
router.get('/config', getStripeConfig);

// All other routes require auth
router.use(authenticate);

router.post('/checkout', createCheckoutSession);
router.get('/verify', verifySession);
router.get('/history', getPaymentHistory);
router.post('/portal', createPortalSession);

// Admin / Escrow management
router.post('/escrow/:paymentId/release', authorize('admin'), releaseEscrow);

export default router;
