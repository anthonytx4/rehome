import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let stripeClientPromise;

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const DEFAULT_RETURN_PATH = '/dashboard';

async function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClientPromise) {
    stripeClientPromise = import('stripe')
      .then(({ default: Stripe }) => new Stripe(process.env.STRIPE_SECRET_KEY))
      .catch((error) => {
        console.error('Stripe SDK unavailable:', error);
        return null;
      });
  }

  return stripeClientPromise;
}

function buildClientUrl(pathname = DEFAULT_RETURN_PATH, params = {}) {
  const url = new URL(pathname, CLIENT_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

// Create a Stripe Checkout Session (hosted payment page)
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { type, amount, description, metadata, successPath, cancelPath } = req.body;
    const stripe = await getStripeClient();

    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    // If Stripe is not configured, use mock flow
    if (!stripe) {
      const payment = await prisma.payment.create({
        data: {
          type,
          amount: parseFloat(amount),
          status: 'completed',
          description: description || `${type} payment`,
          metadata: metadata ? JSON.stringify(metadata) : null,
          stripePaymentId: 'mock_' + Date.now(),
          userId: req.user.id,
        }
      });
      await applySideEffects(type, metadata, req.user.id, payment.stripePaymentId);
      return res.json({
        mock: true,
        success: true,
        payment,
        message: 'Mock payment completed',
        redirectUrl: buildClientUrl(successPath || DEFAULT_RETURN_PATH, {
          payment: 'success',
          type,
          session_id: payment.stripePaymentId,
        }),
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = null;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (user.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { stripeCustomerId: customer.id }
      });
    }

    const isSubscription = type === 'membership';
    const successUrl = buildClientUrl(successPath || DEFAULT_RETURN_PATH, {
      payment: 'success',
      type,
      session_id: '{CHECKOUT_SESSION_ID}',
    });
    const cancelUrl = buildClientUrl(cancelPath || DEFAULT_RETURN_PATH, {
      payment: 'cancelled',
      type,
    });

    const sessionConfig = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: req.user.id, type, ...(metadata || {}) }
    };

    if (isSubscription) {
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: description || 'Verified Breeder Membership',
            description: 'Elite Verified Membership — gold badge, priority placement, ad-free experience.',
          },
          unit_amount: Math.round(parseFloat(amount) * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }];
    } else {
      let unitAmount = Math.round(parseFloat(amount) * 100);
      let prodName = description || `${type} payment`;

      if (type === 'skip_queue') {
        const count = metadata?.count || 1;
        unitAmount = count === 3 ? 1000 : 700;
        prodName = `Elite Exchange: Inquiry Queue Skip (${count}x)`;
      } else if (type === 'bid_deposit') {
        unitAmount = 5000;
        prodName = 'Elite Exchange: Non-refundable Bid Deposit (Full Refund if Outbid)';
      } else if (type === 'priority_app') {
        unitAmount = 500;
        prodName = 'Rehome Priority: Pinned Application';
      }

      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: prodName },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    await prisma.payment.create({
      data: {
        type,
        amount: parseFloat(amount),
        status: 'pending',
        description: description || `${type} payment`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        stripePaymentId: session.id,
        userId: req.user.id,
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
};

// Verify a checkout session and apply side effects
export const verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const stripe = await getStripeClient();
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const payment = await prisma.payment.findFirst({ where: { stripePaymentId: sessionId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'completed') return res.json({ success: true, payment, alreadyProcessed: true });

    if (stripe && !sessionId.startsWith('mock_')) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Payment not completed' });
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    await applySideEffects(payment.type, metadata, payment.userId, sessionId);

    res.json({ success: true, payment: { ...payment, status: 'completed' } });
  } catch (err) {
    next(err);
  }
};

// Mock payment processor (used by PaymentModal when Stripe is not configured)
export const processPaymentMock = async (req, res, next) => {
  try {
    const { type, amount, description, metadata } = req.body;
    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    const payment = await prisma.payment.create({
      data: {
        type,
        amount: parseFloat(amount),
        status: 'completed',
        description: description || `${type} payment`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        stripePaymentId: 'mock_' + Date.now(),
        userId: req.user.id,
      }
    });

    await applySideEffects(type, metadata || {}, req.user.id, payment.stripePaymentId);
    res.json({ success: true, payment });
  } catch (err) { next(err); }
};

// Release Escrow
export const releaseEscrow = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment || payment.type !== 'escrow' || payment.status !== 'completed') {
      return res.status(400).json({ error: 'Invalid or incomplete escrow payment' });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'finalized', description: payment.description + ' (Funds Released to Seller)' }
    });

    res.json({ success: true, message: 'Funds released to seller via automated payout logic.' });
  } catch (err) {
    next(err);
  }
};

// Side Effects Handler
async function applySideEffects(type, metadata, userId, paymentId) {
  try {
    if (type === 'membership') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerifiedBreeder: true,
          membershipTier: 'breeder',
          membershipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      });
    }

    if (type === 'skip_queue') {
      const skipCount = metadata?.count || 1;
      await prisma.user.update({
        where: { id: userId },
        data: { remainingSkips: { increment: skipCount } }
      });
    }

    if (type === 'boost' && metadata?.listingId) {
      await prisma.listing.update({
        where: { id: metadata.listingId },
        data: {
          boostType: metadata.boostType || 'featured',
          boostExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      });
    }

    if (type === 'escrow' && metadata?.listingId) {
      await prisma.listing.update({
        where: { id: metadata.listingId },
        data: { status: 'sold' }
      });
    }
  } catch (err) {
    console.error('Error applying side effects:', err);
  }
}

export const createPortalSession = async (req, res, next) => {
  try {
    const stripe = await getStripeClient();
    if (!stripe) return res.json({ url: buildClientUrl(DEFAULT_RETURN_PATH), mock: true });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.stripeCustomerId) return res.status(400).json({ error: 'No Stripe customer found' });
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: buildClientUrl(DEFAULT_RETURN_PATH),
    });
    res.json({ url: session.url });
  } catch (err) { next(err); }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(payments);
  } catch (err) { next(err); }
};

export const getStripeConfig = async (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    configured: !!process.env.STRIPE_SECRET_KEY
  });
};

export const handleWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = await getStripeClient();
  let event;

  if (stripe && endpointSecret) {
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  } else {
    try {
      event = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const payment = await prisma.payment.findFirst({ where: { stripePaymentId: session.id } });
    if (payment && payment.status !== 'completed') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      await applySideEffects(payment.type, metadata, payment.userId, session.id);
    }
  }

  res.json({ received: true });
};
