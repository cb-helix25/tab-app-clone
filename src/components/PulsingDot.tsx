// src/components/PulsingDot.tsx
// invisible change 2

import React from 'react';
import { colours } from '../app/styles/colours';

interface PulsingDotProps {
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const PulsingDot: React.FC<PulsingDotProps> = ({ 
  color = colours.highlight, 
  size = 8, 
  className = '',
  style = {}
}) => {
  const scopedClass = React.useMemo(
    () => `pulsing-dot-${Math.random().toString(36).slice(2, 10)}`,
    []
  );
  return (
    <div
      className={`pulsing-dot ${scopedClass} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        position: 'relative',
        ...style
      }}
    >
      <style>{`
        .${scopedClass}::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          animation: pulse 2s infinite;
          opacity: 0.7;
        }
        
        .${scopedClass}::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          animation: pulse 2s infinite 0.5s;
          opacity: 0.5;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.8);
            opacity: 0.3;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PulsingDot;
