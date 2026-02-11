import crypto from 'crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

const REFRESH_TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_BYTES = 32;
const DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
}

export interface RefreshTokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Creates a signed JWT access token.
 */
export function generateAccessToken(userId: string): string {
  const expiresIn = config.jwt.accessExpiry as SignOptions['expiresIn'];

  return jwt.sign(
    { userId } as AccessTokenPayload,
    config.jwt.accessSecret,
    { expiresIn, algorithm: 'HS256' }
  );
}

/**
 * Verifies and decodes a JWT access token.
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') {
      return null;
    }

    const userId = (decoded as JwtPayload).userId;
    if (typeof userId !== 'string') {
      return null;
    }

    return decoded as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Creates a random refresh token and a hash for DB storage.
 */
export function generateRefreshToken(): RefreshTokenResult {
  const token = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const tokenHash = hashRefreshToken(token);
  const expiresAt = getRefreshTokenExpiryDate();

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

/**
 * Creates a random token for email verification and password reset flows.
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(VERIFICATION_TOKEN_BYTES).toString('hex');
}

/**
 * Hashes a refresh token to avoid storing plaintext tokens.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compares a plaintext refresh token with a stored hash.
 */
export async function verifyRefreshToken(token: string, storedHash: string): Promise<boolean> {
  try {
    const incomingHashBuffer = Buffer.from(hashRefreshToken(token), 'hex');
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (incomingHashBuffer.length !== storedHashBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(incomingHashBuffer, storedHashBuffer);
  } catch {
    return false;
  }
}

function getRefreshTokenExpiryDate(): Date {
  const expiryDays = parseExpiryDays(config.jwt.refreshExpiry);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  return expiresAt;
}

function parseExpiryDays(expiry: string): number {
  const dayPatternMatch = /^(\d+)d$/.exec(expiry);

  if (!dayPatternMatch) {
    return DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS;
  }

  const days = Number(dayPatternMatch[1]);
  return Number.isFinite(days) && days > 0
    ? days
    : DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS;
}
