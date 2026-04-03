import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import listingsRoutes from './routes/listings.js';
import messagesRoutes from './routes/messages.js';
import favoritesRoutes from './routes/favorites.js';
import reviewsRoutes from './routes/reviews.js';
import usersRoutes from './routes/users.js';
import paymentsRoutes from './routes/payments.js';
import biddingRoutes from './routes/bidding.js';
import { handleWebhook } from './controllers/paymentsController.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://rehome.world',
  'https://www.rehome.world'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow when no origin (e.g., server-to-server), any allowedOrigins,
    // or any localhost origin regardless of port (helps local preview/dev).
    if (!origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        (typeof origin === 'string' && origin.startsWith('http://localhost'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Raw body for Stripe webhook signature verification (must come before express.json)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());
app.use(cookieParser());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/bidding', biddingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Only listen if not running as a Vercel Function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🐾 Rehome API running on http://localhost:${PORT}`);
  });
}

export default app;
