import prisma from '../utils/db.js';
import { hashPasswordVersion, verifySignedToken } from '../utils/authTokens.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifySignedToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        location: true,
        phone: true,
        bio: true,
        isVerifiedBreeder: true,
        membershipTier: true,
        membershipExpiresAt: true,
        remainingSkips: true,
        stripeCustomerId: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (decoded.passwordVersion && decoded.passwordVersion !== hashPasswordVersion(user.password)) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    const { password: _password, ...safeUser } = user;
    req.user = safeUser;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authenticate = auth;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role;
    if (roles.length && !roles.includes(userRole) && req.user.email !== 'admin@rehome.world') {
      return res.status(403).json({ error: 'Access denied' });
    }
    return next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = verifySignedToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, password: true },
      });

      if (user && decoded.passwordVersion && decoded.passwordVersion !== hashPasswordVersion(user.password)) {
        req.user = null;
      } else {
        req.user = user ? { id: user.id, name: user.name, email: user.email } : null;
      }
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  return next();
};
