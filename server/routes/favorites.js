import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoritesController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getFavorites);
router.post('/:listingId', auth, addFavorite);
router.delete('/:listingId', auth, removeFavorite);

export default router;
