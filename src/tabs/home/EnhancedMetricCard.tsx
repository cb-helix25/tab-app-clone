import React, { useState, useEffect } from 'react';
import { mergeStyles, Text, keyframes, Icon } from '@fluentui/react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import CountUp from 'react-countup';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';

interface EnhancedMetricCardProps {
  title: string;
  value: number;
  secondaryValue?: number; // For showing money alongside time
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  secondaryPrefix?: string;
  secondarySuffix?: string;
  showDial?: boolean;
  dialTarget?: number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  animationDelay?: number;
  variant?: 'default' | 'featured' | 'compact';
  accentColor?: string;
  isTimeMoney?: boolean; // Indicates if this shows both time and money
}

const slideUpFade = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translateY(24px) scale(0.95)',
  },
  '100%': {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});

const pulseGlow = keyframes({
  '0%, 100%': {
    boxShadow: '0 0 0 0 rgba(54, 144, 206, 0.4)',
  },
  '50%': {
    boxShadow: '0 0 0 8px rgba(54, 144, 206, 0)',
  },
});

const shimmer = keyframes({
  '0%': {
    backgroundPosition: '-200% 0',
  },
  '100%': {
    backgroundPosition: '200% 0',
  },
});

const cardClass = (isDark: boolean, variant: string, animationDelay: number, accentColor?: string) => mergeStyles({
  backgroundColor: isDark ? colours.dark.cardBackground : colours.light.cardBackground,
  border: `1px solid ${isDark ? colours.dark.border : colours.light.border}`,
  borderRadius: variant === 'compact' ? '6px' : '8px',
  padding: variant === 'compact' ? '12px' : variant === 'featured' ? '20px' : '16px',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  animation: `${slideUpFade} 0.4s ease ${animationDelay}s both`,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: variant === 'compact' ? '6px' : '10px',
  minHeight: variant === 'compact' ? '100px' : variant === 'featured' ? '140px' : '120px',
  boxShadow: isDark
    ? '0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.08)'
    : '0 2px 8px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.01)',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: variant === 'featured' ? '3px' : '2px',
    background: accentColor 
      ? `linear-gradient(90deg, ${accentColor}, ${colours.highlight})`
      : `linear-gradient(90deg, ${colours.blue}, ${colours.highlight})`,
    opacity: 0.8,
  },

  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: isDark
      ? '0 4px 16px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)'
      : '0 4px 16px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)',
  },
});

const headerClass = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '4px',
});

const titleClass = (isDark: boolean, variant: string) => mergeStyles({
  fontSize: variant === 'compact' ? '13px' : variant === 'featured' ? '16px' : '14px',
  fontWeight: '600',
  color: isDark ? colours.dark.text : colours.light.text,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  lineHeight: '1.2',
});

const valueContainerClass = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
});

const valueClass = (isDark: boolean, variant: string) => mergeStyles({
  fontSize: variant === 'compact' ? '18px' : variant === 'featured' ? '24px' : '20px',
  fontWeight: '700',
  color: isDark ? colours.dark.text : colours.light.text,
  lineHeight: '1.1',
});

const secondaryValueClass = (isDark: boolean) => mergeStyles({
  fontSize: '14px',
  fontWeight: '600',
  color: isDark ? colours.dark.text : colours.light.text,
  opacity: 0.8,
  marginTop: '8px',
});

const trendClass = (trend: string, variant: string) => mergeStyles({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: variant === 'compact' ? '11px' : '12px',
  fontWeight: '600',
  color: trend === 'up' ? colours.green : trend === 'down' ? colours.red : colours.grey,
  backgroundColor: trend === 'up' 
    ? 'rgba(32, 178, 108, 0.1)' 
    : trend === 'down' 
      ? 'rgba(214, 85, 65, 0.1)' 
      : 'rgba(128, 128, 128, 0.1)',
  padding: '4px 8px',
  borderRadius: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
});

const dialContainerClass = mergeStyles({
  width: '60px',
  height: '60px',
  flexShrink: 0,
  position: 'relative',
});

const dialTextClass = (isDark: boolean) => mergeStyles({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '11px',
  fontWeight: '700',
  color: isDark ? colours.dark.text : colours.light.text,
  textAlign: 'center',
  lineHeight: '1.2',
});

const iconClass = (accentColor?: string) => mergeStyles({
  fontSize: '20px',
  color: accentColor || colours.blue,
  opacity: 0.8,
});

const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  secondaryValue,
  previousValue,
  prefix = '',
  suffix = '',
  secondaryPrefix = '',
  secondarySuffix = '',
  showDial = false,
  dialTarget = 100,
  icon,
  trend,
  animationDelay = 0,
  variant = 'default',
  accentColor,
  isTimeMoney = false,
}) => {
  const { isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay * 1000);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const changePercent = previousValue && previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;

  const determinedTrend = trend || (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral');

  const dialPercent = dialTarget > 0 ? Math.min((value / dialTarget) * 100, 100) : 0;

  return (
    <div className={cardClass(isDarkMode, variant, animationDelay, accentColor)}>
      <div className={headerClass}>
        <Text className={titleClass(isDarkMode, variant)}>{title}</Text>
        {icon && <Icon iconName={icon} className={iconClass(accentColor)} />}
      </div>

      <div className={valueContainerClass}>
        <div style={{ flex: 1 }}>
          {isTimeMoney ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span className={valueClass(isDarkMode, variant)} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px' }}>
                {isVisible ? (
                  <>
                    <CountUp
                      start={0}
                      end={value}
                      duration={1.5}
                      delay={animationDelay}
                      prefix={prefix}
                      preserveValue
                      useEasing
                      decimals={2}
                      easingFn={(t, b, c, d) => c * ((t = t / d - 1) * t * t + 1) + b}
                    />
                    {suffix && <span style={{ fontSize: '0.7em', fontWeight: 600 }}>{suffix}</span>}
                  </>
                ) : (
                  `${prefix}0${suffix}`
                )}
              </span>
              {secondaryValue !== undefined && (
                <span className={secondaryValueClass(isDarkMode)}>
                  {isVisible ? (
                    <CountUp
                      start={0}
                      end={secondaryValue}
                      duration={1.5}
                      delay={animationDelay + 0.1}
                      prefix={secondaryPrefix}
                      suffix={secondarySuffix}
                      preserveValue
                      useEasing
                      decimals={0}
                      easingFn={(t, b, c, d) => c * ((t = t / d - 1) * t * t + 1) + b}
                    />
                  ) : (
                    `${secondaryPrefix}0${secondarySuffix}`
                  )}
                </span>
              )}
            </div>
          ) : (
            <span className={valueClass(isDarkMode, variant)}>
              {isVisible ? (
                <CountUp
                  start={0}
                  end={value}
                  duration={1.5}
                  delay={animationDelay}
                  prefix={prefix}
                  suffix={suffix}
                  preserveValue
                  useEasing
                  decimals={0}
                  easingFn={(t, b, c, d) => c * ((t = t / d - 1) * t * t + 1) + b}
                />
              ) : (
                `${prefix}0${suffix}`
              )}
            </span>
          )}

          {previousValue !== undefined && changePercent !== 0 && (
            <div className={trendClass(determinedTrend, variant)}>
              <Icon 
                iconName={determinedTrend === 'up' ? 'ChevronUp' : determinedTrend === 'down' ? 'ChevronDown' : 'Remove'} 
                style={{ fontSize: '10px' }} 
              />
              {Math.abs(changePercent).toFixed(1)}%
            </div>
          )}
        </div>

        {showDial && (
          <div className={dialContainerClass}>
            <CircularProgressbar
              value={isVisible ? dialPercent : 0}
              styles={buildStyles({
                pathColor: accentColor || colours.blue,
                trailColor: isDarkMode ? colours.dark.border : colours.light.border,
                pathTransitionDuration: 1.5,
                strokeLinecap: 'round',
              })}
              strokeWidth={8}
            />
            <div className={dialTextClass(isDarkMode)}>
              {isVisible ? `${Math.round(dialPercent)}%` : '0%'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMetricCard;
