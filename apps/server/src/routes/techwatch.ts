import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/client';

export const techwatchRoutes: FastifyPluginAsync = async (server) => {
  server.get('/candidates', async (request, reply) => {
    const { data, error } = await supabase
      .from('provider_candidates')
      .select('*')
      .order('fit_score', { ascending: false });
    
    if (error) {
      return reply.code(500).send({ error: 'Failed to fetch candidates' });
    }
    
    return data;
  });
  
  server.post('/evaluate', {
    schema: {
      body: {
        type: 'object',
        properties: {
          vendor: { type: 'string' },
          url: { type: 'string' },
          category: { type: 'string' }
        },
        required: ['vendor', 'category']
      }
    }
  }, async (request, reply) => {
    const { vendor, url, category } = request.body as any;
    
    // Manual evaluation entry
    const { data, error } = await supabase
      .from('provider_candidates')
      .insert({
        vendor,
        category,
        fit_score: 50, // Default neutral score
        risk_score: 50,
        status: 'under_review',
        data_json: { url, manualEntry: true }
      })
      .select()
      .single();
    
    if (error) {
      return reply.code(500).send({ error: 'Failed to create candidate' });
    }
    
    return data;
  });
};
