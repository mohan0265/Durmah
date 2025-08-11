import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { supabase } from '../db/client';

export const transcriptRoutes: FastifyPluginAsync = async (server) => {
  server.post('/:id/save', {
    schema: {
      params: z.object({
        id: z.string()
      }),
      body: z.object({
        transcript: z.array(z.any())
      })
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { transcript } = request.body as any;
    
    const { error } = await supabase
      .from('transcripts')
      .insert({
        session_id: id,
        payload_json: { transcript },
        org_id: request.headers['x-org-id'],
        user_id: request.headers['x-user-id']
      });
    
    if (error) {
      return reply.code(500).send({ error: 'Failed to save transcript' });
    }
    
    return { success: true };
  });
  
  server.post('/:id/delete', {
    schema: {
      params: z.object({
        id: z.string()
      })
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const { error } = await supabase
      .from('transcripts')
      .delete()
      .eq('session_id', id);
    
    if (error) {
      return reply.code(500).send({ error: 'Failed to delete transcript' });
    }
    
    return { success: true };
  });
};
