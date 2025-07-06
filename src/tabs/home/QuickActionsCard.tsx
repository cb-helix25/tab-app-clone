import React from 'react';
import { mergeStyles, Text, Icon } from '@fluentui/react';
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
  FaRegFolder,
  FaFolder,
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
  MdOutlineArticle,
  MdArticle,
  MdOutlineLocationCity,
  MdLocationCity,
  MdOutlineConstruction,
  MdConstruction,
  MdOutlinePeople,
  MdPeople,
  MdHelp,
  MdOutlineHelp,
} from 'react-icons/md';
import { PiTreePalm } from 'react-icons/pi';
import { IconType } from 'react-icons';
import { colours } from '../../app/styles/colours';
import { cardStyles } from '../instructions/componentTokens';
import '../../app/styles/QuickActionsCard.css';
import { componentTokens } from '../../app/styles/componentTokens';
import AnimatedPulsingDot from '../../components/AnimatedPulsingDot';

const iconMap: Record<string, { outline: IconType; filled: IconType }> = {
  Accept: { outline: FaRegCheckSquare, filled: FaCheckSquare },
  Checklist: { outline: FaRegListAlt, filled: FaListAlt },
  Comment: { outline: FaRegCommentDots, filled: FaCommentDots },
  Calendar: { outline: FaRegCalendarAlt, filled: FaCalendarAlt },
  Room: { outline: MdOutlineMeetingRoom, filled: MdMeetingRoom },
  Warning: { outline: MdOutlineWarning, filled: MdWarning },
  Cancel: { outline: FaRegTimesCircle, filled: FaTimesCircle },
  // Use a real folder icon for Finalise Matter (was FaRegFileAlt/FaFileAlt, which is a file/contract icon)
  OpenFile: { outline: FaRegFolder, filled: FaFolder },
  IdCheck: { outline: FaRegIdBadge, filled: FaIdBadge },
  Assessment: { outline: MdOutlineAssessment, filled: MdAssessment },
  KnowledgeArticle: { outline: MdOutlineArticle, filled: MdArticle },
  CityNext: { outline: MdOutlineLocationCity, filled: MdLocationCity },
  ConstructionCone: { outline: MdOutlineConstruction, filled: MdConstruction },
  People: { outline: MdOutlinePeople, filled: MdPeople },
  Help: { outline: MdOutlineHelp, filled: MdHelp },
  PalmTree: { outline: PiTreePalm, filled: PiTreePalm },
};

interface QuickActionsCardProps {
  title: string;
  icon: string;
  isDarkMode: boolean;
  onClick: () => void;
  iconColor?: string;
  confirmed?: boolean;
  style?: React.CSSProperties;
  selected?: boolean;
  /** Layout direction. Use 'column' for client type buttons */
  orientation?: 'row' | 'column';
  /** Show a pulsing dot indicator */
  showPulsingDot?: boolean;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  title,
  icon,
  isDarkMode,
  onClick,
  iconColor,
  confirmed,
  style,
  selected,
  orientation = 'row',
  showPulsingDot = false,
}) => {
  // Base card style
  const baseCardStyle = mergeStyles({
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    padding: orientation === 'column' ? '8px 12px' : '0 12px',
    height: orientation === 'column' ? 'auto' : '48px',
    lineHeight: orientation === 'column' ? 'normal' : '48px',
    fontSize: '16px',
    borderRadius: 0,
    display: 'flex',
    flexDirection: orientation,
    alignItems: 'center',
    justifyContent: 'center',
    gap: orientation === 'column' ? '4px' : '7px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s, border-color 0.2s',
    border: '2px solid transparent',
  } as any);


  const customStyle = {};
  const combinedCardStyle = mergeStyles(baseCardStyle, customStyle);

  const cardVars: React.CSSProperties = {
    '--card-bg': isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    '--card-hover': isDarkMode
      ? colours.dark.cardHover
      : colours.light.cardHover,
    '--card-selected': isDarkMode
      ? colours.dark.cardHover
      : colours.light.cardHover,
  } as React.CSSProperties;

  // Icon logic
  let attendanceIconName = icon;
  let attendanceIconStyle = mergeStyles({
    fontSize: '19px',
    color: iconColor || colours.cta,
    marginRight: '4px',
  });

  // Special case: if iconColor is 'immediate-disclaimer', use disclaimer yellow and brown
  if (iconColor === 'immediate-disclaimer') {
    // Always override for these icons
    attendanceIconStyle = mergeStyles(attendanceIconStyle, {
      color: '#b88600', // disclaimer text color
      backgroundColor: '#FFB900', // disclaimer background color
      borderRadius: '50%',
      width: 24,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    // For Finalise Matter and Approve Annual Leave, force correct icon name
    if (title === 'Approve Annual Leave') {
      attendanceIconName = 'PalmTree';
    } else if (title === 'Finalise Matter') {
      attendanceIconName = 'OpenFile';
    }
  } else if (title === 'Confirm Attendance') {
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
    attendanceIconName = 'PalmTree';
    attendanceIconStyle = mergeStyles(attendanceIconStyle, {
      color: colours.cta,
    });
  } else if (title === 'Finalise Matter') {
    // Always use the original folder icon (OpenFile) for Finalise Matter, no green pulse
    attendanceIconName = 'OpenFile';
    attendanceIconStyle = mergeStyles(attendanceIconStyle, {
      color: colours.cta,
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
    textAlign: 'center',
  });

  const dynamicClasses = mergeStyles(
    combinedCardStyle,
    selected && 'selected',
    orientation === 'column' && 'vertical'
  );

  return (
    <div
      className={`quickActionCard icon-hover ${dynamicClasses}`}
      style={{ ...cardVars, ...style }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <span className="icon-wrapper">
        {(() => {
          if (!attendanceIconName) {
            return null;
          }
          const mapping = iconMap[attendanceIconName];
          if (mapping) {
            const OutlineIcon = mapping.outline;
            const FilledIcon = mapping.filled;
            return (
              <>
                <OutlineIcon className={`icon-outline ${attendanceIconStyle}`} />
                <FilledIcon className={`icon-filled ${attendanceIconStyle}`} />
              </>
            );
          }
          // fallback to Fluent UI icons when no mapping exists
          return <Icon iconName={attendanceIconName} className={attendanceIconStyle} />;
        })()}
      </span>
      {showPulsingDot && orientation === 'row' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Text variant="small" styles={{ root: textStyle }}>
            {title}
          </Text>
          <AnimatedPulsingDot show={showPulsingDot} size={6} animationDuration={350} />
        </div>
      ) : (
        <>
          <Text variant="small" styles={{ root: textStyle }}>
            {title}
          </Text>
          {showPulsingDot && orientation === 'column' && (
            <AnimatedPulsingDot show={showPulsingDot} size={6} animationDuration={350} />
          )}
        </>
      )}
    </div>
  );
};

export default QuickActionsCard;