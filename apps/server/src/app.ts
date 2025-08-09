import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config as loadEnv } from 'dotenv';
import registerRoutes from './routes/index';
import { initProviders } from './providers';
import { getSupabase } from './db/client';

loadEnv();

export function buildServer() {
  const server = Fastify({ logger: true });

  // One-time init (safe to call; no-op if already created)
  getSupabase();
  initProviders();

  server.register(cors, {
    origin: process.env.CORS_ORIGIN || '*'
  });

  server.register(websocket);

  // All API routes are prefixed in index to '/v1'
  server.register(registerRoutes, { prefix: '/v1' });

  return server;
}
