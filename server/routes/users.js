import { Router } from 'express';
import { getUserProfile, updateProfile, getAdminInsights } from '../controllers/usersController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/insights', auth, getAdminInsights);
router.get('/:id', getUserProfile);
router.put('/me', auth, upload.single('avatar'), updateProfile);

export default router;
