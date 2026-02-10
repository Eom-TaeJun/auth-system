import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

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
    nodeEnv: string;
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
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL!,
  },
};

export default config;
