import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { providerRegistry } from '../providers';

const providers: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /v1/providers/
  app.get('/', async () => {
    const tts = providerRegistry.getTTS('elevenlabs');
    const stt = providerRegistry.getSTT('openai-stt');
    const llm = providerRegistry.getLLM('openai');
    return {
      tts: tts?.info() || null,
      stt: stt?.info() || null,
      llm: llm?.info() || null
    };
  });
};

export default providers;
