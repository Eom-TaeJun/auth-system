import { healthCheck, closePool } from '../../src/config/database';

describe('Database Connection', () => {
  afterAll(async () => {
    // Clean up connection pool after tests
    await closePool();
  });

  test('should connect to database successfully', async () => {
    const isHealthy = await healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should execute simple query', async () => {
    const isHealthy = await healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should cleanup connection pool', async () => {
    await closePool();
    // If closePool doesn't throw, it succeeded
    expect(true).toBe(true);
  });
});
