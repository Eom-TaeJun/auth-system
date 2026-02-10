import * as UserModel from '../models/User';
import * as VerificationTokenModel from '../models/VerificationToken';
import * as RefreshTokenModel from '../models/RefreshToken';
import type {
  LoginRequestContract,
  RegisterRequestContract,
  RegisterResponseContract,
  UserContract,
} from '@contracts';
import * as passwordUtils from '../utils/password';
import * as validators from '../utils/validators';
import { AuthError, ErrorCodes } from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  hashRefreshToken,
  verifyRefreshToken,
} from './tokenService';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './emailService';

const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export type RegisterData = RegisterRequestContract;

export interface LoginData extends LoginRequestContract {
  deviceInfo?: string;
}

export type AuthUser = UserContract;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type RegisterResult = RegisterResponseContract;

/**
 * Creates a new account and sends an email verification token.
 */
export async function register(data: RegisterData): Promise<RegisterResult> {
  const email = validators.normalizeEmail(data.email);
  assertValidEmail(email);
  assertStrongPassword(data.password);

  const exists = await UserModel.existsByEmail(email);
  if (exists) {
    throw new AuthError('Email already exists', ErrorCodes.EMAIL_EXISTS, 409);
  }

  const passwordHash = await passwordUtils.hashPassword(data.password);
  const user = await UserModel.create({
    email,
    password_hash: passwordHash,
  });

  const token = generateVerificationToken();
  const expiresAt = getExpiryDateFromNow(EMAIL_VERIFICATION_EXPIRY_HOURS);

  await VerificationTokenModel.create({
    user_id: user.id,
    token,
    token_type: 'email_verify',
    expires_at: expiresAt,
  });

  await sendVerificationEmail(email, token);

  return {
    userId: user.id,
    message: 'Registration successful. Please verify your email.',
  };
}

/**
 * Logs a user in and issues access/refresh tokens.
 */
export async function login(data: LoginData): Promise<LoginResult> {
  const email = validators.normalizeEmail(data.email);
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throwInvalidCredentials();
  }

  const isPasswordValid = await passwordUtils.comparePassword(
    data.password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throwInvalidCredentials();
  }

  if (!user.email_verified) {
    throwInvalidCredentials();
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await RefreshTokenModel.create({
    user_id: user.id,
    token_hash: refreshToken.tokenHash,
    expires_at: refreshToken.expiresAt,
    device_info: data.deviceInfo,
  });

  return {
    accessToken,
    refreshToken: refreshToken.token,
    user: toAuthUser(user),
  };
}

/**
 * Validates a refresh token and returns a new access token.
 */
export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  if (!refreshToken) {
    throw new AuthError('Refresh token is required', ErrorCodes.INVALID_TOKEN, 401);
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const tokenRecord = await RefreshTokenModel.findValidToken(tokenHash);

  if (!tokenRecord) {
    throwInvalidRefreshToken();
  }

  const matches = await verifyRefreshToken(refreshToken, tokenRecord.token_hash);
  if (!matches) {
    throwInvalidRefreshToken();
  }

  const user = await UserModel.findById(tokenRecord.user_id);
  if (!user) {
    throw new AuthError('User not found', ErrorCodes.USER_NOT_FOUND, 404);
  }

  return {
    accessToken: generateAccessToken(user.id),
  };
}

/**
 * Marks a user's email as verified when the token is valid.
 */
export async function verifyEmail(token: string): Promise<void> {
  const tokenRecord = await VerificationTokenModel.findValidToken(token, 'email_verify');

  if (!tokenRecord) {
    throw new AuthError('Invalid or expired token', ErrorCodes.INVALID_TOKEN, 400);
  }

  const user = await UserModel.update(tokenRecord.user_id, { email_verified: true });
  if (!user) {
    throw new AuthError('User not found', ErrorCodes.USER_NOT_FOUND, 404);
  }

  await VerificationTokenModel.markAsUsed(tokenRecord.id);
  await VerificationTokenModel.deleteByUserAndType(tokenRecord.user_id, 'email_verify');
}

/**
 * Requests a password reset without leaking whether the email exists.
 */
export async function requestPasswordReset(emailInput: string): Promise<void> {
  const email = validators.normalizeEmail(emailInput);
  if (!validators.validateEmail(email)) {
    return;
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return;
  }

  await VerificationTokenModel.deleteByUserAndType(user.id, 'password_reset');

  const token = generateVerificationToken();
  const expiresAt = getExpiryDateFromNow(PASSWORD_RESET_EXPIRY_HOURS);

  await VerificationTokenModel.create({
    user_id: user.id,
    token,
    token_type: 'password_reset',
    expires_at: expiresAt,
  });

  await sendPasswordResetEmail(email, token);
}

/**
 * Resets the password for a valid password reset token.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  assertStrongPassword(newPassword);

  const tokenRecord = await VerificationTokenModel.findValidToken(token, 'password_reset');
  if (!tokenRecord) {
    throw new AuthError('Invalid or expired token', ErrorCodes.INVALID_TOKEN, 400);
  }

  const passwordHash = await passwordUtils.hashPassword(newPassword);
  const updatedUser = await UserModel.update(tokenRecord.user_id, {
    password_hash: passwordHash,
  });

  if (!updatedUser) {
    throw new AuthError('User not found', ErrorCodes.USER_NOT_FOUND, 404);
  }

  await VerificationTokenModel.markAsUsed(tokenRecord.id);
  await VerificationTokenModel.deleteByUserAndType(tokenRecord.user_id, 'password_reset');
  await RefreshTokenModel.revokeAllForUser(tokenRecord.user_id);
}

/**
 * Revokes a refresh token if it exists.
 */
export async function logout(refreshToken: string): Promise<void> {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  await RefreshTokenModel.revokeByTokenHash(tokenHash);
}

function toAuthUser(user: UserModel.User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    email_verified: user.email_verified,
  };
}

function getExpiryDateFromNow(hours: number): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt;
}

function assertValidEmail(email: string): void {
  if (!validators.validateEmail(email)) {
    throw new AuthError(
      'Invalid email address',
      ErrorCodes.INVALID_EMAIL,
      400
    );
  }
}

function assertStrongPassword(password: string): void {
  const passwordCheck = validators.validatePassword(password);
  if (!passwordCheck.valid) {
    throw new AuthError(
      passwordCheck.errors.join(', '),
      ErrorCodes.WEAK_PASSWORD,
      400
    );
  }
}

function throwInvalidCredentials(): never {
  throw new AuthError(
    'Invalid credentials',
    ErrorCodes.INVALID_CREDENTIALS,
    401
  );
}

function throwInvalidRefreshToken(): never {
  throw new AuthError('Invalid refresh token', ErrorCodes.INVALID_TOKEN, 401);
}
