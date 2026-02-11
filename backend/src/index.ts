import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { closePool } from './config/database';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

/**
 * Creates and configures the Fastify application instance.
 */
export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.app.nodeEnv !== 'test',
  });

  await app.register(cors, {
    origin: config.app.frontendUrl,
    credentials: true,
  });

  await app.register(cookie);

  await app.register(helmet, {
    contentSecurityPolicy: config.app.nodeEnv === 'production',
    global: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  app.setErrorHandler(errorHandler);

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });

  return app;
}

/**
 * Starts the API server.
 */
export async function startServer(): Promise<FastifyInstance> {
  const app = await createApp();

  await app.listen({
    port: config.app.port,
    host: '0.0.0.0',
  });

  return app;
}

if (require.main === module) {
  startServer()
    .then((app) => {
      const shutdown = async (signal: string): Promise<void> => {
        app.log.info({ signal }, 'Shutting down server');
        await app.close();
        await closePool();
        process.exit(0);
      };

      process.on('SIGINT', () => {
        void shutdown('SIGINT');
      });
      process.on('SIGTERM', () => {
        void shutdown('SIGTERM');
      });

      app.log.info(
        `Server running on http://localhost:${config.app.port}`
      );
    })
    .catch((error) => {
      console.error('Failed to start server', error);
      process.exit(1);
    });
}
