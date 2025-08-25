import React from 'react';
// invisible change 2
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
  FaRegCalendarCheck,
  FaCalendarCheck,
  FaRegTimesCircle,
  FaTimesCircle,
  FaRegFolder,
  FaFolder,
  FaRegIdBadge,
  FaIdBadge,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaRegEdit,
  FaEdit,
  FaRegMoneyBillAlt,
  FaMoneyBillAlt,
  FaCogs,
  FaShieldAlt,
  FaRegHandshake,
  FaHandshake,
  FaRegCheckCircle,
  FaCheckCircle,
  FaRegFileAlt,
  FaFileAlt,
  FaRegFile,
  FaFile,
  FaRegPlusSquare,
  FaPlusSquare,
  FaRegStickyNote,
  FaStickyNote,
  FaTimes,
  FaCheck,
  FaPlus,
  FaDownload,
  FaPhone,
  FaRegClock,
  FaClock,
  FaUserCheck,
  FaTasks,
  FaClipboardList,
  FaRegBuilding,
  FaBuilding,
} from 'react-icons/fa';
import {
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlinePlus,
  AiOutlineDownload,
} from 'react-icons/ai';
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
  MdPhone,
  MdCall,
  MdEventSeat,
  MdOutlineEventSeat,
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
  CheckCircle: { outline: FaRegCheckCircle, filled: FaCheckCircle },
  // Better task/checklist icon - more recognizable
  Checklist: { outline: FaTasks, filled: FaClipboardList },
  // Better phone/comment icon for telephone notes
  Comment: { outline: MdPhone, filled: MdCall },
  // Attendance/time icons - clock is more intuitive than calendar for daily attendance
  Calendar: { outline: FaRegClock, filled: FaClock },
  CalendarCheck: { outline: FaUserCheck, filled: FaUserCheck },
  // Room/space booking - seat icon is clearer for space booking
  Room: { outline: MdOutlineEventSeat, filled: MdEventSeat },
  // Warning/alert icons
  Warning: { outline: MdOutlineWarning, filled: MdWarning },
  Cancel: { outline: FaRegTimesCircle, filled: FaTimesCircle },
  Document: { outline: FaRegFile, filled: FaFile },
  FileTemplate: { outline: FaRegFileAlt, filled: FaFileAlt },
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
  // New icons for instructions page
  List: { outline: FaRegListAlt, filled: FaListAlt },
  Money: { outline: FaRegHandshake, filled: FaHandshake },
  Shield: { outline: FaShieldAlt, filled: FaShieldAlt },
  Settings: { outline: FaCogs, filled: FaCogs },
  Edit: { outline: FaRegEdit, filled: FaEdit },
  EditCreate: { outline: FaRegStickyNote, filled: FaStickyNote },
  // Lightweight action icons - using thinner Ant Design icons
  LightCheck: { outline: AiOutlineCheck, filled: AiOutlineCheck },
  LightCancel: { outline: AiOutlineClose, filled: AiOutlineClose },
  LightAdd: { outline: AiOutlinePlus, filled: AiOutlinePlus },
  LightDownload: { outline: AiOutlineDownload, filled: AiOutlineDownload },
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
  /** Whether the card should be disabled */
  disabled?: boolean;
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
  disabled = false,
}) => {
  // Base card style
  const baseCardStyle = mergeStyles({
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    color: disabled ? '#888' : (isDarkMode ? colours.dark.text : colours.light.text),
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
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, transform 0.1s, border-color 0.2s',
    border: '2px solid transparent',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
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
  // Use a lighter grey for inactive quick action icons (lighter than instructions)
  const inactiveGrey = '#c7ccd3'; // lighter than #bfc5cc
  let attendanceIconStyle = mergeStyles({
    fontSize: '19px',
    color: disabled ? '#e0e3e8' : (selected ? (iconColor || colours.cta) : inactiveGrey),
    marginRight: '4px',
  });

  if (title === 'Confirm Attendance') {
    if (confirmed) {
      attendanceIconName = 'CalendarCheck';
      attendanceIconStyle = mergeStyles(attendanceIconStyle, { color: iconColor || colours.cta });
    } else {
      attendanceIconName = 'Calendar';
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

  // Dismiss button rework: if title is 'Dismiss', render special dismiss button
  if (title === 'Dismiss') {
    return (
      <div
        className="nav-button dismiss-button"
        onClick={onClick}
        style={{
          background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          border: isDarkMode ? '1px solid #444' : '1px solid #e1dfdd',
          borderRadius: '0px',
          width: '48px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isDarkMode ? '0 1px 2px rgba(6,23,51,0.10)' : '0 1px 2px rgba(6,23,51,0.04)',
          position: 'relative',
          overflow: 'hidden',
          marginLeft: 8,
        }}
        tabIndex={0}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = '#ffefed';
          (e.currentTarget as HTMLDivElement).style.border = '1px solid #D65541';
          (e.currentTarget as HTMLDivElement).style.width = '120px';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground;
          (e.currentTarget as HTMLDivElement).style.border = isDarkMode ? '1px solid #444' : '1px solid #e1dfdd';
          (e.currentTarget as HTMLDivElement).style.width = '48px';
          (e.currentTarget as HTMLDivElement).style.boxShadow = isDarkMode ? '0 1px 2px rgba(6,23,51,0.10)' : '0 1px 2px rgba(6,23,51,0.04)';
        }}
      >
        {/* Dismiss Icon (X) */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transition: 'color 0.3s, opacity 0.3s',
            color: '#D65541',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          className="dismiss-icon"
        >
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Expandable Text */}
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            fontWeight: 600,
            color: '#D65541',
            opacity: 0,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
          }}
          className="nav-text"
        >
          Dismiss
        </span>
        <style>{`
          .nav-button.dismiss-button:hover .nav-text {
            opacity: 1 !important;
          }
          .nav-button.dismiss-button:hover .dismiss-icon {
            opacity: 0 !important;
          }
        `}</style>
      </div>
    );
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
      style={{ ...cardVars, ...style, position: 'relative', overflow: 'visible' }}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyPress={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      <span className="quick-action-content">
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <Text variant="small" styles={{ root: textStyle }} className="quick-action-label">
              {title}
            </Text>
            <AnimatedPulsingDot show={showPulsingDot} size={6} animationDuration={350} />
          </span>
        ) : (
          <>
            <Text 
              variant="small" 
              styles={{ 
                root: {
                  fontWeight: 600,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  opacity: 0, // Hidden by default
                  marginLeft: '6px',
                  transition: 'opacity 0.3s ease',
                }
              }} 
              className="quick-action-label"
            >
              {title}
            </Text>
            {showPulsingDot && orientation === 'column' && (
              <AnimatedPulsingDot show={showPulsingDot} size={6} animationDuration={350} />
            )}
          </>
        )}
      </span>
      {/* Animated blue bottom border highlight */}
      <span className="quick-action-animated-border" aria-hidden="true" />
    </div>
  );
};

export default QuickActionsCard;