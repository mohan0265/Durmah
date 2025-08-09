import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive }) => {
  return (
    <div className="audio-waveform">
      {isActive ? 'Listening...' : 'Not listening'}
    </div>
  );
};
