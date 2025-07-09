// src/components/AnimatedPulsingDot.tsx
// invisible change 2

import React, { useState, useEffect } from 'react';
import PulsingDot from './PulsingDot';

interface AnimatedPulsingDotProps {
  show: boolean;
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Duration of enter/exit animation in ms */
  animationDuration?: number;
}

const AnimatedPulsingDot: React.FC<AnimatedPulsingDotProps> = ({ 
  show,
  color,
  size,
  className = '',
  style = {},
  animationDuration = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (show) {
      // Show the element first, then animate in
      setShouldRender(true);
      // Small delay to ensure the element is rendered before animation starts
      const showTimer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(showTimer);
    } else {
      // Start exit animation
      setIsVisible(false);
      // Remove from DOM after animation completes
      const hideTimer = setTimeout(() => setShouldRender(false), animationDuration);
      return () => clearTimeout(hideTimer);
    }
  }, [show, animationDuration]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`animated-pulsing-dot ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.3) translateY(4px)',
        transition: `all ${animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`, // Bouncy easing
        ...style
      }}
    >
      <PulsingDot 
        color={color}
        size={size}
      />
    </div>
  );
};

export default AnimatedPulsingDot;
