import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rehome-dev-secret-key-change-in-prod';

export const hashPasswordVersion = (passwordHash = '') => {
  const input = String(passwordHash || '');
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

export const generateSessionToken = (userId, passwordHash) => jwt.sign(
  { userId, passwordVersion: hashPasswordVersion(passwordHash) },
  JWT_SECRET,
  { expiresIn: '7d' }
);

export const generatePasswordResetToken = (userId, passwordHash) => jwt.sign(
  {
    userId,
    purpose: 'password-reset',
    passwordVersion: hashPasswordVersion(passwordHash),
  },
  JWT_SECRET,
  { expiresIn: '30m' }
);

export const verifySignedToken = (token) => jwt.verify(token, JWT_SECRET);
