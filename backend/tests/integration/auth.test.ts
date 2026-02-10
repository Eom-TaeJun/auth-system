jest.mock('../../src/services/authService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  verifyEmail: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));

import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import authRoutes from '../../src/routes/auth';
import * as authService from '../../src/services/authService';
import { errorHandler } from '../../src/middleware/errorHandler';

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(cookie);
    app.setErrorHandler(errorHandler);
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAuthService.register.mockResolvedValue({
      userId: 'user-id',
      message: 'Registration successful. Please verify your email.',
    });
    mockedAuthService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-id',
        email: 'test@example.com',
        email_verified: true,
      },
    });
    mockedAuthService.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
    });
    mockedAuthService.logout.mockResolvedValue();
    mockedAuthService.verifyEmail.mockResolvedValue();
    mockedAuthService.requestPasswordReset.mockResolvedValue();
    mockedAuthService.resetPassword.mockResolvedValue();
  });

  it('POST /api/auth/register returns 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'Test123!@#',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      userId: 'user-id',
      message: 'Registration successful. Please verify your email.',
    });
    expect(mockedAuthService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Test123!@#',
    });
  });

  it('POST /api/auth/login sets refresh cookie and returns access token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'Test123!@#',
      },
    });

    const setCookie = response.headers['set-cookie'];

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-id',
        email: 'test@example.com',
        email_verified: true,
      },
    });
    expect(String(setCookie)).toContain('refreshToken=refresh-token');
  });

  it('POST /api/auth/login forwards multi-value user-agent header', async () => {
    const requestOptions: any = {
      method: 'POST',
      url: '/api/auth/login',
      headers: {
        'user-agent': ['agent-a', 'agent-b'],
      },
      payload: {
        email: 'test@example.com',
        password: 'Test123!@#',
      },
    };
    const response = await app.inject(requestOptions);

    expect(response.statusCode).toBe(200);
    expect(mockedAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Test123!@#',
      deviceInfo: 'agent-a,agent-b',
    });
  });

  it('POST /api/auth/refresh returns 401 when refresh cookie is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
    });

    expect(response.statusCode).toBe(401);
    expect(mockedAuthService.refresh).not.toHaveBeenCalled();
  });

  it('POST /api/auth/refresh returns access token when cookie exists', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: {
        refreshToken: 'refresh-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      accessToken: 'new-access-token',
    });
    expect(mockedAuthService.refresh).toHaveBeenCalledWith('refresh-token');
  });

  it('POST /api/auth/logout clears cookie and revokes refresh token when present', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: {
        refreshToken: 'refresh-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Logged out successfully' });
    expect(mockedAuthService.logout).toHaveBeenCalledWith('refresh-token');
    expect(String(response.headers['set-cookie'])).toContain('refreshToken=');
  });

  it('POST /api/auth/logout succeeds without refresh cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(response.statusCode).toBe(200);
    expect(mockedAuthService.logout).not.toHaveBeenCalled();
  });

  it('GET /api/auth/verify-email verifies token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/verify-email?token=verify-token',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Email verified successfully' });
    expect(mockedAuthService.verifyEmail).toHaveBeenCalledWith('verify-token');
  });

  it('POST /api/auth/forgot-password always returns generic success message', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {
        email: 'test@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: 'If the email exists, a reset link has been sent.',
    });
    expect(mockedAuthService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('POST /api/auth/reset-password consumes token and updates password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: {
        token: 'reset-token',
        password: 'NewStrong123!@#',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Password reset successfully' });
    expect(mockedAuthService.resetPassword).toHaveBeenCalledWith(
      'reset-token',
      'NewStrong123!@#'
    );
  });
});
