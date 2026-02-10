jest.mock('../../src/services/tokenService', () => ({
  verifyAccessToken: jest.fn(),
}));

import { authenticate } from '../../src/middleware/authenticate';
import { verifyAccessToken } from '../../src/services/tokenService';
import { ErrorCodes } from '../../src/utils/errors';

const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when authorization header is missing', async () => {
    const request = { headers: {} } as any;

    await expect(authenticate(request, {} as any)).rejects.toMatchObject({
      code: ErrorCodes.INVALID_TOKEN,
      message: 'Missing access token',
    });
  });

  it('throws when bearer token is empty', async () => {
    const request = { headers: { authorization: 'Bearer    ' } } as any;

    await expect(authenticate(request, {} as any)).rejects.toMatchObject({
      code: ErrorCodes.INVALID_TOKEN,
      message: 'Missing access token',
    });
  });

  it('throws when token verification fails', async () => {
    mockedVerifyAccessToken.mockReturnValue(null);
    const request = { headers: { authorization: 'Bearer invalid-token' } } as any;

    await expect(authenticate(request, {} as any)).rejects.toMatchObject({
      code: ErrorCodes.INVALID_TOKEN,
      message: 'Invalid or expired access token',
    });
  });

  it('attaches userId for valid access token', async () => {
    mockedVerifyAccessToken.mockReturnValue({
      userId: 'user-1',
      iat: 1,
      exp: 2,
    });
    const request = { headers: { authorization: 'Bearer valid-token' } } as any;

    await expect(authenticate(request, {} as any)).resolves.toBeUndefined();
    expect(request.userId).toBe('user-1');
  });
});
