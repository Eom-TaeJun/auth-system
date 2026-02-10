import { query } from '../config/database';

/**
 * User entity interface
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User creation data (excluding auto-generated fields)
 */
export interface CreateUserData {
  email: string;
  password_hash: string;
}

/**
 * User update data (partial fields)
 */
export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  email_verified?: boolean;
}

/**
 * Finds a user by email address
 * @param {string} email - User email address
 * @returns {Promise<User | null>} User object or null if not found
 */
export async function findByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

/**
 * Finds a user by ID
 * @param {string} id - User UUID
 * @returns {Promise<User | null>} User object or null if not found
 */
export async function findById(id: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Creates a new user
 * @param {CreateUserData} data - User creation data
 * @returns {Promise<User>} Created user object
 */
export async function create(data: CreateUserData): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [data.email, data.password_hash]
  );

  return result.rows[0];
}

/**
 * Updates a user by ID
 * @param {string} id - User UUID
 * @param {UpdateUserData} data - Fields to update
 * @returns {Promise<User | null>} Updated user object or null if not found
 */
export async function update(id: string, data: UpdateUserData): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Build dynamic UPDATE query based on provided fields
  if (data.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.password_hash !== undefined) {
    fields.push(`password_hash = $${paramCount++}`);
    values.push(data.password_hash);
  }
  if (data.email_verified !== undefined) {
    fields.push(`email_verified = $${paramCount++}`);
    values.push(data.email_verified);
  }

  if (fields.length === 0) {
    // No fields to update, just return the current user
    return findById(id);
  }

  values.push(id);

  const result = await query<User>(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Deletes a user by ID
 * @param {string} id - User UUID
 * @returns {Promise<boolean>} True if user was deleted
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM users WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
}

/**
 * Checks if a user exists by email
 * @param {string} email - User email address
 * @returns {Promise<boolean>} True if user exists
 */
export async function existsByEmail(email: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)',
    [email]
  );

  return result.rows[0].exists;
}
