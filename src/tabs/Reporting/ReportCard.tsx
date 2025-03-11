// src/tabs/Reporting/ReportCard.tsx
import React from 'react';
import { Text, IconButton, TooltipHost, IButtonStyles } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';

// Define button styles for the "Go To" arrow with explicit typing
const goToButtonStyles = (isDarkMode: boolean): IButtonStyles => ({
  root: {
    position: 'absolute' as const,
    bottom: '10px',
    right: '10px',
    color: isDarkMode ? '#fff' : colours.highlight,
    backgroundColor: 'transparent',
    border: 'none',
    height: '24px',
    width: '24px',
    padding: '0',
    selectors: {
      ':hover': {
        backgroundColor: colours.cta,
        color: '#ffffff',
      },
      ':focus': {
        backgroundColor: colours.cta,
        color: '#ffffff',
      },
    },
  },
  icon: {
    fontSize: '16px',
    lineHeight: '24px',
  },
});

interface Report {
  title: string;
  description: string;
  path: string;
  icon: string; // Fluent UI icon name
}

interface ReportCardProps {
  report: Report;
  onGoTo: (path: string) => void;
  animationDelay?: number;
}

const cardStyle = (isDarkMode: boolean) =>
  mergeStyles({
    padding: '20px',
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: '8px',
    boxShadow: isDarkMode
      ? '0 2px 8px rgba(255, 255, 255, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.3s, transform 0.3s, background-color 0.3s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '150px',
    position: 'relative',
    overflow: 'hidden',
    ':hover': {
      boxShadow: isDarkMode
        ? '0 4px 16px rgba(255, 255, 255, 0.2)'
        : '0 4px 16px rgba(0, 0, 0, 0.2)',
      transform: 'translateY(-5px)',
    },
  });

const contentStyle = (isDarkMode: boolean) =>
  mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    zIndex: 2, // Ensure content is above backdrop
  });

const titleRowStyle = (isDarkMode: boolean) =>
  mergeStyles({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
  });

const titleStyle = mergeStyles({
  fontSize: '18px',
  fontWeight: '600',
  color: 'inherit',
  margin: '0',
});

const descriptionStyle = mergeStyles({
  fontSize: '14px',
  color: '#666',
  margin: '0',
});

const ReportCard: React.FC<ReportCardProps> = React.memo(
  ({ report, onGoTo, animationDelay = 0 }) => {
    const { isDarkMode } = useTheme();

    return (
      <TooltipHost content={`Go to ${report.title}`}>
        <div
          className={`reportCard ${cardStyle(isDarkMode)}`}
          style={{ '--animation-delay': `${animationDelay}s` } as React.CSSProperties}
          onClick={() => onGoTo(report.path)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onGoTo(report.path);
            }
          }}
          aria-label={`Go to ${report.title}`}
        >
          {/* Backdrop Icon */}
          <i
            className={`ms-Icon ms-Icon--${report.icon} backdropIcon`}
            style={{
              fontSize: '100px',
              color: isDarkMode ? '#fff' : colours.highlight,
              opacity: 0.1,
            }}
          />

          <div className={contentStyle(isDarkMode)}>
            <div className={titleRowStyle(isDarkMode)}>
              <i
                className={`ms-Icon ms-Icon--${report.icon}`}
                style={{ fontSize: '32px', color: colours.highlight }}
              />
              <Text className={titleStyle}>{report.title}</Text>
            </div>
            <Text className={descriptionStyle}>{report.description}</Text>
          </div>

          <TooltipHost content={`Go to ${report.title}`}>
            <IconButton
              iconProps={{ iconName: 'ChevronRight' }}
              title="Go To"
              ariaLabel="Go To"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onGoTo(report.path);
              }}
              styles={goToButtonStyles(isDarkMode)}
            />
          </TooltipHost>

          <style>{`
            .reportCard {
              animation: fadeIn 0.5s ease-in-out;
              animation-delay: var(--animation-delay, 0s);
              animation-fill-mode: both;
            }

            .backdropIcon {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 100px;
              height: 100px;
              opacity: 0.1;
              z-index: 1;
              pointer-events: none;
              transition: opacity 0.3s ease;
            }

            .reportCard:hover .backdropIcon {
              opacity: 0.2;
            }
          `}</style>
        </div>
      </TooltipHost>
    );
  }
);

export default ReportCard;