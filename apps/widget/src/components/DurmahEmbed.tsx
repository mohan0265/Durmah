// src/components/DurmahEmbed.tsx
'use client';
import React, { useState, useEffect } from 'react';

type Props = {
  widgetUrl: string; // e.g. https://durmah-widget.netlify.app
  buttonLabel?: string;
};

export default function DurmahEmbed({ widgetUrl, buttonLabel = 'Durmah' }: Props) {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' ? setOpen(false) : null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 99999,
          borderRadius: 999, padding: '12px 16px', fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', cursor: 'pointer'
        }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(420px, 95vw)', height: 'min(680px, 90vh)', borderRadius: 16,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', background: '#000'
            }}
          >
            <iframe
              src={widgetUrl}
              title="Durmah"
              style={{ border: 'none', width: '100%', height: '100%' }}
              allow="microphone; autoplay; clipboard-read; clipboard-write"
            />
          </div>
        </div>
      )}
    </>
  );
}
