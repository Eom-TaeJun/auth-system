jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
import * as RefreshTokenModel from '../../src/models/RefreshToken';

const mockedQuery = query as jest.Mock;

describe('RefreshToken model', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('create inserts token row', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt1' }] });

    const result = await RefreshTokenModel.create({
      user_id: 'u1',
      token_hash: 'hash',
      expires_at: new Date(),
      device_info: 'device',
    });

    expect(result).toEqual({ id: 'rt1' });
  });

  it('create stores null device_info when omitted', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt1b' }] });

    const result = await RefreshTokenModel.create({
      user_id: 'u1',
      token_hash: 'hash',
      expires_at: new Date(),
    });

    expect(result).toEqual({ id: 'rt1b' });
    expect(mockedQuery).toHaveBeenCalledWith(expect.any(String), [
      'u1',
      'hash',
      expect.any(Date),
      null,
    ]);
  });

  it('findByTokenHash returns row or null', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt2' }] });
    const found = await RefreshTokenModel.findByTokenHash('hash');
    expect(found).toEqual({ id: 'rt2' });

    mockedQuery.mockResolvedValue({ rows: [] });
    const missing = await RefreshTokenModel.findByTokenHash('missing');
    expect(missing).toBeNull();
  });

  it('findValidToken returns valid token row', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt3' }] });
    const result = await RefreshTokenModel.findValidToken('hash');
    expect(result).toEqual({ id: 'rt3' });
  });

  it('findValidToken returns null when token is not active', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await RefreshTokenModel.findValidToken('missing-hash');
    expect(result).toBeNull();
  });

  it('findByUserId and findActiveByUserId return rows', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt4' }] });
    const all = await RefreshTokenModel.findByUserId('u1');
    expect(all).toEqual([{ id: 'rt4' }]);

    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt5' }] });
    const active = await RefreshTokenModel.findActiveByUserId('u1');
    expect(active).toEqual([{ id: 'rt5' }]);
  });

  it('revokeToken and revokeByTokenHash return row or null', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'rt6' }] });
    const byId = await RefreshTokenModel.revokeToken('rt6');
    expect(byId).toEqual({ id: 'rt6' });

    mockedQuery.mockResolvedValue({ rows: [] });
    const byHash = await RefreshTokenModel.revokeByTokenHash('missing');
    expect(byHash).toBeNull();
  });

  it('revokeToken returns null when token does not exist', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await RefreshTokenModel.revokeToken('missing');
    expect(result).toBeNull();
  });

  it('revokeAllForUser returns updated row count', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 4 });
    const result = await RefreshTokenModel.revokeAllForUser('u1');
    expect(result).toBe(4);
  });

  it('revokeAllForUser returns 0 when rowCount is missing', async () => {
    mockedQuery.mockResolvedValue({});

    const result = await RefreshTokenModel.revokeAllForUser('u1');
    expect(result).toBe(0);
  });

  it('deleteToken returns boolean by row count', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 1 });
    const deleted = await RefreshTokenModel.deleteToken('rt7');
    expect(deleted).toBe(true);
  });

  it('deleteToken returns false when rowCount is missing', async () => {
    mockedQuery.mockResolvedValue({});

    const deleted = await RefreshTokenModel.deleteToken('missing');
    expect(deleted).toBe(false);
  });

  it('deleteExpired and deleteRevoked return row counts', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 2 });
    const expired = await RefreshTokenModel.deleteExpired();
    expect(expired).toBe(2);

    mockedQuery.mockResolvedValue({ rowCount: 3 });
    const revoked = await RefreshTokenModel.deleteRevoked();
    expect(revoked).toBe(3);
  });

  it('deleteExpired and deleteRevoked return 0 when rowCount is missing', async () => {
    mockedQuery.mockResolvedValue({});
    const expired = await RefreshTokenModel.deleteExpired();
    expect(expired).toBe(0);

    mockedQuery.mockResolvedValue({});
    const revoked = await RefreshTokenModel.deleteRevoked();
    expect(revoked).toBe(0);
  });
});
