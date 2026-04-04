import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { normalizeEmailAddress, sanitizeText } from '../utils/marketplaceSafety.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rehome-dev-secret-key-change-in-prod';
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, location } = req.body;
    const normalizedName = sanitizeText(name, { maxLength: 120 });
    const normalizedEmail = normalizeEmailAddress(email);
    const normalizedLocation = sanitizeText(location, { maxLength: 160 }) || null;

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, password: hashedPassword, location: normalizedLocation },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        location: true,
        isVerifiedBreeder: true,
        membershipTier: true,
        membershipExpiresAt: true,
        remainingSkips: true,
        createdAt: true,
      }
    });

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmailAddress(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};
