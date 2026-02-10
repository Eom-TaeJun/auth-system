import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { UpdateProfileRequestContract } from '@contracts';
import { authenticate } from '../middleware/authenticate';
import * as UserModel from '../models/User';
import { AuthError, ErrorCodes } from '../utils/errors';
import { updateProfileSchema } from './schemas/userSchemas';

/**
 * Protected user endpoints.
 */
export default async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const user = await UserModel.findById(userId);

    assertUserExists(user);

    reply.send(toPublicUser(user));
  });

  fastify.patch('/me', { preHandler: authenticate }, async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const { email } = updateProfileSchema.parse(request.body) as UpdateProfileRequestContract;

    const updates: UserModel.UpdateUserData = {};
    const normalizedEmail = normalizeOptionalEmail(email);
    if (normalizedEmail !== undefined) {
      updates.email = normalizedEmail;
    }

    const user = await UserModel.update(userId, updates);
    assertUserExists(user);

    reply.send(toPublicUser(user));
  });
}

function getAuthenticatedUserId(request: FastifyRequest): string {
  if (!request.userId) {
    throw new AuthError('Missing user context', ErrorCodes.INVALID_TOKEN, 401);
  }

  return request.userId;
}

function toPublicUser(user: UserModel.User): Omit<UserModel.User, 'password_hash'> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

function normalizeOptionalEmail(email: string | undefined): string | undefined {
  if (email === undefined) {
    return undefined;
  }

  return email.trim().toLowerCase();
}

function assertUserExists(user: UserModel.User | null): asserts user is UserModel.User {
  if (!user) {
    throw new AuthError('User not found', ErrorCodes.USER_NOT_FOUND, 404);
  }
}
