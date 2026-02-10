import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../services/tokenService';
import { AuthError, ErrorCodes } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/**
 * Extracts and validates JWT access token from Authorization header.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing access token', ErrorCodes.INVALID_TOKEN, 401);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthError('Missing access token', ErrorCodes.INVALID_TOKEN, 401);
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new AuthError('Invalid or expired access token', ErrorCodes.INVALID_TOKEN, 401);
  }

  request.userId = payload.userId;
}
