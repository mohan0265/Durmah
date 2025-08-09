import React, { useState } from 'react';
import { useStore, WidgetConfig } from './store';

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
  const [showTranscript, setShowTranscript] = useState(false);
  const { 
    startSession, 
    endSession, 
    toggleListening,
    transcript,
    isProcessing,
    sessionId 
  } = useStore();
  
  const handleOpen = async () => {
    setIsOpen(true);
    onOpen?.();
    await startSession(config);
  };
  
  const handleClose = async () => {
    if (transcript.length > 0 && !showTranscript) {
      setShowTranscript(true);
      return;
    }
    
    await endSession();
    setIsOpen(false);
    setShowTranscript(false);
    onClose?.();
  };
  
  const handleToggleListening = () => {
    toggleListening();
  };
  
  const handleSaveTranscript = () => {
    if (onTranscriptSaved && transcript.length > 0) {
      onTranscriptSaved(transcript);
    }
    // Create download
    const content = transcript.map(entry => 
      `${entry.role.toUpperCase()}: ${entry.content}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `durmah-session-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDeleteTranscript = async () => {
    await endSession();
    setIsOpen(false);
    setShowTranscript(false);
    onClose?.();
  };
  
  const getVoiceState = () => {
    if (isProcessing) return 'processing';
    if (sessionId && !showTranscript) return 'listening';
    return 'idle';
  };
  
  const getVoiceIcon = () => {
    const state = getVoiceState();
    
    if (state === 'processing') {
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12,4V2C6.48,2 2,6.48 2,12s4.48,10 10,10s10-4.48 10-10c0-1.19-0.22-2.33-0.6-3.39L19.65,10.35C19.88,11.23 20,12.1 20,12c0,4.42-3.58,8-8,8s-8-3.58-8-8s3.58-8 8-8V4z"/>
        </svg>
      );
    } else if (state === 'listening') {
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12,14C13.66,14 15,12.66 15,11V5C15,3.34 13.66,2 12,2C10.34,2 9,3.34 9,5V11C9,12.66 10.34,14 12,14M17,11C17,14.53 14.39,17.44 11,17.93V21H13V23H11V23H9V21H11V17.93C7.61,17.44 5,14.53 5,11H7C7,13.76 9.24,16 12,16C14.76,16 17,13.76 17,11H17Z"/>
        </svg>
      );
    }
    
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
      </svg>
    );
  };
  
  const getStatusText = () => {
    if (showTranscript) return 'Session Complete';
    if (isProcessing) return 'Durmah is thinking...';
    if (sessionId) return 'Listening... Tap to speak';
    return 'Tap to start conversation';
  };
  
  const brandStyles = {
    '--durmah-primary': config.brand.colors.primary,
    '--durmah-accent': config.brand.colors.accent,
    '--durmah-text': config.brand.colors.text,
    '--durmah-bg': config.brand.colors.bg
  } as React.CSSProperties;
  
  return (
    <div className="durmah-widget" style={brandStyles}>
      {!isOpen ? (
        <button 
          className="durmah-float-button"
          onClick={handleOpen}
          aria-label="Open Legal Eagle Buddy"
        >
          <img src={config.brand.iconUrl} alt={config.brand.name} />
          {sessionId && <span className="pulse-ring" />}
        </button>
      ) : (
        <div className="durmah-panel">
          {/* Header */}
          <div className="durmah-header">
            <img src={config.brand.logoUrl} alt={config.brand.name} />
            <h3>{config.brand.name}</h3>
            <button 
              className="durmah-close-btn" 
              onClick={handleClose} 
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="durmah-content">
            {!showTranscript ? (
              /* Voice Interface */
              <>
                <div className="durmah-voice-indicator">
                  <div 
                    className={`voice-orb ${getVoiceState()}`}
                    onClick={sessionId ? handleToggleListening : () => startSession(config)}
                  >
                    {getVoiceIcon()}
                  </div>
                </div>
                
                <div className={`voice-status ${getVoiceState()}`}>
                  {getStatusText()}
                </div>
                
                {/* Live Transcript */}
                <div className="transcript-container">
                  {transcript.length === 0 ? (
                    <div className="transcript-empty">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                      </svg>
                      <h3>Ready to help with your law studies</h3>
                      <p>Your AI legal tutor and study companion. Tap the microphone to start a conversation about any legal topic, case law, or study questions.</p>
                    </div>
                  ) : (
                    <div className="transcript-display">
                      {transcript.map((entry, index) => (
                        <div key={index} className={`transcript-entry transcript-${entry.role}`}>
                          <div className="transcript-role">{entry.role === 'user' ? 'You' : 'Durmah'}</div>
                          <div>{entry.content}</div>
                        </div>
                      ))}
                      {isProcessing && (
                        <div className="processing-indicator">
                          Durmah is thinking
                          <div className="processing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Session Controls */}
                {sessionId && (
                  <div className="session-controls">
                    {transcript.length > 0 && (
                      <button 
                        className="control-btn"
                        onClick={handleClose}
                      >
                        View Transcript
                      </button>
                    )}
                    <button 
                      className="control-btn danger"
                      onClick={handleDeleteTranscript}
                    >
                      End Session
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Transcript Review */
              <>
                <div className="transcript-container">
                  <div className="transcript-display">
                    <div style={{padding: '20px', textAlign: 'center', borderBottom: '1px solid var(--durmah-border)'}}>
                      <h3 style={{margin: '0 0 8px 0', color: 'var(--durmah-primary)'}}>Session Summary</h3>
                      <p style={{margin: 0, color: 'var(--durmah-text-light)', fontSize: '14px'}}>
                        {transcript.length} messages • {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    {transcript.map((entry, index) => (
                      <div key={index} className={`transcript-entry transcript-${entry.role}`}>
                        <div className="transcript-role">{entry.role === 'user' ? 'You' : 'Durmah'}</div>
                        <div>{entry.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Transcript Actions */}
                <div className="transcript-actions">
                  <button 
                    className="action-btn success"
                    onClick={handleSaveTranscript}
                  >
                    📄 Save Transcript
                  </button>
                  <button 
                    className="action-btn"
                    onClick={handleDeleteTranscript}
                  >
                    🗑️ Delete & Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
