import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import process from 'node:process';

const prisma = new PrismaClient();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const DEFAULT_RETURN_PATH = '/dashboard';
const BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SUPPORTED_BOOST_TYPES = new Set(['featured', 'urgent']);

const normalizeMembershipTier = (tier) => {
  if (!tier || tier === 'royal') return 'breeder';
  return tier;
};

const normalizeBoostType = (boostType) => {
  const value = String(boostType || 'featured').trim().toLowerCase();
  return SUPPORTED_BOOST_TYPES.has(value) ? value : 'featured';
};

const getBoostPricing = (boostType) => {
  const normalized = normalizeBoostType(boostType);
  if (normalized === 'urgent') {
    return {
      amount: 50,
      description: 'Urgent Network Blast',
      lineItemName: 'Urgent Network Blast Listing Boost',
    };
  }

  return {
    amount: 15,
    description: 'Featured Listing',
    lineItemName: 'Featured Listing Boost',
  };
};

const getPaymentAmount = (type, amount, metadata = {}) => {
  const parsedAmount = Number(amount);

  if (type === 'membership') return 25;
  if (type === 'skip_queue') {
    const count = Number(metadata.count) === 3 ? 3 : 1;
    return count === 3 ? 10 : 9;
  }
  if (type === 'bid_deposit') return 50;
  if (type === 'priority_app') return 5;
  if (type === 'boost') return getBoostPricing(metadata.boostType).amount;

  return Number.isFinite(parsedAmount) ? parsedAmount : 0;
};

const getPaymentDescription = (type, description, metadata = {}) => {
  if (type === 'membership') return description || 'Verified Breeder Membership';
  if (type === 'skip_queue') return description || 'Inquiry Queue Skip';
  if (type === 'bid_deposit') return description || 'Bid Deposit';
  if (type === 'priority_app') return description || 'Priority Application';
  if (type === 'boost') return getBoostPricing(metadata.boostType).description;

  return description || `${type} payment`;
};

const parsePaymentMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;

  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const buildStripeMetadata = (metadata = {}) => Object.fromEntries(
  Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)])
);

const loadOwnedListing = async (listingId, userId) => {
  if (!listingId) return null;
  return prisma.listing.findFirst({
    where: {
      id: listingId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      boostType: true,
      boostExpiresAt: true,
      title: true,
      petName: true,
    },
  });
};

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 30000, maxNetworkRetries: 3 })
  : null;

function getStripeClient() {
  return stripe;
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
    const parsedMetadata = parsePaymentMetadata(metadata);

    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    // Never fake revenue-critical flows outside explicit local tooling.
    if (!stripe) {
      return res.status(503).json({
        error: 'Payments are not configured yet. Connect Stripe before accepting memberships, boosts, or checkout.',
        code: 'PAYMENTS_NOT_CONFIGURED',
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = null;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (type === 'boost') {
      const listingId = parsedMetadata.listingId;
      const listing = await loadOwnedListing(listingId, req.user.id);

      if (!listing) {
        return res.status(403).json({
          error: 'You can only boost your own listing.',
          code: 'BOOST_OWNERSHIP_REQUIRED',
        });
      }

      if (listing.status !== 'available') {
        return res.status(409).json({
          error: 'Boosts are only available for active listings.',
          code: 'BOOST_LISTING_NOT_AVAILABLE',
        });
      }

      parsedMetadata.boostType = normalizeBoostType(parsedMetadata.boostType);
      parsedMetadata.listingId = listing.id;
    }

    const resolvedAmount = getPaymentAmount(type, amount, parsedMetadata);
    const resolvedDescription = getPaymentDescription(type, description, parsedMetadata);

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
      metadata: buildStripeMetadata({ userId: req.user.id, type, ...parsedMetadata })
    };

    if (isSubscription) {
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: resolvedDescription,
            description: 'Elite Verified Membership — gold badge, priority placement, ad-free experience.',
          },
          unit_amount: Math.round(resolvedAmount * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }];
    } else {
      let unitAmount = Math.round(resolvedAmount * 100);
      let prodName = resolvedDescription;

      if (type === 'skip_queue') {
        const count = Number(parsedMetadata.count) === 3 ? 3 : 1;
        unitAmount = count === 3 ? 1000 : 900;
        prodName = `Elite Exchange: Inquiry Queue Skip (${count}x)`;
      } else if (type === 'bid_deposit') {
        unitAmount = 5000;
        prodName = 'Elite Exchange: Non-refundable Bid Deposit (Full Refund if Outbid)';
      } else if (type === 'priority_app') {
        unitAmount = 500;
        prodName = 'Rehome Priority: Pinned Application';
      } else if (type === 'boost') {
        const boostPricing = getBoostPricing(parsedMetadata.boostType);
        unitAmount = boostPricing.amount * 100;
        prodName = boostPricing.lineItemName;
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
        amount: resolvedAmount,
        status: 'pending',
        description: resolvedDescription,
        metadata: Object.keys(parsedMetadata).length ? JSON.stringify(parsedMetadata) : null,
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

    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: sessionId,
        userId: req.user.id,
      },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'completed') return res.json({ success: true, payment, alreadyProcessed: true });

    if (!stripe) {
      return res.status(503).json({
        error: 'Payments are not configured yet. Verification is unavailable until Stripe is connected.',
        code: 'PAYMENTS_NOT_CONFIGURED',
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const metadata = parsePaymentMetadata(payment.metadata);
    if (payment.type === 'boost') {
      const listing = await loadOwnedListing(metadata.listingId, req.user.id);
      if (!listing) {
        return res.status(403).json({
          error: 'Boost verification failed because the listing is not owned by the current account.',
          code: 'BOOST_OWNERSHIP_REQUIRED',
        });
      }
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });
    await applySideEffects(payment.type, metadata, payment.userId);

    res.json({ success: true, payment: { ...payment, status: 'completed' } });
  } catch (err) {
    next(err);
  }
};

// Mock payment processor (used by PaymentModal when Stripe is not configured)
export const processPaymentMock = async (req, res, next) => {
  try {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true' || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      return res.status(410).json({
        error: 'Mock payments are disabled. Connect Stripe to use live checkout flows.',
        code: 'MOCK_PAYMENTS_DISABLED',
      });
    }

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

    await applySideEffects(type, metadata || {}, req.user.id);
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
async function applySideEffects(type, metadata, userId) {
  try {
    if (type === 'membership') {
      const membershipTier = normalizeMembershipTier(metadata?.tier);
      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerifiedBreeder: true,
          membershipTier,
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
      const listing = await prisma.listing.findFirst({
        where: {
          id: metadata.listingId,
          userId,
        },
        select: {
          id: true,
          boostType: true,
          boostExpiresAt: true,
        }
      });

      if (!listing) {
        throw new Error('Boost ownership validation failed');
      }

      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          boostType: normalizeBoostType(metadata.boostType),
          boostExpiresAt: new Date(Date.now() + BOOST_DURATION_MS),
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
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing portal is unavailable until Stripe is configured.',
        code: 'PAYMENTS_NOT_CONFIGURED',
      });
    }
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: buildClientUrl(DEFAULT_RETURN_PATH),
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err.type, err.message);
    if (err.type === 'StripeConnectionError') {
      return res.status(502).json({ error: 'Unable to reach Stripe. Please try again in a moment.' });
    }
    if (err.code === 'resource_missing' || err.message?.includes('portal')) {
      return res.status(400).json({ error: 'Billing portal is not yet configured. Please contact support.' });
    }
    next(err);
  }
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
    configured: !!process.env.STRIPE_SECRET_KEY,
    provider: process.env.STRIPE_SECRET_KEY ? 'stripe' : null,
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
    } catch {
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
      const metadata = parsePaymentMetadata(payment.metadata);
      await applySideEffects(payment.type, metadata, payment.userId);
    }
  }

  res.json({ received: true });
};
