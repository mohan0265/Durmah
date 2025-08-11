// Minimal audio helpers used by the store. No external deps.
export class AudioCapture {
  private ctx?: AudioContext;
  private processor?: ScriptProcessorNode;
  private mediaStream?: MediaStream;
  private recording = false;

  async initialize(): Promise<boolean> {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = this.ctx.createMediaStreamSource(this.mediaStream);

      // ScriptProcessor is widely supported; size 4096 keeps CPU low.
      this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
      src.connect(this.processor);
      this.processor.connect(this.ctx.destination); // required in some browsers

      return true;
    } catch {
      return false;
    }
  }

  // Callback receives raw PCM floats in an ArrayBuffer (mono, 16‑bit, 16k)
  startRecording(onChunk: (buf: ArrayBuffer, isFinal: boolean) => void): boolean {
    if (!this.ctx || !this.processor) return false;
    if (this.recording) return true;
    this.recording = true;

    this.processor.onaudioprocess = (e) => {
      if (!this.recording) return;
      const input = e.inputBuffer.getChannelData(0);   // Float32Array [-1,1]
      // Downsample to 16k mono 16‑bit PCM
      const targetRate = 16000;
      const srcRate = this.ctx!.sampleRate;
      const ratio = srcRate / targetRate;
      const outLen = Math.floor(input.length / ratio);
      const out = new Int16Array(outLen);

      for (let i = 0; i < outLen; i++) {
        const idx = Math.floor(i * ratio);
        const s = Math.max(-1, Math.min(1, input[idx]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      onChunk(out.buffer, false);
    };

    return true;
  }

  stopRecording(): void {
    this.recording = false;
    if (this.processor) this.processor.onaudioprocess = null;
  }

  cleanup(): void {
    this.stopRecording();
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.processor?.disconnect();
    this.ctx?.close();
    this.processor = undefined;
    this.ctx = undefined;
  }
}

export class AudioPlayback {
  private ctx?: AudioContext;

  async initialize(): Promise<boolean> {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      return true;
    } catch {
      return false;
    }
  }

  // Play an MP3/OPUS/PCM blob from server
  async playArrayBuffer(buf: ArrayBuffer) {
    if (!this.ctx) return;
    const audioBuf = await this.ctx.decodeAudioData(buf.slice(0));
    const src = this.ctx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(this.ctx.destination);
    src.start();
  }

  cleanup(): void {
    this.ctx?.close();
    this.ctx = undefined;
  }
}
