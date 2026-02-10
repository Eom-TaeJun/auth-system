import type { FastifyInstance } from 'fastify';
import type {
  ForgotPasswordRequestContract,
  LoginRequestContract,
  MessageResponseContract,
  RegisterRequestContract,
  ResetPasswordRequestContract,
} from '@contracts';
import {
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from '../services/authService';
import { AuthError, ErrorCodes } from '../utils/errors';
import { config } from '../config/env';
import {
  authRateLimitConfig,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailQuerySchema,
} from './schemas/authSchemas';
const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Authentication endpoints.
 */
export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', authRateLimitConfig, async (request, reply) => {
    const payload = registerSchema.parse(request.body) as RegisterRequestContract;
    const result = await register(payload);

    reply.status(201).send(result);
  });

  fastify.post('/login', authRateLimitConfig, async (request, reply) => {
    const payload = loginSchema.parse(request.body) as LoginRequestContract;
    const deviceInfo = getDeviceInfo(request.headers['user-agent']);

    const result = await login({
      ...payload,
      deviceInfo,
    });

    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: config.app.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    });

    reply.send({
      accessToken: result.accessToken,
      user: result.user,
    });
  });

  fastify.post('/refresh', authRateLimitConfig, async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      throw new AuthError('Refresh token not found', ErrorCodes.INVALID_TOKEN, 401);
    }

    const result = await refresh(refreshToken);
    reply.send(result);
  });

  fastify.post('/logout', authRateLimitConfig, async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await logout(refreshToken);
    }

    reply.clearCookie('refreshToken', { path: '/' });
    const payload: MessageResponseContract = { message: 'Logged out successfully' };
    reply.send(payload);
  });

  fastify.get('/verify-email', authRateLimitConfig, async (request, reply) => {
    const { token } = verifyEmailQuerySchema.parse(request.query);
    await verifyEmail(token);

    const payload: MessageResponseContract = { message: 'Email verified successfully' };
    reply.send(payload);
  });

  fastify.post('/forgot-password', authRateLimitConfig, async (request, reply) => {
    const { email } = forgotPasswordSchema.parse(request.body) as ForgotPasswordRequestContract;
    await requestPasswordReset(email);

    const payload: MessageResponseContract = {
      message: 'If the email exists, a reset link has been sent.',
    };
    reply.send(payload);
  });

  fastify.post('/reset-password', authRateLimitConfig, async (request, reply) => {
    const { token, password } = resetPasswordSchema.parse(request.body) as ResetPasswordRequestContract;
    await resetPassword(token, password);

    const payload: MessageResponseContract = { message: 'Password reset successfully' };
    reply.send(payload);
  });
}

function getDeviceInfo(userAgent: string | string[] | undefined): string | undefined {
  if (!userAgent) {
    return undefined;
  }

  return Array.isArray(userAgent)
    ? userAgent.join(', ')
    : userAgent;
}
