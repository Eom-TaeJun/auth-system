const ORIGINAL_ENV = process.env;

const validEnv = {
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/auth_db',
  DATABASE_URL_TEST: 'postgres://postgres:postgres@localhost:5432/auth_db_test',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_EXPIRY: '30m',
  JWT_REFRESH_EXPIRY: '14d',
  SENDGRID_API_KEY: 'SG.fake',
  FROM_EMAIL: 'noreply@example.com',
  PORT: '4000',
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:3000',
};

function loadEnvModule() {
  jest.resetModules();
  jest.doMock('dotenv', () => ({
    __esModule: true,
    default: { config: jest.fn() },
  }));

  return require('../../src/config/env');
}

describe('env config', () => {
  beforeEach(() => {
    process.env = { ...validEnv };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('loads typed config from valid environment', () => {
    const { config } = loadEnvModule();

    expect(config.database.url).toBe(validEnv.DATABASE_URL);
    expect(config.database.testUrl).toBe(validEnv.DATABASE_URL_TEST);
    expect(config.jwt.accessSecret).toBe(validEnv.JWT_ACCESS_SECRET);
    expect(config.jwt.refreshSecret).toBe(validEnv.JWT_REFRESH_SECRET);
    expect(config.app.port).toBe(4000);
    expect(config.app.nodeEnv).toBe('test');
  });

  it('applies defaults for optional env vars', () => {
    delete process.env.DATABASE_URL_TEST;
    delete process.env.JWT_ACCESS_EXPIRY;
    delete process.env.JWT_REFRESH_EXPIRY;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.FROM_EMAIL;

    const { config } = loadEnvModule();

    expect(config.database.testUrl).toBe(validEnv.DATABASE_URL);
    expect(config.jwt.accessExpiry).toBe('15m');
    expect(config.jwt.refreshExpiry).toBe('7d');
    expect(config.email.sendgridApiKey).toBe('');
    expect(config.email.fromEmail).toBe('noreply@example.com');
  });

  it('throws when required env vars are missing', () => {
    delete process.env.FRONTEND_URL;

    expect(() => loadEnvModule()).toThrow(
      'Missing required environment variables: FRONTEND_URL'
    );
  });

  it('throws when access secret is too short', () => {
    process.env.JWT_ACCESS_SECRET = 'short';

    expect(() => loadEnvModule()).toThrow(
      'JWT_ACCESS_SECRET must be at least 32 characters long'
    );
  });

  it('throws when refresh secret is too short', () => {
    process.env.JWT_REFRESH_SECRET = 'short';

    expect(() => loadEnvModule()).toThrow(
      'JWT_REFRESH_SECRET must be at least 32 characters long'
    );
  });
});
