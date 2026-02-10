jest.mock('../../src/models/User', () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../src/services/tokenService', () => ({
  verifyAccessToken: jest.fn(),
}));

import Fastify, { type FastifyInstance } from 'fastify';
import userRoutes from '../../src/routes/users';
import { errorHandler } from '../../src/middleware/errorHandler';
import * as UserModel from '../../src/models/User';
import { verifyAccessToken } from '../../src/services/tokenService';

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

describe('Users Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    app.setErrorHandler(errorHandler);
    await app.register(userRoutes, { prefix: '/api/users' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/users/me returns 401 without bearer token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: 'INVALID_TOKEN',
    });
  });

  it('GET /api/users/me returns current user without password hash', async () => {
    mockedVerifyAccessToken.mockReturnValue({
      userId: 'user-1',
      iat: 1,
      exp: 2,
    });
    mockedUserModel.findById.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      password_hash: 'hashed',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      email_verified: true,
    });
    expect(response.json()).not.toHaveProperty('password_hash');
  });

  it('GET /api/users/me returns 401 when token payload has no userId', async () => {
    mockedVerifyAccessToken.mockReturnValue({
      iat: 1,
      exp: 2,
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: 'INVALID_TOKEN',
      message: 'Missing user context',
    });
  });

  it('GET /api/users/me returns 404 when user does not exist', async () => {
    mockedVerifyAccessToken.mockReturnValue({
      userId: 'missing-user',
      iat: 1,
      exp: 2,
    });
    mockedUserModel.findById.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: 'USER_NOT_FOUND',
    });
  });

  it('PATCH /api/users/me updates and returns user', async () => {
    mockedVerifyAccessToken.mockReturnValue({
      userId: 'user-1',
      iat: 1,
      exp: 2,
    });
    mockedUserModel.update.mockResolvedValue({
      id: 'user-1',
      email: 'changed@example.com',
      password_hash: 'hashed',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/me',
      headers: {
        authorization: 'Bearer valid-token',
      },
      payload: {
        email: 'changed@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 'user-1',
      email: 'changed@example.com',
    });
    expect(mockedUserModel.update).toHaveBeenCalledWith('user-1', {
      email: 'changed@example.com',
    });
  });

  it('PATCH /api/users/me returns 404 when target user does not exist', async () => {
    mockedVerifyAccessToken.mockReturnValue({
      userId: 'missing-user',
      iat: 1,
      exp: 2,
    });
    mockedUserModel.update.mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/me',
      headers: {
        authorization: 'Bearer valid-token',
      },
      payload: {
        email: 'missing@example.com',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: 'USER_NOT_FOUND',
    });
  });
});
