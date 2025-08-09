import { describe, test, expect } from 'vitest';
import { TTSProvider } from '../../src/providers/types';

export function ttsContractTest(make: () => TTSProvider) {
  describe('TTS Provider Contract', () => {
    test('info() declares required capabilities', () => {
      const provider = make();
      const info = provider.info();
      
      expect(info.name).toBeTruthy();
      expect(info.version).toBeTruthy();
      expect(Array.isArray(info.capabilities)).toBe(true);
    });
    
    test('speak() returns a stream handle', async () => {
      const provider = make();
      const handle = await provider.speak(
        { text: 'Hello world', stream: true },
        { orgId: 'test' }
      );
      
      expect(handle.streamUrl || handle.nodeStream).toBeTruthy();
    });
  });
}
