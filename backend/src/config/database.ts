import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from './env';

/**
 * PostgreSQL connection pool instance
 */
let pool: Pool | null = null;

/**
 * Gets or creates the database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.NODE_ENV === 'test'
      ? config.database.testUrl
      : config.database.url;

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    console.log(`Database pool created for ${process.env.NODE_ENV || 'development'} environment`);
  }

  return pool;
}

/**
 * Executes a SQL query with parameters
 * @template T - The type of rows returned by the query
 * @param {string} text - SQL query text with $1, $2, etc. placeholders
 * @param {any[]} params - Array of parameter values
 * @returns {Promise<QueryResult<T>>} Query result
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (config.app.nodeEnv === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount, params: '***' });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', { text, error: (error as Error).message });
    throw error;
  }
}

/**
 * Gets a client from the pool for transactions
 * @returns {Promise<PoolClient>} Database client
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Checks database connection health
 * @returns {Promise<boolean>} True if connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Closes the database connection pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

/**
 * Database connection interface
 */
export const db = {
  query,
  getClient,
  healthCheck,
  closePool,
  getPool,
};

export default db;
