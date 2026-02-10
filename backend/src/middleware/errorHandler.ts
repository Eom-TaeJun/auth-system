import type {
  FastifyError,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import type {
  ApiErrorPayload,
  ApiValidationIssue,
} from '@contracts';
import { ZodError } from 'zod';
import { AuthError } from '../utils/errors';

/**
 * Global error handler for API routes.
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AuthError) {
    reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    sendValidationError(
      reply,
      error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
    );
    return;
  }

  if (error.validation) {
    sendValidationError(reply);
    return;
  }

  request.log.error(error);
  reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

function sendValidationError(
  reply: FastifyReply,
  details?: ApiValidationIssue[]
): void {
  const payload: ApiErrorPayload = {
    error: 'VALIDATION_ERROR',
    message: 'Invalid input',
  };
  if (details) {
    payload.details = details;
  }

  reply.status(400).send(payload);
}
