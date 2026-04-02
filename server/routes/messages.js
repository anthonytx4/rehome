import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/inbox', auth, getInbox);
router.get('/:listingId', auth, getThread);
router.post('/', auth, upload.single('media'), sendMessage);

export default router;
