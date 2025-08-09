import { describe } from 'vitest';
import { ttsContractTest } from './tts.contract.spec';
import { ElevenLabsTTS } from '../../src/providers/tts/elevenlabs';

describe('ElevenLabs TTS', () => {
  ttsContractTest(() => new ElevenLabsTTS());
});
