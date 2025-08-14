// apps/server/src/routes/transcripts.ts
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getSupabase } from '../db/client';

export const transcriptsRoutes: FastifyPluginAsync = async (server) => {
  // Save or overwrite a session transcript
  server.post('/:id/save', {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ transcript: z.array(z.any()) })
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { transcript } = request.body as { transcript: any[] };
    const supabase = getSupabase();

    // Upsert by session_id (adjust table/columns to your schema)
    const { error } = await supabase
      .from('transcripts')
      .upsert({ session_id: id, content: transcript, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });

    if (error) return reply.code(500).send({ error: 'Failed to save transcript' });
    return { success: true };
  });

  // Fetch transcript (optional convenience)
  server.get('/:id', { schema: { params: z.object({ id: z.string() }) } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const supabase = getSupabase();
    const { data, error } = await supabase.from('transcripts').select('*').eq('session_id', id).maybeSingle();

    if (error)   return reply.code(500).send({ error: 'Failed to load transcript' });
    if (!data)   return reply.code(404).send({ error: 'Not found' });
    return { transcript: data.content, updated_at: data.updated_at };
  });

  // Delete transcript
  server.delete('/:id', { schema: { params: z.object({ id: z.string() }) } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const supabase = getSupabase();

    const { error } = await supabase.from('transcripts').delete().eq('session_id', id);
    if (error) return reply.code(500).send({ error: 'Failed to delete transcript' });
    return { success: true };
  });
};
