import { Router } from 'express';
import { getInbox, getThread, sendMessage, checkQueue, markRead } from '../controllers/messagesController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const messageSendLimiter = createRateLimiter({
  keyPrefix: 'messages-send',
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'You are sending messages too quickly. Please slow down and try again.',
});

router.get('/inbox', auth, getInbox);
router.get('/queue/:listingId', auth, checkQueue);
router.post('/read', auth, markRead);
router.get('/:listingId', auth, getThread);
router.post('/', auth, messageSendLimiter, upload.single('media'), sendMessage);

export default router;
