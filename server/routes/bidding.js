import express from 'express';
import biddingController from '../controllers/biddingController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/bidding/:listingId/bid - Place a new bid
router.post('/:listingId/bid', auth, biddingController.placeBid);

// GET /api/bidding/:listingId/auction - Get auction status
router.get('/:listingId/auction', biddingController.getAuctionStatus);

export default router;
