import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config as loadEnv } from 'dotenv';
import registerRoutes from './routes/index';
import { initProviders } from './providers';
import { getSupabase } from './db/client';

loadEnv();

export async function buildServer() {
  const server = Fastify({ logger: true });

  // One-time init (safe to call; no-op if already created)
  getSupabase();
  initProviders();

  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || '*'
  });

  await server.register(websocket);

  // All API routes are prefixed in index to '/v1'
  await server.register(registerRoutes, { prefix: '/v1' });

  await server.ready();

  return server;
}