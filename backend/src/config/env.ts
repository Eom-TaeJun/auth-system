import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

type NodeEnv = 'development' | 'test' | 'production';

const ROOT_ENV_PATH = resolve(__dirname, '../../../.env');
const BACKEND_ENV_PATH = resolve(__dirname, '../../.env');
const SENDGRID_PLACEHOLDER = 'your-sendgrid-api-key-here';

// Prefer root .env for workspace-level configuration and support backend/.env as fallback.
dotenv.config({
  path: existsSync(ROOT_ENV_PATH) ? ROOT_ENV_PATH : BACKEND_ENV_PATH,
});

/**
 * Application configuration loaded from environment variables
 */
interface Config {
  database: {
    url: string;
    testUrl: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  email: {
    sendgridApiKey: string;
    fromEmail: string;
  };
  app: {
    port: number;
    nodeEnv: NodeEnv;
    frontendUrl: string;
  };
}

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required variable is missing
 */
function validateEnv(): void {
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }

  // Validate JWT secrets are strong enough
  if (process.env.JWT_ACCESS_SECRET!.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long');
  }
  if (process.env.JWT_REFRESH_SECRET!.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  const nodeEnv = process.env.NODE_ENV!;
  if (!isSupportedNodeEnv(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }

  const frontendUrl = process.env.FRONTEND_URL!;
  assertValidUrl(frontendUrl, 'FRONTEND_URL');

  const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
  if (!isValidEmail(fromEmail)) {
    throw new Error('FROM_EMAIL must be a valid email address');
  }

  const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
  if (hasNonPlaceholderValue(sendgridApiKey) && !sendgridApiKey.startsWith('SG.')) {
    throw new Error('SENDGRID_API_KEY must start with "SG."');
  }

  if (nodeEnv === 'production' && !isConfiguredSendGridKey(sendgridApiKey)) {
    throw new Error('SENDGRID_API_KEY must be configured in production');
  }
}

// Validate on module load
validateEnv();

/**
 * Typed configuration object
 */
export const config: Config = {
  database: {
    url: process.env.DATABASE_URL!,
    testUrl: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL!,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
  },
  app: {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV as NodeEnv,
    frontendUrl: process.env.FRONTEND_URL!,
  },
};

export default config;

function isSupportedNodeEnv(value: string): value is NodeEnv {
  return value === 'development' || value === 'test' || value === 'production';
}

function assertValidUrl(value: string, envName: string): void {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
  } catch {
    throw new Error(`${envName} must be a valid URL`);
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasNonPlaceholderValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  return trimmed !== SENDGRID_PLACEHOLDER;
}

function isConfiguredSendGridKey(value: string): boolean {
  return hasNonPlaceholderValue(value) && value.startsWith('SG.');
}
