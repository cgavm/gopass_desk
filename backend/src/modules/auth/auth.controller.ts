import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { LoginInput } from './auth.dto';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user and issue tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Access token issued; refresh token set as httpOnly cookie
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(req.body as LoginInput);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh token cookie
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or revoked refresh token
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const body = req.body as Record<string, unknown> | undefined;
    const refreshToken = String(cookies?.refreshToken ?? body?.refreshToken);
    const result = await authService.refresh(refreshToken);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate refresh token and clear cookie
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const body = req.body as Record<string, unknown> | undefined;
    const refreshToken = String(cookies?.refreshToken ?? body?.refreshToken);
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
