import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { providerRegistry } from '../providers';

const Body = z.object({
  message: z.string(),
  sessionId: z.string().optional(), // accepted input, but not passed to provider options unless your type supports it
  model: z.string().optional()
});

const chat: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/', async (request, reply) => {
    const { message, sessionId, model } = Body.parse(request.body ?? {});
    const llmProvider = providerRegistry.getLLM('openai');

    if (!llmProvider) {
      return reply.code(503).send({ error: 'LLM provider unavailable' });
    }

    const messages = [
      { role: 'system' as const, content: 'You are Durmah, a helpful legal studies assistant.' },
      { role: 'user'   as const, content: message }
    ];

    let responseText = '';
    // NOTE: removed `sessionId` from the options object to match current provider typings
    const stream = llmProvider.complete({ messages, model }, { orgId: 'default' });

    for await (const chunk of stream) {
      if (chunk?.delta) responseText += chunk.delta;
    }

    return { response: responseText, sessionId }; // echo back if you need it
  });
};

export default chat;
