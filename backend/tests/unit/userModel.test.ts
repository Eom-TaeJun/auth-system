jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';
import * as UserModel from '../../src/models/User';

const mockedQuery = query as jest.Mock;

describe('User model', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('findByEmail returns user when found', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'u1', email: 'a@a.com' }] });

    const result = await UserModel.findByEmail('a@a.com');

    expect(result).toEqual({ id: 'u1', email: 'a@a.com' });
    expect(mockedQuery).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE email = $1',
      ['a@a.com']
    );
  });

  it('findByEmail returns null when missing', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await UserModel.findByEmail('missing@example.com');
    expect(result).toBeNull();
  });

  it('findById returns null when missing', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await UserModel.findById('missing');
    expect(result).toBeNull();
  });

  it('create inserts and returns row', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'u2' }] });

    const result = await UserModel.create({
      email: 'test@example.com',
      password_hash: 'hash',
    });

    expect(result).toEqual({ id: 'u2' });
    expect(mockedQuery).toHaveBeenCalledTimes(1);
  });

  it('update with no fields falls back to findById', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'u3' }] });

    const result = await UserModel.update('u3', {});

    expect(result).toEqual({ id: 'u3' });
    expect(mockedQuery).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      ['u3']
    );
  });

  it('update applies provided fields', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'u4', email_verified: true }] });

    const result = await UserModel.update('u4', {
      email: 'new@example.com',
      email_verified: true,
    });

    expect(result).toEqual({ id: 'u4', email_verified: true });
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users'),
      ['new@example.com', true, 'u4']
    );
  });

  it('update applies password hash field when provided', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ id: 'u4', password_hash: 'new-hash' }] });

    const result = await UserModel.update('u4', {
      password_hash: 'new-hash',
    });

    expect(result).toEqual({ id: 'u4', password_hash: 'new-hash' });
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('password_hash'),
      ['new-hash', 'u4']
    );
  });

  it('update returns null when target user does not exist', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    const result = await UserModel.update('missing', {
      email: 'missing@example.com',
    });

    expect(result).toBeNull();
  });

  it('deleteUser returns true when row deleted', async () => {
    mockedQuery.mockResolvedValue({ rowCount: 1 });

    const result = await UserModel.deleteUser('u5');
    expect(result).toBe(true);
  });

  it('deleteUser returns false when rowCount is missing', async () => {
    mockedQuery.mockResolvedValue({});

    const result = await UserModel.deleteUser('missing');
    expect(result).toBe(false);
  });

  it('existsByEmail returns boolean from query', async () => {
    mockedQuery.mockResolvedValue({ rows: [{ exists: true }] });

    const result = await UserModel.existsByEmail('exists@example.com');
    expect(result).toBe(true);
  });
});
