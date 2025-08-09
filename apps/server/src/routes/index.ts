import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import healthRoutes from './health';
import chatRoutes from './chat';
import providersRoutes from './providers';
import transcriptsRoutes from './transcripts';
import techwatchRoutes from './techwatch';

const registerRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(healthRoutes);
  await app.register(chatRoutes,       { prefix: '/chat' });
  await app.register(providersRoutes,  { prefix: '/providers' });
  await app.register(transcriptsRoutes,{ prefix: '/transcripts' });
  await app.register(techwatchRoutes,  { prefix: '/techwatch' });
};

export default registerRoutes;