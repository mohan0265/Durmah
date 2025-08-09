import React, { useState, useEffect, useRef } from 'react';
import { WidgetConfig } from '@durmah/schema';
import { useStore } from './store';
import { AudioWaveform } from './components/AudioWaveform';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { SessionControls } from './components/SessionControls';

interface DurmahWidgetProps {
  config: WidgetConfig;
  onOpen?: () => void;
  onClose?: () => void;
  onTranscriptSaved?: (transcript: any) => void;
  onError?: (error: Error) => void;
}

export const DurmahWidget: React.FC<DurmahWidgetProps> = ({
  config,
  onOpen,
  onClose,
  onTranscriptSaved,
  onError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { 
    startSession, 
    endSession, 
    toggleListening,
    transcript,
    isProcessing 
  } = useStore();
  
  const handleOpen = async () => {
    setIsOpen(true);
    onOpen?.();
    await startSession(config);
  };
  
  const handleClose = async () => {
    await endSession();
    setIsOpen(false);
    onClose?.();
  };
  
  const handleToggleListening = () => {
    setIsListening(!isListening);
    toggleListening();
  };
  
  const brandStyles = {
    '--primary': config.brand.colors.primary,
    '--accent': config.brand.colors.accent,
    '--text': config.brand.colors.text,
    '--bg': config.brand.colors.bg
  } as React.CSSProperties;
  
  return (
    <div className="durmah-widget" style={brandStyles}>
      {!isOpen ? (
        <button 
          className="durmah-float-button"
          onClick={handleOpen}
          aria-label="Open Durmah Assistant"
        >
          <img src={config.brand.iconUrl} alt={config.brand.name} />
          {isListening && <span className="pulse-ring" />}
        </button>
      ) : (
        <div className="durmah-panel">
          <div className="durmah-header">
            <img src={config.brand.logoUrl} alt={config.brand.name} />
            <h3>{config.brand.name}</h3>
            <button onClick={handleClose} aria-label="Close">×</button>
          </div>
          
          <div className="durmah-content">
            {config.features.voiceMode && (
              <AudioWaveform isActive={isListening} />
            )}
            
            <TranscriptDisplay 
              transcript={transcript}
              isProcessing={isProcessing}
            />
            
            <SessionControls
              isListening={isListening}
              onToggleListening={handleToggleListening}
              onEndSession={handleClose}
              config={config}
            />
          </div>
        </div>
      )}
    </div>
  );
};
