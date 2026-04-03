import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const biddingController = {
  // Place a new bid
  placeBid: async (req, res) => {
    const { listingId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    try {
      // 1. Fetch listing and lock it for update
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { bids: { orderBy: { createdAt: 'desc' }, take: 1 } }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (listing.listingType !== 'auction') {
        return res.status(400).json({ error: 'This listing is not an auction' });
      }

      const now = new Date();
      if (listing.auctionEndsAt && now > listing.auctionEndsAt) {
        return res.status(400).json({ error: 'Auction has ended' });
      }

      // 2. Validate bid amount
      const currentPrice = listing.currentBid || listing.price || 0;
      if (amount <= currentPrice) {
        return res.status(400).json({ error: `Bid must be higher than current price ($${currentPrice})` });
      }

      // 3. Create bid and update listing in a transaction
      const updatedListing = await prisma.$transaction(async (tx) => {
        await tx.bid.create({
          data: {
            amount,
            userId,
            listingId
          }
        });

        return await tx.listing.update({
          where: { id: listingId },
          data: {
            currentBid: amount,
            bidCount: { increment: 1 },
            lastBidAt: new Date()
          }
        });
      });

      res.status(201).json({ 
        message: 'Bid placed successfully!', 
        currentBid: updatedListing.currentBid,
        bidCount: updatedListing.bidCount
      });

    } catch (error) {
      console.error('Bid Error:', error);
      res.status(500).json({ error: 'Failed to place bid' });
    }
  },

  // Get auction status
  getAuctionStatus: async (req, res) => {
    const { listingId } = req.params;
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          currentBid: true,
          bidCount: true,
          lastBidAt: true,
          auctionEndsAt: true,
          listingType: true
        }
      });
      res.json(listing);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch auction status' });
    }
  }
};

export default biddingController;
