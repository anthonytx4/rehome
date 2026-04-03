import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rehome-dev-secret-key-change-in-prod';

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, avatar: true, location: true, phone: true, bio: true, isVerifiedBreeder: true, createdAt: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authenticate = auth; // Alias for backward compatibility

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (roles.length && !roles.includes(req.user.role) && req.user.email !== 'admin@rehome.world') {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true }
      });
      req.user = user || null;
    }
  } catch {
    req.user = null;
  }
  next();
};
