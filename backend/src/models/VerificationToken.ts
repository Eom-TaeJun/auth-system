import crypto from 'crypto';
import { query } from '../config/database';

/**
 * Verification token types
 */
export type TokenType = 'email_verify' | 'password_reset';

/**
 * Verification token entity interface
 */
export interface VerificationToken {
  id: string;
  user_id: string;
  token: string;
  token_type: TokenType;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

/**
 * Verification token creation data
 */
export interface CreateVerificationTokenData {
  user_id: string;
  token: string;
  token_type: TokenType;
  expires_at: Date;
}

function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new verification token
 * @param {CreateVerificationTokenData} data - Token creation data
 * @returns {Promise<VerificationToken>} Created token object
 */
export async function create(data: CreateVerificationTokenData): Promise<VerificationToken> {
  const tokenHash = hashVerificationToken(data.token);

  const result = await query<VerificationToken>(
    `INSERT INTO verification_tokens (user_id, token, token_type, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.user_id, tokenHash, data.token_type, data.expires_at]
  );

  return result.rows[0];
}

/**
 * Finds a verification token by token string
 * @param {string} token - Token string
 * @returns {Promise<VerificationToken | null>} Token object or null if not found
 */
export async function findByToken(token: string): Promise<VerificationToken | null> {
  const tokenHash = hashVerificationToken(token);

  const result = await query<VerificationToken>(
    'SELECT * FROM verification_tokens WHERE token = $1',
    [tokenHash]
  );

  return result.rows[0] || null;
}

/**
 * Finds all verification tokens for a user by type
 * @param {string} userId - User UUID
 * @param {TokenType} tokenType - Type of token
 * @returns {Promise<VerificationToken[]>} Array of tokens
 */
export async function findByUserAndType(
  userId: string,
  tokenType: TokenType
): Promise<VerificationToken[]> {
  const result = await query<VerificationToken>(
    `SELECT * FROM verification_tokens
     WHERE user_id = $1 AND token_type = $2
     ORDER BY created_at DESC`,
    [userId, tokenType]
  );

  return result.rows;
}

/**
 * Finds a valid (unused and not expired) token
 * @param {string} token - Token string
 * @param {TokenType} tokenType - Expected token type
 * @returns {Promise<VerificationToken | null>} Token object or null if not found or invalid
 */
export async function findValidToken(
  token: string,
  tokenType: TokenType
): Promise<VerificationToken | null> {
  const tokenHash = hashVerificationToken(token);

  const result = await query<VerificationToken>(
    `SELECT * FROM verification_tokens
     WHERE token = $1
       AND token_type = $2
       AND used_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash, tokenType]
  );

  return result.rows[0] || null;
}

/**
 * Marks a token as used
 * @param {string} tokenId - Token UUID
 * @returns {Promise<VerificationToken | null>} Updated token or null if not found
 */
export async function markAsUsed(tokenId: string): Promise<VerificationToken | null> {
  const result = await query<VerificationToken>(
    `UPDATE verification_tokens
     SET used_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [tokenId]
  );

  return result.rows[0] || null;
}

/**
 * Deletes a verification token
 * @param {string} tokenId - Token UUID
 * @returns {Promise<boolean>} True if token was deleted
 */
export async function deleteToken(tokenId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM verification_tokens WHERE id = $1',
    [tokenId]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Deletes all tokens for a user by type
 * @param {string} userId - User UUID
 * @param {TokenType} tokenType - Type of token
 * @returns {Promise<number>} Number of tokens deleted
 */
export async function deleteByUserAndType(
  userId: string,
  tokenType: TokenType
): Promise<number> {
  const result = await query(
    'DELETE FROM verification_tokens WHERE user_id = $1 AND token_type = $2',
    [userId, tokenType]
  );

  return result.rowCount || 0;
}

/**
 * Deletes expired tokens (cleanup function)
 * @returns {Promise<number>} Number of tokens deleted
 */
export async function deleteExpired(): Promise<number> {
  const result = await query(
    'DELETE FROM verification_tokens WHERE expires_at < NOW()',
    []
  );

  return result.rowCount || 0;
}
