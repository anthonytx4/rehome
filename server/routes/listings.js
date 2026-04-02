import { Router } from 'express';
import { getListings, getListingById, createListing, updateListing, deleteListing, getUserListings } from '../controllers/listingsController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', auth, upload.array('images', 8), createListing);
router.put('/:id', auth, upload.array('images', 8), updateListing);
router.delete('/:id', auth, deleteListing);
router.get('/user/:userId', getUserListings);

export default router;
