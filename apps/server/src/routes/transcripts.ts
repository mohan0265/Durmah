import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getSupabase } from '../db/client';

const Params = z.object({ id: z.string() });
const Body = z.object({ transcript: z.array(z.any()) });

const transcripts: FastifyPluginAsync = async (app: FastifyInstance) => {
  // POST /v1/transcripts/:id/save
  app.post('/:id/save', async (request, reply) => {
    const { id } = Params.parse(request.params);
    const { transcript } = Body.parse(request.body ?? {});
    const supabase = getSupabase();

    const { error } = await supabase
      .from('transcripts')
      .insert({
        session_id: id,
        payload_json: { transcript },
        org_id: (request.headers['x-org-id'] as string | undefined) ?? null,
        user_id: (request.headers['x-user-id'] as string | undefined) ?? null
      });

    if (error) return reply.code(500).send({ error: 'Failed to save transcript' });
    return { success: true };
  });

  // POST /v1/transcripts/:id/delete
  app.post('/:id/delete', async (request, reply) => {
    const { id } = Params.parse(request.params);
    const supabase = getSupabase();

    const { error } = await supabase.from('transcripts').delete().eq('session_id', id);
    if (error) return reply.code(500).send({ error: 'Failed to delete transcript' });
    return { success: true };
  });
};

export default transcripts;
