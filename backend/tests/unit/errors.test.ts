import { AuthError, ErrorCodes } from '../../src/utils/errors';

describe('AuthError', () => {
  it('uses provided status code', () => {
    const error = new AuthError('Invalid', ErrorCodes.INVALID_TOKEN, 401);

    expect(error.name).toBe('AuthError');
    expect(error.message).toBe('Invalid');
    expect(error.code).toBe(ErrorCodes.INVALID_TOKEN);
    expect(error.statusCode).toBe(401);
  });

  it('defaults status code to 400', () => {
    const error = new AuthError('Weak password', ErrorCodes.WEAK_PASSWORD);

    expect(error.statusCode).toBe(400);
  });
});
