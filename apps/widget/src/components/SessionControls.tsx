import React from 'react';
import { WidgetConfig } from '@durmah/schema';

interface SessionControlsProps {
  isListening: boolean;
  onToggleListening: () => void;
  onEndSession: () => void;
  config: WidgetConfig;
}

export const SessionControls: React.FC<SessionControlsProps> = ({ isListening, onToggleListening, onEndSession, config }) => {
  return (
    <div className="session-controls">
      <button onClick={onToggleListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <button onClick={onEndSession}>End Session</button>
    </div>
  );
};
