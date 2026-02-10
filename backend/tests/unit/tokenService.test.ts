import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  hashRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/services/tokenService';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../src/config/env';

describe('Token Service', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const originalRefreshExpiry = config.jwt.refreshExpiry;

  afterEach(() => {
    config.jwt.refreshExpiry = originalRefreshExpiry;
    jest.restoreAllMocks();
  });

  describe('Access Token', () => {
    it('generates and verifies access token payload', () => {
      const token = generateAccessToken(userId);
      const payload = verifyAccessToken(token);

      expect(token).toBeTruthy();
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
    });

    it('returns null for invalid token', () => {
      const payload = verifyAccessToken('invalid-token-value');
      expect(payload).toBeNull();
    });

    it('returns null when jwt.verify returns string payload', () => {
      const verifySpy = jest.spyOn(jwt, 'verify').mockReturnValue('text-payload' as any);

      const payload = verifyAccessToken('token');

      expect(payload).toBeNull();
      expect(verifySpy).toHaveBeenCalled();
    });

    it('returns null when decoded payload has no userId', () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ sub: '123' } as any);

      const payload = verifyAccessToken('token');
      expect(payload).toBeNull();
    });
  });

  describe('Refresh Token', () => {
    it('creates refresh token with hash and expiry date', () => {
      const now = Date.now();
      const result = generateRefreshToken();

      expect(result.token).toMatch(/^[a-f0-9]{64}$/);
      expect(result.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(now);
    });

    it('hashes token deterministically', () => {
      const token = 'sample-refresh-token';
      const hashA = hashRefreshToken(token);
      const hashB = hashRefreshToken(token);

      expect(hashA).toBe(hashB);
      expect(hashA).toMatch(/^[a-f0-9]{64}$/);
    });

    it('verifies matching refresh token/hash pairs', async () => {
      const { token, tokenHash } = generateRefreshToken();
      const valid = await verifyRefreshToken(token, tokenHash);

      expect(valid).toBe(true);
    });

    it('rejects non-matching refresh token/hash pairs', async () => {
      const { tokenHash } = generateRefreshToken();
      const valid = await verifyRefreshToken('wrong-token', tokenHash);

      expect(valid).toBe(false);
    });

    it('rejects when hash buffer lengths differ', async () => {
      const valid = await verifyRefreshToken('token', 'abcd');
      expect(valid).toBe(false);
    });

    it('returns false when timing-safe compare throws', async () => {
      jest.spyOn(crypto, 'timingSafeEqual').mockImplementation(() => {
        throw new Error('crypto failure');
      });

      const { token, tokenHash } = generateRefreshToken();
      const valid = await verifyRefreshToken(token, tokenHash);

      expect(valid).toBe(false);
    });

    it('falls back to default expiry days for invalid refresh expiry config', () => {
      config.jwt.refreshExpiry = 'invalid-expiry';
      const now = Date.now();

      const result = generateRefreshToken();
      const diffDays = (result.expiresAt.getTime() - now) / (24 * 60 * 60 * 1000);

      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });

    it('falls back to default expiry days when parsed days are not positive', () => {
      config.jwt.refreshExpiry = '0d';
      const now = Date.now();

      const result = generateRefreshToken();
      const diffDays = (result.expiresAt.getTime() - now) / (24 * 60 * 60 * 1000);

      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });

  describe('Verification Token', () => {
    it('generates 32-byte random hex token', () => {
      const token = generateVerificationToken();

      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates unique values', () => {
      const tokenA = generateVerificationToken();
      const tokenB = generateVerificationToken();

      expect(tokenA).not.toBe(tokenB);
    });
  });
});
