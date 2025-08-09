import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

// Minimal local definition so we don't depend on @durmah/schema yet
type WidgetConfig = {
  id: string;
  brand: {
    name: string;
    logoUrl: string;
    iconUrl: string;
    colors: { primary: string; accent: string; text: string; bg: string };
  };
  voice: { provider: string; voiceId: string; rate: number; pitch: number };
  ai: { chatModel: string; temperature: number; maxTokens: number };
  features: {
    voiceMode: boolean; textMode: boolean;
    autoOpenTranscriptOnSessionEnd: boolean; saveTranscriptsByDefault: boolean;
  };
  contentPackId: string;
  policies: { gdprRegion: string; piiAllowed: boolean; retainAudio: boolean };
};

const configs: Record<string, WidgetConfig> = {
  durham: {
    id: 'durham-law-2025',
    brand: {
      name: 'Durmah',
      logoUrl: 'https://durham.ac.uk/logo.svg',
      iconUrl: 'https://durham.ac.uk/icon.svg',
      colors: { primary: '#7C2855', accent: '#D4AF37', text: '#333333', bg: '#FFFFFF' }
    },
    voice: { provider: 'elevenlabs', voiceId: 'Rachel', rate: 1.0, pitch: 0 },
    ai: { chatModel: 'gpt-4o', temperature: 0.2, maxTokens: 2048 },
    features: { voiceMode: true, textMode: true, autoOpenTranscriptOnSessionEnd: true, saveTranscriptsByDefault: false },
    contentPackId: 'durham-law-2025',
    policies: { gdprRegion: 'UK', piiAllowed: false, retainAudio: false }
  },
  oxford: {
    id: 'oxford-law-2025',
    brand: {
      name: 'Oxford Legal AI',
      logoUrl: 'https://oxford.ac.uk/logo.svg',
      iconUrl: 'https://oxford.ac.uk/icon.svg',
      colors: { primary: '#002147', accent: '#CF7A30', text: '#333333', bg: '#FFFFFF' }
    },
    voice: { provider: 'azure', voiceId: 'en-GB-SoniaNeural', rate: 1.0, pitch: 0 },
    ai: { chatModel: 'gpt-4o', temperature: 0.2, maxTokens: 2048 },
    features: { voiceMode: true, textMode: true, autoOpenTranscriptOnSessionEnd: true, saveTranscriptsByDefault: true },
    contentPackId: 'oxford-law-2025',
    policies: { gdprRegion: 'UK', piiAllowed: false, retainAudio: false }
  }
};

const configRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/:orgId', async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const config = configs[orgId];
    if (!config) return reply.code(404).send({ error: 'Configuration not found' });
    return { ...config, serverUrl: `http://localhost:${process.env.PORT || 8080}` };
  });
};

export default configRoutes;
