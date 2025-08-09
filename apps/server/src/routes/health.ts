import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/healthz', async () => ({ ok: true, ts: Date.now() }));
};

export default healthRoutes;
