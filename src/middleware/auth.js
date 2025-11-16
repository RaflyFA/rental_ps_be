import { verifyToken } from '../utils/jwt.js';

export function ensureAuthenticated(req, res, next) {
  try {
    const token = req.cookies?.access_token ?? req.session?.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const payload = verifyToken(token);
    if (payload.tokenType && payload.tokenType !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
