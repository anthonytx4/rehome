const rateLimitStore = new Map();

const pruneExpiredEntries = (now) => {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
};

export const createRateLimiter = ({
  keyPrefix,
  windowMs,
  max,
  message = 'Too many requests. Please slow down and try again shortly.',
}) => {
  if (!keyPrefix || !windowMs || !max) {
    throw new Error('createRateLimiter requires keyPrefix, windowMs, and max');
  }

  return (req, res, next) => {
    const now = Date.now();
    pruneExpiredEntries(now);

    const actorId = req.user?.id || req.ip || 'anonymous';
    const routeKey = `${keyPrefix}:${actorId}`;
    const existing = rateLimitStore.get(routeKey);

    if (!existing || existing.resetAt <= now) {
      rateLimitStore.set(routeKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
    }

    existing.count += 1;
    rateLimitStore.set(routeKey, existing);
    return next();
  };
};
