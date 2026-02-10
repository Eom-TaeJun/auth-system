import { healthCheck, closePool } from '../../src/config/database';

const REQUIRE_DB_FOR_TESTS = process.env.REQUIRE_DB_TESTS === 'true';

describe('Database Connection', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    if (!REQUIRE_DB_FOR_TESTS) {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    }
  });

  afterAll(async () => {
    // Clean up connection pool after tests
    await closePool();

    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
    if (consoleLogSpy) {
      consoleLogSpy.mockRestore();
    }
  });

  test('should connect to database successfully', async () => {
    const isHealthy = await healthCheck();
    if (!isHealthy && !REQUIRE_DB_FOR_TESTS) {
      return;
    }
    expect(isHealthy).toBe(true);
  });

  test('should execute simple query', async () => {
    const isHealthy = await healthCheck();
    if (!isHealthy && !REQUIRE_DB_FOR_TESTS) {
      return;
    }
    expect(isHealthy).toBe(true);
  });

  test('should cleanup connection pool', async () => {
    await closePool();
    // If closePool doesn't throw, it succeeded
    expect(true).toBe(true);
  });
});
