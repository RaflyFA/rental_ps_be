import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET ?? 'default-jwt-secret';
const defaultOptions = { expiresIn: '8h' };
const accessTokenDefaults = { expiresIn: '1d' };
const refreshTokenDefaults = { expiresIn: '7d' };

export function signToken(payload, options = {}) {
  return jwt.sign(payload, jwtSecret, { ...defaultOptions, ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

export function signAccessToken(payload, options = {}) {
  return signToken({ ...payload, tokenType: 'access' }, { ...accessTokenDefaults, ...options });
}

export function signRefreshToken(payload, options = {}) {
  return signToken({ ...payload, tokenType: 'refresh' }, { ...refreshTokenDefaults, ...options });
}
