import React, { useState } from 'react';
import type { WidgetConfig } from '@durmah/schema';
import { useStore } from './store';
import  AudioWaveform  from './components/AudioWaveform';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { StatusOrb } from './components/StatusOrb';

type WidgetConfigWithServer = WidgetConfig & { serverUrl: string };

interface DurmahWidgetProps {
  config: WidgetConfigWithServer; // must include serverUrl for startSession()
  onOpen?: () => void;
  onClose?: () => void;
  onTranscriptSaved?: (transcript: Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }>) => void;
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
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  const {
    startSession,
    endSession,
    transcript,
    isProcessing,
    isListening
  } = useStore();

  const isMobile = () => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  const handleOpen = async () => {
    try {
      setIsOpen(true);
      onOpen?.();
      // startSession needs serverUrl on the config
      await startSession(config); // auto-start listening when WS opens
    } catch (err) {
      onError?.(err as Error);
    }
  };

  const handleClose = async () => {
    try {
      await endSession();
    } finally {
      setIsOpen(false);
      // On mobile, show transcript review modal
      if (isMobile() && transcript.length > 0) {
        setShowTranscriptModal(true);
      } else {
        onClose?.();
      }
    }
  };

  const handleKeepTranscript = async () => {
    try {
      const response = await fetch(`${config.serverUrl}/v1/transcripts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      if (response.ok) onTranscriptSaved?.(transcript);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setShowTranscriptModal(false);
      onClose?.();
    }
  };

  const handleDiscardTranscript = () => {
    setShowTranscriptModal(false);
    onClose?.();
  };

  const getStatus = () => {
    if (isProcessing) return 'Thinking…';
    if (isListening) return 'Listening…';
    return 'Speaking…';
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
        </button>
      ) : (
        <div className={`durmah-panel ${isMobile() ? 'mobile' : 'desktop'}`}>
          <div className="durmah-header">
            <div className="header-content">
              <StatusOrb status={isProcessing ? 'thinking' : isListening ? 'listening' : 'speaking'} />
              <div className="brand-info">
                <img src={config.brand.logoUrl} alt={config.brand.name} />
                <h3>{config.brand.name}</h3>
              </div>
            </div>
            <button onClick={handleClose} aria-label="End session" className="close-button">
              ✖
            </button>
          </div>

          <div className="durmah-content">
            {config.features.voiceMode && <AudioWaveform isActive={isListening} />}

            <TranscriptDisplay transcript={transcript} isProcessing={isProcessing} />
          </div>

          <div className="durmah-footer">
            <div className="status-indicator">{getStatus()}</div>
            <button onClick={handleClose} className="end-button">
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Mobile Transcript Review Modal */}
      {showTranscriptModal && (
        <div className="transcript-modal-overlay">
          <div className="transcript-modal">
            <div className="modal-header">
              <h3>Session Complete</h3>
              <p>Would you like to save this conversation?</p>
            </div>

            <div className="modal-content">
              <div className="transcript-preview">
                {transcript.map((entry, index) => (
                  <div key={index} className={`message ${entry.role}`}>
                    <strong>{entry.role === 'user' ? 'You' : 'Durmah'}:</strong>
                    <p>{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleDiscardTranscript} className="discard-button">
                Discard
              </button>
              <button onClick={handleKeepTranscript} className="keep-button">
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
