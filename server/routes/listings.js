import { Router } from 'express';
import { getListings, getListingById, createListing, updateListing, deleteListing, getUserListings, moderateListing } from '../controllers/listingsController.js';
import { auth, authorize, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();
const listingWriteLimiter = createRateLimiter({
  keyPrefix: 'listings-write',
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'You are updating listings too quickly. Please wait a moment and try again.',
});

router.get('/', getListings);
router.get('/user/:userId', optionalAuth, getUserListings);
router.post('/:id/moderate', auth, authorize('admin'), moderateListing);
router.get('/:id', optionalAuth, getListingById);
router.post('/', auth, listingWriteLimiter, upload.array('images', 8), createListing);
router.put('/:id', auth, listingWriteLimiter, upload.array('images', 8), updateListing);
router.delete('/:id', auth, deleteListing);

export default router;
