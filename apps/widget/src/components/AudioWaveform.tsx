import React from 'react';

type AudioWaveformProps = { isActive: boolean };

export default function AudioWaveform({ isActive }: AudioWaveformProps) {
  return (
    <div className={`audio-waveform ${isActive ? 'active' : ''}`}>
      <div className="waveform-bars">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}
