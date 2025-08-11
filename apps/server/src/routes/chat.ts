import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { providerRegistry } from '../providers';

export const chatRoutes: FastifyPluginAsync = async (server) => {
  server.post('/', {
    schema: {
      body: z.object({
        message: z.string(),
        sessionId: z.string().optional(),
        model: z.string().optional()
      })
    }
  }, async (request, reply) => {
    const { message, sessionId, model } = request.body as any;
    
    const llmProvider = providerRegistry.getLLM('openai');
    if (!llmProvider) {
      return reply.code(503).send({ error: 'LLM provider unavailable' });
    }
    
    const messages = [
      {
        role: 'system' as const,
        content: 'You are Durmah, a helpful legal studies assistant.'
      },
      {
        role: 'user' as const,
        content: message
      }
    ];
    
    let responseText = '';
    const stream = llmProvider.complete(
      { messages, model },
      { orgId: 'default' }
    );
    
    for await (const chunk of stream) {
      if (chunk.delta) {
        responseText += chunk.delta;
      }
    }
    
    return { response: responseText };
  });
};
