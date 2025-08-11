import React, { useEffect, useRef } from 'react';

interface TranscriptEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  isProcessing: boolean;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ 
  transcript, 
  isProcessing 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="transcript-display" ref={scrollRef}>
      {transcript.length === 0 && !isProcessing && (
        <div className="empty-state">
          <p>Start speaking to begin your conversation with Durmah...</p>
        </div>
      )}
      
      {transcript.map((entry, index) => (
        <div key={index} className={`message ${entry.role}`}>
          <div className="message-header">
            <span className="role">
              {entry.role === 'user' ? 'You' : 'Durmah'}
            </span>
            <span className="timestamp">
              {new Date(entry.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="message-content">
            {entry.content}
          </div>
        </div>
      ))}
      
      {isProcessing && (
        <div className="message assistant processing">
          <div className="message-header">
            <span className="role">Durmah</span>
          </div>
          <div className="message-content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

