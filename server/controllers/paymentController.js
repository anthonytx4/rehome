const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createCheckoutSession = async (req, res) => {
  try {
    const { listingId, type } = req.body; // type: 'buy_now', 'bid_deposit', 'premium_subscription'
    const userId = req.user.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true }
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    let amount = 0;
    let name = '';
    let description = '';

    if (type === 'buy_now') {
      amount = Math.round(listing.price * 100);
      name = `Purchase: ${listing.petName}`;
      description = `Direct purchase of ${listing.breed} from ${listing.user.name}`;
    } else if (type === 'bid_deposit') {
      amount = 5000; // $50.00 deposit to bid on elite livestock
      name = `Bid Deposit: ${listing.petName}`;
      description = 'Fully refundable deposit to participate in the auction.';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name,
              description,
              images: JSON.parse(listing.images).slice(0,1),
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?success=false`,
      metadata: {
        userId,
        listingId,
        type
      }
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
};
