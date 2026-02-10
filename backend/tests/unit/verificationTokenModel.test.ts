jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
import * as VerificationTokenModel from '../../src/models/VerificationToken';

const mockedQuery = query as jest.Mock;

describe('VerificationToken model', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('create inserts and returns token row', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'vt1' }] });
    const rawToken = 'token';

    const result = await VerificationTokenModel.create({
      user_id: 'u1',
      token: rawToken,
      token_type: 'email_verify',
      expires_at: new Date(),
    });

    expect(result).toEqual({ id: 'vt1' });
    const createCallParams = mockedQuery.mock.calls[0][1];
    expect(createCallParams[1]).toMatch(/^[a-f0-9]{64}$/);
    expect(createCallParams[1]).not.toBe(rawToken);
  });

  it('findByToken returns null when missing', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await VerificationTokenModel.findByToken('missing');
    expect(result).toBeNull();

    const findByTokenParams = mockedQuery.mock.calls[0][1];
    expect(findByTokenParams[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(findByTokenParams[0]).not.toBe('missing');
  });

  it('findByUserAndType returns ordered rows', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'vt2' }] });

    const result = await VerificationTokenModel.findByUserAndType(
      'u1',
      'password_reset'
    );

    expect(result).toEqual([{ id: 'vt2' }]);
  });

  it('findValidToken returns token when valid', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'vt3' }] });
    const rawToken = 'valid-token';

    const result = await VerificationTokenModel.findValidToken(
      rawToken,
      'email_verify'
    );

    expect(result).toEqual({ id: 'vt3' });
    const findValidTokenParams = mockedQuery.mock.calls[0][1];
    expect(findValidTokenParams[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(findValidTokenParams[0]).not.toBe(rawToken);
  });

  it('findValidToken returns null when token is invalid', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await VerificationTokenModel.findValidToken(
      'invalid-token',
      'email_verify'
    );

    expect(result).toBeNull();
  });

  it('markAsUsed updates token row', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'vt4', used_at: new Date() }] });

    const result = await VerificationTokenModel.markAsUsed('vt4');
    expect(result).toEqual(expect.objectContaining({ id: 'vt4' }));
  });

  it('markAsUsed returns null when token is not found', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await VerificationTokenModel.markAsUsed('missing');
    expect(result).toBeNull();
  });

  it('deleteToken returns deletion status', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 0 });

    const result = await VerificationTokenModel.deleteToken('vt5');
    expect(result).toBe(false);
  });

  it('deleteByUserAndType returns deleted count', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 3 });

    const result = await VerificationTokenModel.deleteByUserAndType(
      'u1',
      'password_reset'
    );
    expect(result).toBe(3);
  });

  it('deleteByUserAndType returns 0 when rowCount is missing', async () => {
    mockedQuery.mockResolvedValue({});

    const result = await VerificationTokenModel.deleteByUserAndType(
      'u1',
      'password_reset'
    );
    expect(result).toBe(0);
  });

  it('deleteExpired returns deleted count', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 2 });

    const result = await VerificationTokenModel.deleteExpired();
    expect(result).toBe(2);
  });

  it('deleteExpired returns 0 when rowCount is missing', async () => {
    mockedQuery.mockResolvedValue({});

    const result = await VerificationTokenModel.deleteExpired();
    expect(result).toBe(0);
  });
});
