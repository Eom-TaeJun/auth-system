jest.mock('../../src/models/User', () => ({
  existsByEmail: jest.fn(),
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../src/models/VerificationToken', () => ({
  create: jest.fn(),
  findValidToken: jest.fn(),
  markAsUsed: jest.fn(),
  deleteByUserAndType: jest.fn(),
}));

jest.mock('../../src/models/RefreshToken', () => ({
  create: jest.fn(),
  findValidToken: jest.fn(),
  revokeAllForUser: jest.fn(),
  revokeByTokenHash: jest.fn(),
}));

jest.mock('../../src/utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../src/utils/validators', () => ({
  normalizeEmail: jest.fn(),
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
}));

jest.mock('../../src/services/tokenService', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generateVerificationToken: jest.fn(),
  hashRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

import * as authService from '../../src/services/authService';
import * as UserModel from '../../src/models/User';
import * as VerificationTokenModel from '../../src/models/VerificationToken';
import * as RefreshTokenModel from '../../src/models/RefreshToken';
import * as passwordUtils from '../../src/utils/password';
import * as validators from '../../src/utils/validators';
import * as tokenService from '../../src/services/tokenService';
import * as emailService from '../../src/services/emailService';
import { ErrorCodes } from '../../src/utils/errors';
import type { User } from '../../src/models/User';
import type { VerificationToken } from '../../src/models/VerificationToken';
import type { RefreshToken } from '../../src/models/RefreshToken';

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedVerificationTokenModel = VerificationTokenModel as jest.Mocked<typeof VerificationTokenModel>;
const mockedRefreshTokenModel = RefreshTokenModel as jest.Mocked<typeof RefreshTokenModel>;
const mockedPasswordUtils = passwordUtils as jest.Mocked<typeof passwordUtils>;
const mockedValidators = validators as jest.Mocked<typeof validators>;
const mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;

const baseUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  password_hash: 'password-hash',
  email_verified: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const verificationToken: VerificationToken = {
  id: '22222222-2222-2222-2222-222222222222',
  user_id: baseUser.id,
  token: 'verification-token',
  token_type: 'email_verify',
  expires_at: new Date(Date.now() + 60_000),
  used_at: null,
  created_at: new Date(),
};

const refreshTokenRecord: RefreshToken = {
  id: '33333333-3333-3333-3333-333333333333',
  user_id: baseUser.id,
  token_hash: 'refresh-token-hash',
  expires_at: new Date(Date.now() + 60_000),
  revoked_at: null,
  device_info: null,
  created_at: new Date(),
};

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidators.normalizeEmail.mockImplementation((email: string) => email.trim().toLowerCase());
    mockedValidators.validateEmail.mockReturnValue(true);
    mockedValidators.validatePassword.mockReturnValue({ valid: true, errors: [] });

    mockedTokenService.generateVerificationToken.mockReturnValue('generated-verification-token');
    mockedTokenService.generateAccessToken.mockReturnValue('generated-access-token');
    mockedTokenService.generateRefreshToken.mockReturnValue({
      token: 'generated-refresh-token',
      tokenHash: 'generated-refresh-token-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    mockedTokenService.hashRefreshToken.mockReturnValue('generated-refresh-token-hash');
    mockedTokenService.verifyRefreshToken.mockResolvedValue(true);

    mockedPasswordUtils.hashPassword.mockResolvedValue('hashed-password');
    mockedPasswordUtils.comparePassword.mockResolvedValue(true);
  });

  describe('register', () => {
    it('registers a new user and sends verification email', async () => {
      mockedUserModel.existsByEmail.mockResolvedValue(false);
      mockedUserModel.create.mockResolvedValue(baseUser);
      mockedVerificationTokenModel.create.mockResolvedValue({
        ...verificationToken,
        token: 'generated-verification-token',
      });
      mockedEmailService.sendVerificationEmail.mockResolvedValue();

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.userId).toBe(baseUser.id);
      expect(mockedUserModel.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password_hash: 'hashed-password',
      });
      expect(mockedVerificationTokenModel.create).toHaveBeenCalled();
      expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'generated-verification-token'
      );
    });

    it('rejects duplicate email', async () => {
      mockedUserModel.existsByEmail.mockResolvedValue(true);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Test123!@#',
        })
      ).rejects.toMatchObject({
        code: ErrorCodes.EMAIL_EXISTS,
      });
    });

    it('rejects weak password', async () => {
      mockedValidators.validatePassword.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters'],
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'weak',
        })
      ).rejects.toMatchObject({
        code: ErrorCodes.WEAK_PASSWORD,
      });
    });

    it('rejects invalid email format', async () => {
      mockedValidators.validateEmail.mockReturnValue(false);

      await expect(
        authService.register({
          email: 'invalid-email',
          password: 'Test123!@#',
        })
      ).rejects.toMatchObject({
        code: ErrorCodes.INVALID_EMAIL,
      });

      expect(mockedUserModel.existsByEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns access and refresh tokens for valid credentials', async () => {
      mockedUserModel.findByEmail.mockResolvedValue(baseUser);
      mockedRefreshTokenModel.create.mockResolvedValue(refreshTokenRecord);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.accessToken).toBe('generated-access-token');
      expect(result.refreshToken).toBe('generated-refresh-token');
      expect(result.user.id).toBe(baseUser.id);
      expect(mockedRefreshTokenModel.create).toHaveBeenCalledWith({
        user_id: baseUser.id,
        token_hash: 'generated-refresh-token-hash',
        expires_at: expect.any(Date),
        device_info: undefined,
      });
    });

    it('rejects login when email is not verified with generic credentials error', async () => {
      mockedUserModel.findByEmail.mockResolvedValue({
        ...baseUser,
        email_verified: false,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Test123!@#',
        })
      ).rejects.toMatchObject({
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    });

    it('rejects login when credentials are invalid', async () => {
      mockedUserModel.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toMatchObject({
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    });

    it('rejects login when password is incorrect', async () => {
      mockedUserModel.findByEmail.mockResolvedValue(baseUser);
      mockedPasswordUtils.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toMatchObject({
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    });
  });

  describe('refresh', () => {
    it('returns a new access token for valid refresh token', async () => {
      mockedRefreshTokenModel.findValidToken.mockResolvedValue(refreshTokenRecord);
      mockedUserModel.findById.mockResolvedValue(baseUser);

      const result = await authService.refresh('generated-refresh-token');

      expect(result.accessToken).toBe('generated-access-token');
      expect(mockedTokenService.hashRefreshToken).toHaveBeenCalledWith('generated-refresh-token');
      expect(mockedRefreshTokenModel.findValidToken).toHaveBeenCalledWith('generated-refresh-token-hash');
    });

    it('rejects invalid refresh token', async () => {
      mockedRefreshTokenModel.findValidToken.mockResolvedValue(null);

      await expect(authService.refresh('invalid-token')).rejects.toMatchObject({
        code: ErrorCodes.INVALID_TOKEN,
      });
    });

    it('rejects when refresh token is missing', async () => {
      await expect(authService.refresh('')).rejects.toMatchObject({
        code: ErrorCodes.INVALID_TOKEN,
      });
    });

    it('rejects when token hash comparison fails', async () => {
      mockedRefreshTokenModel.findValidToken.mockResolvedValue(refreshTokenRecord);
      mockedTokenService.verifyRefreshToken.mockResolvedValue(false);

      await expect(authService.refresh('generated-refresh-token')).rejects.toMatchObject({
        code: ErrorCodes.INVALID_TOKEN,
      });
    });

    it('rejects when refresh token user does not exist', async () => {
      mockedRefreshTokenModel.findValidToken.mockResolvedValue(refreshTokenRecord);
      mockedUserModel.findById.mockResolvedValue(null);

      await expect(authService.refresh('generated-refresh-token')).rejects.toMatchObject({
        code: ErrorCodes.USER_NOT_FOUND,
      });
    });
  });

  describe('verifyEmail', () => {
    it('marks email as verified and consumes token', async () => {
      mockedVerificationTokenModel.findValidToken.mockResolvedValue(verificationToken);
      mockedUserModel.update.mockResolvedValue(baseUser);
      mockedVerificationTokenModel.markAsUsed.mockResolvedValue({
        ...verificationToken,
        used_at: new Date(),
      });
      mockedVerificationTokenModel.deleteByUserAndType.mockResolvedValue(1);

      await expect(authService.verifyEmail('verification-token')).resolves.toBeUndefined();

      expect(mockedUserModel.update).toHaveBeenCalledWith(baseUser.id, {
        email_verified: true,
      });
      expect(mockedVerificationTokenModel.markAsUsed).toHaveBeenCalledWith(
        verificationToken.id
      );
      expect(mockedVerificationTokenModel.deleteByUserAndType).toHaveBeenCalledWith(
        baseUser.id,
        'email_verify'
      );
    });

    it('rejects invalid or expired verification token', async () => {
      mockedVerificationTokenModel.findValidToken.mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toMatchObject({
        code: ErrorCodes.INVALID_TOKEN,
      });
    });

    it('rejects when token exists but user is missing', async () => {
      mockedVerificationTokenModel.findValidToken.mockResolvedValue(verificationToken);
      mockedUserModel.update.mockResolvedValue(null);

      await expect(authService.verifyEmail('verification-token')).rejects.toMatchObject({
        code: ErrorCodes.USER_NOT_FOUND,
      });
      expect(mockedVerificationTokenModel.markAsUsed).not.toHaveBeenCalled();
    });
  });

  describe('password reset flows', () => {
    it('does not leak user existence for unknown emails', async () => {
      mockedUserModel.findByEmail.mockResolvedValue(null);

      await expect(
        authService.requestPasswordReset('unknown@example.com')
      ).resolves.toBeUndefined();

      expect(mockedEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('returns early for invalid email format', async () => {
      mockedValidators.validateEmail.mockReturnValue(false);

      await expect(
        authService.requestPasswordReset('not-an-email')
      ).resolves.toBeUndefined();

      expect(mockedUserModel.findByEmail).not.toHaveBeenCalled();
      expect(mockedVerificationTokenModel.create).not.toHaveBeenCalled();
    });

    it('creates token and sends reset email for existing account', async () => {
      mockedUserModel.findByEmail.mockResolvedValue(baseUser);
      mockedVerificationTokenModel.create.mockResolvedValue({
        ...verificationToken,
        token: 'generated-verification-token',
        token_type: 'password_reset',
      });
      mockedVerificationTokenModel.deleteByUserAndType.mockResolvedValue(1);
      mockedEmailService.sendPasswordResetEmail.mockResolvedValue();

      await expect(
        authService.requestPasswordReset('test@example.com')
      ).resolves.toBeUndefined();

      expect(mockedVerificationTokenModel.deleteByUserAndType).toHaveBeenCalledWith(
        baseUser.id,
        'password_reset'
      );
      expect(mockedVerificationTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: baseUser.id,
          token: 'generated-verification-token',
          token_type: 'password_reset',
        })
      );
      expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'generated-verification-token'
      );
    });

    it('resets password with valid token and revokes sessions', async () => {
      mockedVerificationTokenModel.findValidToken.mockResolvedValue({
        ...verificationToken,
        token_type: 'password_reset',
      });
      mockedUserModel.update.mockResolvedValue(baseUser);
      mockedVerificationTokenModel.markAsUsed.mockResolvedValue({
        ...verificationToken,
        token_type: 'password_reset',
        used_at: new Date(),
      });
      mockedVerificationTokenModel.deleteByUserAndType.mockResolvedValue(1);
      mockedRefreshTokenModel.revokeAllForUser.mockResolvedValue(2);

      await expect(
        authService.resetPassword('reset-token', 'NewPass123!@#')
      ).resolves.toBeUndefined();

      expect(mockedUserModel.update).toHaveBeenCalledWith(baseUser.id, {
        password_hash: 'hashed-password',
      });
      expect(mockedRefreshTokenModel.revokeAllForUser).toHaveBeenCalledWith(baseUser.id);
    });

    it('rejects weak password on reset', async () => {
      mockedValidators.validatePassword.mockReturnValue({
        valid: false,
        errors: ['Password too weak'],
      });

      await expect(
        authService.resetPassword('reset-token', 'weak')
      ).rejects.toMatchObject({
        code: ErrorCodes.WEAK_PASSWORD,
      });
    });

    it('rejects invalid password reset token', async () => {
      mockedVerificationTokenModel.findValidToken.mockResolvedValue(null);

      await expect(
        authService.resetPassword('invalid-token', 'Strong123!@#')
      ).rejects.toMatchObject({
        code: ErrorCodes.INVALID_TOKEN,
      });
    });

    it('rejects password reset when user is missing', async () => {
      mockedVerificationTokenModel.findValidToken.mockResolvedValue({
        ...verificationToken,
        token_type: 'password_reset',
      });
      mockedUserModel.update.mockResolvedValue(null);

      await expect(
        authService.resetPassword('valid-token', 'Strong123!@#')
      ).rejects.toMatchObject({
        code: ErrorCodes.USER_NOT_FOUND,
      });
    });
  });

  describe('logout', () => {
    it('hashes and revokes refresh token', async () => {
      mockedRefreshTokenModel.revokeByTokenHash.mockResolvedValue(refreshTokenRecord);

      await authService.logout('generated-refresh-token');

      expect(mockedTokenService.hashRefreshToken).toHaveBeenCalledWith('generated-refresh-token');
      expect(mockedRefreshTokenModel.revokeByTokenHash).toHaveBeenCalledWith(
        'generated-refresh-token-hash'
      );
    });

    it('no-ops when refresh token is not provided', async () => {
      await expect(authService.logout('')).resolves.toBeUndefined();

      expect(mockedTokenService.hashRefreshToken).not.toHaveBeenCalled();
      expect(mockedRefreshTokenModel.revokeByTokenHash).not.toHaveBeenCalled();
    });
  });
});
