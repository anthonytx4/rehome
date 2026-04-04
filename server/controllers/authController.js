import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { normalizeEmailAddress, sanitizeText } from '../utils/marketplaceSafety.js';
import { generatePasswordResetToken, generateSessionToken, hashPasswordVersion, verifySignedToken } from '../utils/authTokens.js';
import { getPasswordResetEmailStatus, sendPasswordResetEmail } from '../utils/email.js';

const prisma = new PrismaClient();
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RESET_EXPIRY_MINUTES = 30;
const PASSWORD_RESET_PREVIEW_ENABLED = process.env.NODE_ENV !== 'production';
const DEFAULT_CLIENT_URL = (process.env.NODE_ENV === 'production' || process.env.VERCEL)
  ? 'https://www.rehome.world'
  : 'http://localhost:5173';
const CLIENT_URL = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
const PASSWORD_RESET_GENERIC_MESSAGE = 'If an account exists for that email, Rehome will prepare password reset instructions.';

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
      },
    });

    const token = generateSessionToken(user.id, hashedPassword);
    setTokenCookie(res, token);

    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
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

    const token = generateSessionToken(user.id, user.password);
    setTokenCookie(res, token);

    const { password: _password, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword, token });
  } catch (err) {
    return next(err);
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

export const forgotPassword = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmailAddress(req.body?.email);

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    const deliveryStatus = getPasswordResetEmailStatus();

    const baseResponse = {
      message: PASSWORD_RESET_GENERIC_MESSAGE,
      delivery: deliveryStatus.configured ? 'email' : (PASSWORD_RESET_PREVIEW_ENABLED ? 'preview' : 'blocked_externally'),
      expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
      supportEmail: deliveryStatus.supportEmail,
    };

    if (!user) {
      return res.json(baseResponse);
    }

    const token = generatePasswordResetToken(user.id, user.password);
    const resetUrl = new URL('/reset-password', CLIENT_URL);
    resetUrl.searchParams.set('token', token);

    if (deliveryStatus.configured) {
      await sendPasswordResetEmail({
        to: normalizedEmail,
        resetUrl: resetUrl.toString(),
        expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
      });

      return res.json({
        ...baseResponse,
        message: 'If the account exists, a password reset email has been sent.',
      });
    }

    if (PASSWORD_RESET_PREVIEW_ENABLED) {
      return res.json({
        ...baseResponse,
        previewUrl: resetUrl.toString(),
      });
    }

    console.warn(`[password-reset] Reset requested for ${normalizedEmail}, but email delivery is not configured.`);

    return res.json({
      ...baseResponse,
      blockedReason: 'Password reset email delivery is not configured in this environment yet.',
      requiredSetup: 'Set RESEND_API_KEY and PASSWORD_RESET_FROM_EMAIL before advertising live self-serve password recovery.',
    });
  } catch (err) {
    return next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token = sanitizeText(req.body?.token, { maxLength: 2000 });
    const password = String(req.body?.password || '');

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const decoded = verifySignedToken(token);
    if (decoded?.purpose !== 'password-reset' || !decoded?.userId) {
      return res.status(400).json({ error: 'That reset link is invalid. Request a new one.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'That reset link is no longer valid. Request a new one.' });
    }

    if (decoded.passwordVersion !== hashPasswordVersion(user.password)) {
      return res.status(400).json({ error: 'That reset link has already been replaced. Request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({
      message: 'Password updated. Sign in with your new password.',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'That reset link expired. Request a new one.' });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'That reset link is invalid. Request a new one.' });
    }

    return next(err);
  }
};
