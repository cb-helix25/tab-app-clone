import React from 'react';
import {
  FaFolder,
  FaFolderOpen,
  FaIdBadge,
  FaUserCheck,
  FaMobileAlt,
  FaCalendarAlt,
  FaShieldAlt,
  FaPaperPlane,
  FaCheck,
  FaUmbrellaBeach,
  FaEdit,
  FaCalendarCheck,
} from 'react-icons/fa';
import {
  MdAssessment,
  MdArticle,
  MdEventSeat,
  MdSlideshow,
  MdFactCheck,
} from 'react-icons/md';
import { colours } from '../../app/styles/colours';

/**
 * A compact, theme-aware chip for Immediate Actions.
 * Distinct from QuickActionsCard (used by Quick Actions) to allow independent styling and behavior.
 */
export interface ImmediateActionChipProps {
  title: string;
  icon: string;
  isDarkMode: boolean;
  onClick: () => void;
  disabled?: boolean;
  subtitle?: string;
  count?: number;
}

// Minimal icon mapping for immediate actions domain
const chipIconMap: Record<string, React.ComponentType<any>> = {
  // Generic
  OpenFile: FaFolderOpen,
  Folder: FaFolder,
  Phone: FaMobileAlt,

  // Attendance / Time
  Calendar: FaCalendarAlt,
  CalendarCheck: FaCalendarCheck,
  Accept: FaCheck,

  // Instructions
  ContactCard: FaIdBadge,
  Verify: FaUserCheck,
  IdCheck: FaIdBadge,
  Shield: FaShieldAlt,
  Send: FaPaperPlane,
  ReviewRequestMirrored: MdFactCheck,

  // Enquiries / Pitches
  Presentation: MdSlideshow,

  // Annual Leave / Approvals
  PalmTree: FaUmbrellaBeach,
  Edit: FaEdit,

  // Knowledge & Rooms
  KnowledgeArticle: MdArticle,
  Room: MdEventSeat,

};

const getChipIcon = (name: string): React.ComponentType<any> => {
  return chipIconMap[name] || FaFolder;
};

export const ImmediateActionChip: React.FC<ImmediateActionChipProps> = ({
  title,
  icon,
  isDarkMode,
  onClick,
  disabled = false,
  subtitle,
  count,
}) => {
  const Icon = getChipIcon(icon);

  const baseBg = isDarkMode ? colours.dark.cardBackground : colours.light.sectionBackground;
  const hoverBg = isDarkMode ? 'rgba(54,144,206,0.12)' : '#eef5ff';
  const textColor = isDarkMode ? colours.dark.text : colours.light.text;
  const borderCol = isDarkMode ? colours.dark.border : '#e5e7eb';

  return (
    <button
      type="button"
      aria-label={subtitle ? `${title}: ${subtitle}` : title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="immediate-action-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  height: 32,
  minWidth: 32,
  borderRadius: 8,
        background: baseBg,
        color: textColor,
        border: `1px solid ${borderCol}`,
        boxShadow: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 120ms ease, background-color 140ms ease, border-color 140ms ease',
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
        (e.currentTarget as HTMLButtonElement).style.borderColor = colours.highlight;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.background = baseBg;
        (e.currentTarget as HTMLButtonElement).style.borderColor = borderCol;
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: '#D65541',
          borderRadius: '50%',
          animation: 'pulse-red 2s infinite',
          flexShrink: 0
        }}
      />
      <Icon style={{ fontSize: 15, opacity: 0.9 }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
      {subtitle && (
        <span style={{ fontSize: 11, opacity: 0.8 }}> {subtitle}</span>
      )}
      {typeof count === 'number' && (
        <span
          aria-label={`count ${count}`}
          style={{
            marginLeft: 6,
            minWidth: 16,
            height: 16,
            padding: '0 5px',
            borderRadius: 8,
            background: isDarkMode ? 'rgba(14,165,233,0.25)' : '#e8f1ff',
            color: isDarkMode ? '#dff6ff' : '#0b3d62',
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default ImmediateActionChip;
