// apps/server/src/routes/index.ts
import type { FastifyInstance } from 'fastify';
import { chatRoutes } from './chat';
import { configRoutes } from './config';
import { providersRoutes } from './providers';
import { techwatchRoutes } from './techwatch';
import { transcriptsRoutes } from './transcripts';
import { sessionRoutes } from './session';

export default function registerRoutes(server: FastifyInstance) {
  // API route groups
  server.register(chatRoutes,        { prefix: '/v1/chat' });
  server.register(configRoutes,      { prefix: '/v1/config' });
  server.register(providersRoutes,   { prefix: '/v1/providers' });
  server.register(techwatchRoutes,   { prefix: '/v1/techwatch' });
  server.register(transcriptsRoutes, { prefix: '/v1/transcripts' });
  server.register(sessionRoutes,     { prefix: '/v1/session' });

  // Health checks (support both paths)
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  server.get('/healthz', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
}
