// apps/server/src/routes/providers.ts
import { FastifyPluginAsync } from 'fastify';
import { providerRegistry } from '../providers';

export const providersRoutes: FastifyPluginAsync = async (server) => {
  server.get('/active', async () => {
    const tts = providerRegistry.getTTS('elevenlabs');
    const stt = providerRegistry.getSTT('openai-stt');
    const llm = providerRegistry.getLLM('openai');
    return { tts: tts?.info() || null, stt: stt?.info() || null, llm: llm?.info() || null };
  });
};
