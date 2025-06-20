import React from 'react';
import { mergeStyles, Text } from '@fluentui/react';
import {
  FaRegCheckSquare,
  FaCheckSquare,
  FaRegListAlt,
  FaListAlt,
  FaRegCommentDots,
  FaCommentDots,
  FaRegCalendarAlt,
  FaCalendarAlt,
  FaRegTimesCircle,
  FaTimesCircle,
  FaRegFileAlt,
  FaFileAlt,
  FaRegIdBadge,
  FaIdBadge,
} from 'react-icons/fa';
import {
  MdOutlineWarning,
  MdWarning,
  MdOutlineMeetingRoom,
  MdMeetingRoom,
  MdOutlineAssessment,
  MdAssessment,
} from 'react-icons/md';
import { IconType } from 'react-icons';
import { colours } from '../../app/styles/colours';
import { cardStyles } from '../instructions/componentTokens';
import '../../app/styles/QuickActionsCard.css';
import { componentTokens } from '../../app/styles/componentTokens';

const iconMap: Record<string, { outline: IconType; filled: IconType }> = {
  Accept: { outline: FaRegCheckSquare, filled: FaCheckSquare },
  Checklist: { outline: FaRegListAlt, filled: FaListAlt },
  Comment: { outline: FaRegCommentDots, filled: FaCommentDots },
  Calendar: { outline: FaRegCalendarAlt, filled: FaCalendarAlt },
  Room: { outline: MdOutlineMeetingRoom, filled: MdMeetingRoom },
  Warning: { outline: MdOutlineWarning, filled: MdWarning },
  Cancel: { outline: FaRegTimesCircle, filled: FaTimesCircle },
  OpenFile: { outline: FaRegFileAlt, filled: FaFileAlt },
  IdCheck: { outline: FaRegIdBadge, filled: FaIdBadge },
  Assessment: { outline: MdOutlineAssessment, filled: MdAssessment },
};

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
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    padding: '0 12px',
    height: '48px',
    lineHeight: '48px',
    fontSize: '16px',
    borderRadius: componentTokens.card.base.borderRadius,
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    selectors: {
      ':hover': {
        backgroundColor: colours.grey,
      },
    },
  } as any);


  const customStyle = {};
  const combinedCardStyle = mergeStyles(baseCardStyle, customStyle);

  // Icon logic
  let attendanceIconName = icon;
  let attendanceIconStyle = mergeStyles({
    fontSize: '19px',
    color: iconColor || colours.cta,
    marginRight: '4px',
  });

  if (title === 'Confirm Attendance') {
    if (confirmed) {
      attendanceIconName = 'Accept';
      attendanceIconStyle = mergeStyles(attendanceIconStyle, { color: iconColor || colours.cta });
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
      className={mergeStyles("quickActionCard icon-hover", combinedCardStyle)}
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
      <span>
        {(() => {
          const mapping = iconMap[attendanceIconName] || iconMap['Accept'];
          const OutlineIcon = mapping.outline;
          const FilledIcon = mapping.filled;
          return (
            <>
              <OutlineIcon className={`icon-outline ${attendanceIconStyle}`} />
              <FilledIcon className={`icon-filled ${attendanceIconStyle}`} />
            </>
          );
        })()}
      </span>
      <Text variant="small" styles={{ root: textStyle }}>
        {title}
      </Text>
    </div>
  );
};

export default QuickActionsCard;