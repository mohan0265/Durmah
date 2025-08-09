import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getSupabase } from '../db/client';

const bodySchema = z.object({
  vendor: z.string(),
  url: z.string().url().optional(),
  category: z.string()
});

const techwatch: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /v1/techwatch/candidates
  app.get('/candidates', async (_req, reply) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('provider_candidates')
      .select('*')
      .order('fit_score', { ascending: false });

    if (error) return reply.code(500).send({ error: 'Failed to fetch candidates' });
    return data;
  });

  // POST /v1/techwatch/evaluate
  app.post('/evaluate', async (request, reply) => {
    const { vendor, url, category } = bodySchema.parse(request.body ?? {});
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('provider_candidates')
      .insert({
        vendor,
        category,
        fit_score: 50,
        risk_score: 50,
        status: 'under_review',
        data_json: { url, manualEntry: true }
      })
      .select()
      .single();

    if (error) return reply.code(500).send({ error: 'Failed to create candidate' });
    return data;
  });
};

export default techwatch;
