import React from 'react';

interface StatusOrbProps {
  status: 'listening' | 'thinking' | 'speaking';
}

export const StatusOrb: React.FC<StatusOrbProps> = ({ status }) => {
  const getOrbClass = () => {
    switch (status) {
      case 'listening':
        return 'status-orb listening';
      case 'thinking':
        return 'status-orb thinking';
      case 'speaking':
        return 'status-orb speaking';
      default:
        return 'status-orb';
    }
  };

  return (
    <div className={getOrbClass()}>
      <div className="orb-inner">
        {status === 'thinking' && (
          <div className="spinner">
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>
        )}
      </div>
      {status === 'listening' && <div className="pulse-ring"></div>}
      {status === 'speaking' && <div className="glow-ring"></div>}
    </div>
  );
};

