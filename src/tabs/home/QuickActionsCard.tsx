import React from 'react';
import { mergeStyles, Icon, Text } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import '../../app/styles/QuickActionsCard.css';

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
  const baseCardStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    padding: '7px 12px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    boxShadow: isDarkMode
      ? `0 2px 4px ${colours.dark.border}`
      : `0 2px 4px ${colours.light.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    selectors: {
      ':hover': {
        backgroundColor: colours.grey,
        boxShadow: isDarkMode
          ? `0 2px 4px ${colours.dark.border}`
          : `0 2px 4px ${colours.light.border}`,
      },
    },
  });

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

  // NEW: Style for the "NEW" badge
  const newBadgeStyle = mergeStyles({
    backgroundColor: colours.green,
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '6px',
    lineHeight: '1', // Keeps it compact
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
      {/* NEW: Add "NEW" badge for "Book Space" */}
      {title === 'Book Space' && (
        <Text className={newBadgeStyle}>NEW</Text>
      )}
    </div>
  );
};

export default QuickActionsCard;