import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createCheckoutSession,
  verifySession,
  processPaymentMock,
  getPaymentHistory,
  releaseEscrow,
  getStripeConfig
} from '../controllers/paymentsController.js';

const router = express.Router();

// Public config
router.get('/config', getStripeConfig);

// All other routes require auth
router.use(authenticate);

router.post('/checkout', createCheckoutSession);
router.get('/verify', verifySession);
router.post('/process-mock', processPaymentMock);
router.get('/history', getPaymentHistory);

// Admin / Escrow management
router.post('/escrow/:paymentId/release', authorize('admin'), releaseEscrow);

export default router;
