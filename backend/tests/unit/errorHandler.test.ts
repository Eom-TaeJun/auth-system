import { ZodError } from 'zod';
import { errorHandler } from '../../src/middleware/errorHandler';
import { AuthError, ErrorCodes } from '../../src/utils/errors';

function createReplyMock() {
  const send = jest.fn();
  const status = jest.fn().mockReturnValue({ send });

  return { status, send };
}

describe('errorHandler', () => {
  it('returns auth error code and status from AuthError', () => {
    const reply = createReplyMock();
    const request = { log: { error: jest.fn() } } as any;
    const error = new AuthError('No access', ErrorCodes.INVALID_TOKEN, 401);

    errorHandler(error as any, request, reply as any);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      error: ErrorCodes.INVALID_TOKEN,
      message: 'No access',
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('returns validation details for ZodError', () => {
    const reply = createReplyMock();
    const request = { log: { error: jest.fn() } } as any;
    const error = new ZodError([
      {
        code: 'custom',
        path: ['email'],
        message: 'Invalid email',
      },
    ]);

    errorHandler(error as any, request, reply as any);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: [{ path: 'email', message: 'Invalid email' }],
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('handles Fastify schema validation error shape', () => {
    const reply = createReplyMock();
    const request = { log: { error: jest.fn() } } as any;
    const error = { validation: [{ instancePath: '/email' }] };

    errorHandler(error as any, request, reply as any);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
    });
    expect(request.log.error).not.toHaveBeenCalled();
  });

  it('logs and masks unexpected errors', () => {
    const reply = createReplyMock();
    const request = { log: { error: jest.fn() } } as any;
    const error = new Error('Unexpected failure');

    errorHandler(error as any, request, reply as any);

    expect(request.log.error).toHaveBeenCalledWith(error);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  });
});
