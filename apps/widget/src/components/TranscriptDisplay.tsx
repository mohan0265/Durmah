import React from 'react';

interface TranscriptDisplayProps {
  transcript: string[];
  isProcessing: boolean;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript, isProcessing }) => {
  return (
    <div className="transcript-display">
      {transcript.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      {isProcessing && <p>Processing...</p>}
    </div>
  );
};
