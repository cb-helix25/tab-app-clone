import React, { useRef, useLayoutEffect, useState } from 'react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { SegmentedOption } from './SegmentedControl';

export interface TwoLayerFilterOption {
  key: string;
  label: string;
  subOptions: SegmentedOption[];
}

interface TwoLayerFilterProps {
  primaryValue: string;
  secondaryValue: string;
  onPrimaryChange: (key: string) => void;
  onSecondaryChange: (key: string) => void;
  options: TwoLayerFilterOption[];
  ariaLabel?: string;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * Two-layer filter component with primary options on the left and secondary options on the right.
 * The secondary options change based on the selected primary option.
 */
const TwoLayerFilter: React.FC<TwoLayerFilterProps> = ({
  primaryValue,
  secondaryValue,
  onPrimaryChange,
  onSecondaryChange,
  options,
  ariaLabel,
  id,
  style
}) => {
  const { isDarkMode } = useTheme();
  const height = 32;
  const fontSize = 11;
  const paddingX = 12;

  const primaryContainerRef = useRef<HTMLDivElement | null>(null);
  const secondaryContainerRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const secondaryBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const [primaryThumbRect, setPrimaryThumbRect] = useState<{ left: number; width: number }>({ left: 2, width: 0 });
  const [secondaryThumbRect, setSecondaryThumbRect] = useState<{ left: number; width: number }>({ left: 2, width: 0 });

  const primaryActiveIndex = options.findIndex(o => o.key === primaryValue);
  const currentOption = options.find(o => o.key === primaryValue);
  const secondaryActiveIndex = currentOption ? currentOption.subOptions.findIndex(o => o.key === secondaryValue) : -1;

  const recalcPrimary = () => {
    const container = primaryContainerRef.current;
    const activeBtn = primaryBtnRefs.current[primaryActiveIndex];
    if (container && activeBtn) {
      const c = container.getBoundingClientRect();
      const b = activeBtn.getBoundingClientRect();
      setPrimaryThumbRect({ left: b.left - c.left + 2, width: b.width - 4 });
    }
  };

  const recalcSecondary = () => {
    const container = secondaryContainerRef.current;
    const activeBtn = secondaryBtnRefs.current[secondaryActiveIndex];
    if (container && activeBtn) {
      const c = container.getBoundingClientRect();
      const b = activeBtn.getBoundingClientRect();
      setSecondaryThumbRect({ left: b.left - c.left + 2, width: b.width - 4 });
    }
  };

  useLayoutEffect(() => { recalcPrimary(); }, [primaryActiveIndex, options, primaryValue]);
  useLayoutEffect(() => { recalcSecondary(); }, [secondaryActiveIndex, currentOption, secondaryValue]);
  
  useLayoutEffect(() => {
    const handleResize = () => {
      recalcPrimary();
      recalcSecondary();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    ...style,
  };

  const segmentStyle = {
    display: 'flex',
    position: 'relative' as const,
    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    borderRadius: height,
    padding: 2,
    height,
    fontFamily: 'Raleway, sans-serif',
    userSelect: 'none' as const,
    overflow: 'hidden' as const,
  };

  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      style={containerStyle}
    >
      {/* Primary Filter */}
      <div
        role="tablist"
        aria-label="Primary filter"
        style={segmentStyle}
        ref={primaryContainerRef}
      >
        {primaryActiveIndex >= 0 && (
          <span
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              top: 2,
              height: height - 4,
              left: primaryThumbRect.left,
              width: primaryThumbRect.width,
              background: colours.highlight,
              borderRadius: height,
              transition: 'left 240ms cubic-bezier(.4,.2,.2,1), width 240ms cubic-bezier(.4,.2,.2,1)',
              boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.18)',
            }}
          />
        )}
        {options.map((opt, idx) => {
          const isActive = opt.key === primaryValue;
          return (
            <button
              key={opt.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onPrimaryChange(opt.key)}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: `0 ${paddingX}px`,
                fontSize,
                fontWeight: 600,
                color: isActive ? '#fff' : (isDarkMode ? 'rgba(255,255,255,0.65)' : '#546178'),
                transition: 'color 160ms',
                minWidth: 0,
                whiteSpace: 'nowrap'
              }}
              ref={el => { primaryBtnRefs.current[idx] = el; }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Filter */}
      {currentOption && currentOption.subOptions.length > 0 && (
        <div
          role="tablist"
          aria-label="Secondary filter"
          style={segmentStyle}
          ref={secondaryContainerRef}
        >
          {secondaryActiveIndex >= 0 && (
            <span
              aria-hidden="true"
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                top: 2,
                height: height - 4,
                left: secondaryThumbRect.left,
                width: secondaryThumbRect.width,
                background: colours.highlight,
                borderRadius: height,
                transition: 'left 240ms cubic-bezier(.4,.2,.2,1), width 240ms cubic-bezier(.4,.2,.2,1)',
                boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.18)',
              }}
            />
          )}
          {currentOption.subOptions.map((subOpt, idx) => {
            const isActive = subOpt.key === secondaryValue;
            return (
              <button
                key={subOpt.key}
                role="tab"
                aria-selected={isActive}
                disabled={subOpt.disabled}
                onClick={() => !subOpt.disabled && onSecondaryChange(subOpt.key)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: subOpt.disabled ? 'not-allowed' : 'pointer',
                  padding: `0 ${paddingX}px`,
                  fontSize,
                  fontWeight: 600,
                  color: isActive ? '#fff' : (isDarkMode ? 'rgba(255,255,255,0.65)' : '#546178'),
                  transition: 'color 160ms',
                  minWidth: 0,
                  whiteSpace: 'nowrap'
                }}
                ref={el => { secondaryBtnRefs.current[idx] = el; }}
              >
                <span>{subOpt.label}</span>
                {typeof subOpt.badge !== 'undefined' && (
                  <span style={{
                    background: isActive ? (isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)') : (isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'),
                    color: isActive ? (isDarkMode ? '#fff' : '#132343') : (isDarkMode ? '#d8dfeb' : '#3d506a'),
                    borderRadius: 12,
                    padding: '2px 6px',
                    fontSize: fontSize - 2,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}>{subOpt.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TwoLayerFilter;
