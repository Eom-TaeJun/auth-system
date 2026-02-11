import { getPool } from '../src/config/database';
import type { Migration } from '../src/config/migrate';

/**
 * Initial database schema migration
 * Creates users, verification_tokens, and refresh_tokens tables
 */
const migration: Migration = {
  async up() {
    const pool = getPool();

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create index on email for fast lookups
    await pool.query(`
      CREATE UNIQUE INDEX idx_users_email ON users(email)
    `);

    // Create verification_tokens table
    await pool.query(`
      CREATE TABLE verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for verification_tokens
    await pool.query(`
      CREATE UNIQUE INDEX idx_verification_tokens_token ON verification_tokens(token)
    `);
    await pool.query(`
      CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id)
    `);
    await pool.query(`
      CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at)
    `);

    // Create refresh_tokens table
    await pool.query(`
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        device_info TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for refresh_tokens
    await pool.query(`
      CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)
    `);
    await pool.query(`
      CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)
    `);
    await pool.query(`
      CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)
    `);

    // Create function to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger to automatically update updated_at on users table
    await pool.query(`
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('Created tables: users, verification_tokens, refresh_tokens');
  },

  async down() {
    const pool = getPool();

    // Drop tables in reverse order (respecting foreign keys)
    await pool.query('DROP TABLE IF EXISTS refresh_tokens CASCADE');
    await pool.query('DROP TABLE IF EXISTS verification_tokens CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    // Drop the trigger function
    await pool.query('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE');

    console.log('Dropped tables: users, verification_tokens, refresh_tokens');
  },
};

export = migration;
