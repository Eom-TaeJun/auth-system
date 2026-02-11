import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { getPool, closePool } from './database';

/**
 * Migration interface that all migration files must implement
 */
export interface Migration {
  up: () => Promise<void>;
  down: () => Promise<void>;
}

type MigrationModule = {
  default?: Partial<Migration>;
} & Partial<Migration>;

/**
 * Creates the migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Gets list of already executed migrations
 * @returns {Promise<string[]>} Array of migration names
 */
async function getExecutedMigrations(): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query<{ name: string }>(
    'SELECT name FROM migrations ORDER BY id'
  );
  return result.rows.map(row => row.name);
}

/**
 * Records a migration as executed
 * @param {string} name - Migration name
 */
async function recordMigration(name: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    'INSERT INTO migrations (name) VALUES ($1)',
    [name]
  );
}

/**
 * Removes a migration record
 * @param {string} name - Migration name
 */
async function removeMigrationRecord(name: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    'DELETE FROM migrations WHERE name = $1',
    [name]
  );
}

/**
 * Gets all migration files from the migrations directory
 * @returns {Promise<string[]>} Sorted array of migration file names
 */
async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = resolve(__dirname, '../../migrations');
  const files = await readdir(migrationsDir);

  // Filter for .ts and .js files, sort alphabetically
  return files
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .sort();
}

function toMigration(moduleValue: MigrationModule, fileName: string): Migration {
  const candidate = (moduleValue.default ?? moduleValue) as Partial<Migration>;

  if (
    typeof candidate.up === 'function' &&
    typeof candidate.down === 'function'
  ) {
    return candidate as Migration;
  }

  throw new Error(`Migration file "${fileName}" does not export valid up/down functions`);
}

/**
 * Runs pending migrations
 */
async function runMigrationsUp(): Promise<void> {
  console.log('Running migrations...\n');

  await createMigrationsTable();
  const executed = await getExecutedMigrations();
  const allFiles = await getMigrationFiles();

  // Find migrations that haven't been executed
  const pending = allFiles.filter(file => !executed.includes(file));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):\n`);

  for (const file of pending) {
    console.log(`Migrating: ${file}`);

    const migrationPath = resolve(__dirname, '../../migrations', file);
    const moduleValue = (await import(migrationPath)) as MigrationModule;
    const migration = toMigration(moduleValue, file);

    try {
      await migration.up();
      await recordMigration(file);
      console.log(`✓ ${file} completed\n`);
    } catch (error) {
      console.error(`✗ ${file} failed:`, error);
      throw error;
    }
  }

  console.log('All migrations completed successfully!');
}

/**
 * Rolls back the most recent migration
 */
async function runMigrationDown(): Promise<void> {
  console.log('Rolling back last migration...\n');

  await createMigrationsTable();
  const executed = await getExecutedMigrations();

  if (executed.length === 0) {
    console.log('No migrations to roll back.');
    return;
  }

  const lastMigration = executed[executed.length - 1];
  console.log(`Rolling back: ${lastMigration}`);

  const migrationPath = resolve(__dirname, '../../migrations', lastMigration);
  const moduleValue = (await import(migrationPath)) as MigrationModule;
  const migration = toMigration(moduleValue, lastMigration);

  try {
    await migration.down();
    await removeMigrationRecord(lastMigration);
    console.log(`✓ ${lastMigration} rolled back successfully`);
  } catch (error) {
    console.error(`✗ ${lastMigration} rollback failed:`, error);
    throw error;
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const command = process.argv[2];

  try {
    if (command === 'up') {
      await runMigrationsUp();
    } else if (command === 'down') {
      await runMigrationDown();
    } else {
      console.log('Usage: npm run migrate (to run migrations)');
      console.log('       npm run migrate:down (to rollback last migration)');
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runMigrationsUp, runMigrationDown };
