import express from 'express';
import { ensureAuthenticated } from '../middleware/auth.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';
import { verifyPassword } from '../utils/password.js';

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
};
const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 1000 * 60 * 15,
};
const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

function buildPayload(user) {
  return {
    userId: user.id_user,
    username: user.username,
    role: user.role,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
      return res
        .status(400)
        .json({ message: 'username atau email dan password tidak boleh kosong' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          username ? { username } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
    });
    if (!user) {
      return res.status(422).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(422).json({ message: 'Invalid credentials' });
    }

    const payload = buildPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    req.session.token = accessToken;
    req.session.refreshToken = refreshToken;

    res
      .cookie('access_token', accessToken, accessCookieOptions)
      .cookie('refresh_token', refreshToken, refreshCookieOptions)
      .json({
        message: 'Login success',
        user: { username: user.username, email: user.email, role: user.role },
        session: {
          id: req.sessionID,
          cookie: {
            expires: req.session.cookie?.expires ?? null,
            maxAge: req.session.cookie?.maxAge ?? null,
          },
        },
      });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to process login' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res
      .clearCookie('access_token', accessCookieOptions)
      .clearCookie('refresh_token', refreshCookieOptions)
      .json({ message: 'Logged out' });
  });
});

router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token ?? req.session?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }
    const payload = verifyToken(refreshToken);
    if (payload.tokenType !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const basePayload = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
    const accessToken = signAccessToken(basePayload);
    const newRefreshToken = signRefreshToken(basePayload);
    req.session.token = accessToken;
    req.session.refreshToken = newRefreshToken;

    res
      .cookie('access_token', accessToken, accessCookieOptions)
      .cookie('refresh_token', newRefreshToken, refreshCookieOptions)
      .json({ message: 'Token refreshed' });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id_user: req.user.userId },
      select: { id_user: true, username: true, email: true, role: true, created_at: true },
    });
    res.json({ message: 'Profile data', user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

export default router;
