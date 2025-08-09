import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

import chat from './chat';
import transcripts from './transcripts';
import providers from './providers';
import config from './config';
import techwatch from './techwatch';

const registerRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // health within /v1
  app.get('/healthz', async () => ({ ok: true }));

  // mount feature routers under stable prefixes
  await app.register(chat,        { prefix: '/chat' });
  await app.register(transcripts, { prefix: '/transcripts' });
  await app.register(providers,   { prefix: '/providers' });
  await app.register(config,      { prefix: '/config' });
  await app.register(techwatch,   { prefix: '/techwatch' });
};

export default registerRoutes;
