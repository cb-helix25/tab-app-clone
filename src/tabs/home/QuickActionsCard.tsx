import React from 'react';
import { mergeStyles, Icon, Text } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { cardStyles } from '../instructions/componentTokens';
import '../../app/styles/QuickActionsCard.css';
import { componentTokens } from '../../app/styles/componentTokens';


interface QuickActionsCardProps {
  title: string;
  icon: string;
  isDarkMode: boolean;
  onClick: () => void;
  iconColor?: string;
  confirmed?: boolean;
  style?: React.CSSProperties;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  title,
  icon,
  isDarkMode,
  onClick,
  iconColor,
  confirmed,
  style,
}) => {
  // Base card style
  const baseCardStyle = mergeStyles(
    cardStyles.root,
    {
      backgroundColor: isDarkMode
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      color: isDarkMode ? colours.dark.text : colours.light.text,
      // Match the tab menu size so the actions don't look more important
      padding: '0 12px',
      height: '48px',
      lineHeight: '48px',
      fontSize: '16px',
      borderRadius: componentTokens.card.base.borderRadius,
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      cursor: 'pointer',
      transition: 'background-color 0.3s, box-shadow 0.3s, transform 0.3s',
      selectors: {
        ':hover': {
          backgroundColor: colours.grey,
          boxShadow: isDarkMode
            ? `0 2px 4px ${colours.dark.border}`
            : componentTokens.card.hover.boxShadow,
          transform: componentTokens.card.hover.transform,
        },
      },
    } as any
  );


  const customStyle = {};
  const combinedCardStyle = mergeStyles(baseCardStyle, customStyle);

  // Icon logic
  let attendanceIconName = icon;
  let attendanceIconStyle = mergeStyles({
    fontSize: '19px',
    color: iconColor || colours.highlight,
    marginRight: '4px',
  });

  if (title === 'Confirm Attendance') {
    if (confirmed) {
      attendanceIconName = 'Accept';
      attendanceIconStyle = mergeStyles(attendanceIconStyle, { color: iconColor || colours.highlight });
    } else {
      attendanceIconName = 'Cancel';
      attendanceIconStyle = mergeStyles(attendanceIconStyle, {
        color: colours.red,
        animation: 'redPulse 2s infinite',
        boxShadow: 'inset 0 0 5px rgba(255,0,0,0.5)',
      });
    }
  } else if (title === 'Approve Annual Leave') {
    attendanceIconName = 'Warning';
    attendanceIconStyle = mergeStyles(attendanceIconStyle, {
      color: colours.yellow,
      animation: 'yellowPulse 2s infinite',
      boxShadow: 'inset 0 0 5px rgba(255,213,79,0.5)',
    });
  } else if (title === 'Book Requested Leave') {
    attendanceIconName = 'Accept';
    attendanceIconStyle = mergeStyles(attendanceIconStyle, {
      color: colours.green,
      animation: 'greenPulse 2s infinite',
      boxShadow: 'inset 0 0 5px rgba(16,124,16,0.5)',
    });
  }

  // Text style
  const textStyle = mergeStyles({
    fontWeight: 600,
    fontSize: '14px',
    whiteSpace: 'nowrap',
  });

  const pulsingDotStyle = mergeStyles({
    width: '8px',
    height: '8px',
    backgroundColor: colours.green,
    borderRadius: '50%', // Makes it circular
    marginLeft: '6px',
    animation: 'subtlePulse 1.5s infinite ease-in-out', // Subtle animation
  });

  return (
    <div
      className={mergeStyles("quickActionCard", combinedCardStyle)}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <Icon iconName={attendanceIconName} className={attendanceIconStyle} />
      <Text variant="small" styles={{ root: textStyle }}>
        {title}
      </Text>
    </div>
  );
};

export default QuickActionsCard;