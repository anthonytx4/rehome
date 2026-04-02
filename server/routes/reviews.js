import { Router } from 'express';
import { getReviewsByUser, createReview } from '../controllers/reviewsController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/user/:userId', getReviewsByUser);
router.post('/', auth, createReview);

export default router;
