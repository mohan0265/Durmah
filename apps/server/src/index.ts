import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config as loadEnv } from 'dotenv';
import registerRoutes from './routes/index';   // explicit path
import { initProviders } from './providers';
import { getSupabase } from './db/client';     // <-- use getSupabase

loadEnv();

const server = Fastify({ logger: true });

async function start() {
  // initialize Supabase client once (creates it if not yet created)
  getSupabase();

  // initialize AI providers
  initProviders();

  // plugins
  await server.register(cors, { origin: process.env.CORS_ORIGIN || '*' });
  await server.register(websocket);

  // API routes
  await server.register(registerRoutes, { prefix: '/v1' });

  const port = parseInt(process.env.PORT || '8080', 10);
  await server.listen({ port, host: '0.0.0.0' });
  server.log.info(`Server running on http://localhost:${port}`);
}

start().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
