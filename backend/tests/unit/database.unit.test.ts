type SetupOptions = {
  nodeEnv?: string;
  appNodeEnv?: string;
};

function setupDatabaseModule(options: SetupOptions = {}) {
  const nodeEnv = options.nodeEnv ?? 'test';
  const appNodeEnv = options.appNodeEnv ?? 'test';

  jest.resetModules();
  process.env.NODE_ENV = nodeEnv;

  const poolMock = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  const PoolMock = jest.fn(() => poolMock);

  jest.doMock('pg', () => ({
    Pool: PoolMock,
  }));

  jest.doMock('../../src/config/env', () => ({
    config: {
      database: {
        url: 'postgres://main-db',
        testUrl: 'postgres://test-db',
      },
      app: {
        nodeEnv: appNodeEnv,
      },
    },
  }));

  const databaseModule = require('../../src/config/database');
  return { databaseModule, poolMock, PoolMock };
}

describe('database config module', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('creates pool with test database URL in test environment', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { databaseModule, PoolMock } = setupDatabaseModule({ nodeEnv: 'test' });

    databaseModule.getPool();

    expect(PoolMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://test-db',
      })
    );
    expect(logSpy).toHaveBeenCalledWith('Database pool created for test environment');
  });

  it('creates pool with primary database URL outside test environment', async () => {
    const { databaseModule, PoolMock } = setupDatabaseModule({ nodeEnv: 'production' });

    databaseModule.getPool();

    expect(PoolMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://main-db',
      })
    );
  });

  it('uses development fallback label when NODE_ENV is missing', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { databaseModule } = setupDatabaseModule({ nodeEnv: '' });

    databaseModule.getPool();

    expect(logSpy).toHaveBeenCalledWith('Database pool created for development environment');
  });

  it('executes query and logs query timing in development mode', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { databaseModule, poolMock } = setupDatabaseModule({
      nodeEnv: 'test',
      appNodeEnv: 'development',
    });
    poolMock.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });

    const result = await databaseModule.query('SELECT 1', []);

    expect(result).toEqual({ rowCount: 1, rows: [{ id: 1 }] });
    expect(logSpy).toHaveBeenCalledWith(
      'Executed query',
      expect.objectContaining({
        text: 'SELECT 1',
        rows: 1,
      })
    );
  });

  it('rethrows query errors after logging', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { databaseModule, poolMock } = setupDatabaseModule();
    const failure = new Error('query failed');
    poolMock.query.mockRejectedValue(failure);

    await expect(databaseModule.query('SELECT 1', [])).rejects.toThrow('query failed');
    expect(errorSpy).toHaveBeenCalledWith('Database query error:', {
      text: 'SELECT 1',
      error: failure,
    });
  });

  it('returns connected client from getClient', async () => {
    const client = { release: jest.fn() };
    const { databaseModule, poolMock } = setupDatabaseModule();
    poolMock.connect.mockResolvedValue(client);

    const result = await databaseModule.getClient();

    expect(result).toBe(client);
    expect(poolMock.connect).toHaveBeenCalledTimes(1);
  });

  it('healthCheck returns true when query has rows', async () => {
    const { databaseModule, poolMock } = setupDatabaseModule();
    poolMock.query.mockResolvedValue({ rowCount: 1, rows: [] });

    const isHealthy = await databaseModule.healthCheck();

    expect(isHealthy).toBe(true);
  });

  it('healthCheck returns false when query has no rows', async () => {
    const { databaseModule, poolMock } = setupDatabaseModule();
    poolMock.query.mockResolvedValue({ rowCount: 0, rows: [] });

    const isHealthy = await databaseModule.healthCheck();

    expect(isHealthy).toBe(false);
  });

  it('healthCheck returns false when query fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { databaseModule, poolMock } = setupDatabaseModule();
    poolMock.query.mockRejectedValue(new Error('db down'));

    const isHealthy = await databaseModule.healthCheck();

    expect(isHealthy).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      'Database health check failed:',
      expect.any(Error)
    );
  });

  it('closePool ends existing pool and is safe when called again', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { databaseModule, poolMock } = setupDatabaseModule();

    databaseModule.getPool();
    await databaseModule.closePool();
    await databaseModule.closePool();

    expect(poolMock.end).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Database pool closed');
  });

  it('registers pool error handler that exits process', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      return undefined as never;
    }) as any);
    const { databaseModule, poolMock } = setupDatabaseModule();

    databaseModule.getPool();

    const onErrorHandler = poolMock.on.mock.calls[0][1];
    const error = new Error('idle client error');
    onErrorHandler(error);

    expect(errorSpy).toHaveBeenCalledWith('Unexpected error on idle client', error);
    expect(exitSpy).toHaveBeenCalledWith(-1);
  });
});
