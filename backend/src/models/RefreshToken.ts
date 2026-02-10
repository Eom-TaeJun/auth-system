import { query } from '../config/database';

/**
 * Refresh token entity interface
 */
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  device_info: string | null;
  created_at: Date;
}

/**
 * Refresh token creation data
 */
export interface CreateRefreshTokenData {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  device_info?: string;
}

/**
 * Creates a new refresh token
 * @param {CreateRefreshTokenData} data - Token creation data
 * @returns {Promise<RefreshToken>} Created token object
 */
export async function create(data: CreateRefreshTokenData): Promise<RefreshToken> {
  const result = await query<RefreshToken>(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.user_id, data.token_hash, data.expires_at, data.device_info || null]
  );

  return result.rows[0];
}

/**
 * Finds a refresh token by token hash
 * @param {string} tokenHash - Hashed token string
 * @returns {Promise<RefreshToken | null>} Token object or null if not found
 */
export async function findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
  const result = await query<RefreshToken>(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );

  return result.rows[0] || null;
}

/**
 * Finds a valid (not revoked and not expired) refresh token
 * @param {string} tokenHash - Hashed token string
 * @returns {Promise<RefreshToken | null>} Token object or null if not found or invalid
 */
export async function findValidToken(tokenHash: string): Promise<RefreshToken | null> {
  const result = await query<RefreshToken>(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash]
  );

  return result.rows[0] || null;
}

/**
 * Finds all refresh tokens for a user
 * @param {string} userId - User UUID
 * @returns {Promise<RefreshToken[]>} Array of tokens
 */
export async function findByUserId(userId: string): Promise<RefreshToken[]> {
  const result = await query<RefreshToken>(
    `SELECT * FROM refresh_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Finds all active (not revoked, not expired) tokens for a user
 * @param {string} userId - User UUID
 * @returns {Promise<RefreshToken[]>} Array of active tokens
 */
export async function findActiveByUserId(userId: string): Promise<RefreshToken[]> {
  const result = await query<RefreshToken>(
    `SELECT * FROM refresh_tokens
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Revokes a refresh token by ID
 * @param {string} tokenId - Token UUID
 * @returns {Promise<RefreshToken | null>} Revoked token or null if not found
 */
export async function revokeToken(tokenId: string): Promise<RefreshToken | null> {
  const result = await query<RefreshToken>(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [tokenId]
  );

  return result.rows[0] || null;
}

/**
 * Revokes a refresh token by token hash
 * @param {string} tokenHash - Hashed token string
 * @returns {Promise<RefreshToken | null>} Revoked token or null if not found
 */
export async function revokeByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
  const result = await query<RefreshToken>(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1
     RETURNING *`,
    [tokenHash]
  );

  return result.rows[0] || null;
}

/**
 * Revokes all refresh tokens for a user
 * @param {string} userId - User UUID
 * @returns {Promise<number>} Number of tokens revoked
 */
export async function revokeAllForUser(userId: string): Promise<number> {
  const result = await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );

  return result.rowCount || 0;
}

/**
 * Deletes a refresh token
 * @param {string} tokenId - Token UUID
 * @returns {Promise<boolean>} True if token was deleted
 */
export async function deleteToken(tokenId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM refresh_tokens WHERE id = $1',
    [tokenId]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Deletes expired tokens (cleanup function)
 * @returns {Promise<number>} Number of tokens deleted
 */
export async function deleteExpired(): Promise<number> {
  const result = await query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW()',
    []
  );

  return result.rowCount || 0;
}

/**
 * Deletes all revoked tokens (cleanup function)
 * @returns {Promise<number>} Number of tokens deleted
 */
export async function deleteRevoked(): Promise<number> {
  const result = await query(
    'DELETE FROM refresh_tokens WHERE revoked_at IS NOT NULL',
    []
  );

  return result.rowCount || 0;
}
