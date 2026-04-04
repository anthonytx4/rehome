import { Router } from 'express';
import { getInbox, getThread, sendMessage, checkQueue, markRead } from '../controllers/messagesController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/inbox', auth, getInbox);
router.get('/queue/:listingId', auth, checkQueue);
router.post('/read', auth, markRead);
router.get('/:listingId', auth, getThread);
router.post('/', auth, upload.single('media'), sendMessage);

export default router;
