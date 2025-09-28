import React from 'react';
import {
  FaFolder,
  FaFolderOpen,
  FaIdBadge,
  FaUserCheck,
  FaMobileAlt,
  FaShieldAlt,
  FaPaperPlane,
  FaCheck,
  FaUmbrellaBeach,
  FaEdit,
} from 'react-icons/fa';
import {
  MdAssessment,
  MdArticle,
  MdEventSeat,
  MdSlideshow,
  MdFactCheck,
} from 'react-icons/md';
import { Icon } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import AnimatedPulsingDot from '../../components/AnimatedPulsingDot';

/**
 * Visual severity category for immediate actions.
 */
export type ImmediateActionCategory = 'critical' | 'standard' | 'success';

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
  category?: ImmediateActionCategory;
}

// Minimal icon mapping for immediate actions domain
type IconComponent = React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

const CalendarDayIcon: IconComponent = (props) => {
  const safeProps = props ?? {};
  const { style, className } = safeProps;
  return <Icon iconName="CalendarDay" style={style} className={className} />;
};

const chipIconMap: Record<string, IconComponent> = {
  // Generic
  OpenFile: FaFolderOpen,
  Folder: FaFolder,
  Phone: FaMobileAlt,

  // Attendance / Time
  Calendar: CalendarDayIcon,
  CalendarCheck: CalendarDayIcon,
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
  category = 'critical',
}) => {
  const [showLabel, setShowLabel] = React.useState(true);
  const chipRef = React.useRef<HTMLButtonElement>(null);
  const Icon = getChipIcon(icon);

  const baseBg = isDarkMode ? colours.dark.cardBackground : colours.light.sectionBackground;
  const hoverBg = isDarkMode ? 'rgba(54,144,206,0.12)' : '#eef5ff';
  const textColor = isDarkMode ? colours.dark.text : colours.light.text;
  const borderCol = isDarkMode ? colours.dark.border : '#e5e7eb';

  // Check available space and hide labels if container is too narrow
  React.useEffect(() => {
    const checkSpace = () => {
      if (!chipRef.current?.parentElement) return;
      
      const containerWidth = chipRef.current.parentElement.offsetWidth;
      const chipCount = chipRef.current.parentElement.children.length;
      
      // Estimate: icon + dot + padding = ~50px, full chip with text = ~120px
      const availablePerChip = containerWidth / chipCount;
      const shouldShowLabel = availablePerChip > 120; // Higher threshold to avoid truncated labels
      
      setShowLabel(shouldShowLabel);
    };

    checkSpace();
    window.addEventListener('resize', checkSpace);
    
    // Also check when parent container changes
    const observer = new ResizeObserver(checkSpace);
    if (chipRef.current?.parentElement) {
      observer.observe(chipRef.current.parentElement);
    }
    
    return () => {
      window.removeEventListener('resize', checkSpace);
      observer.disconnect();
    };
  }, []);

  const accentColours: Record<ImmediateActionCategory, string> = {
    critical: colours.red,
    standard: colours.highlight,
    success: colours.green,
  };
  const accentColour = accentColours[category] ?? colours.red;

  return (
    <button
      ref={chipRef}
      type="button"
      aria-label={subtitle ? `${title}: ${subtitle}` : title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="immediate-action-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabel ? 6 : 4,
        padding: showLabel ? '6px 10px' : '6px 8px',
        height: 32,
        minWidth: 32,
        borderRadius: 8,
        background: baseBg,
        color: textColor,
        border: `1px solid ${borderCol}`,
        boxShadow: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 120ms ease, background-color 140ms ease, border-color 140ms ease, gap 200ms ease, padding 200ms ease',
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const button = e.currentTarget as HTMLButtonElement;
        button.style.transform = 'translateY(-1px)';
        button.style.background = hoverBg;
        button.style.borderColor = colours.highlight;
        button.style.color = '#3690CE'; // Blue highlight on hover for text and icons
      }}
      onMouseLeave={(e) => {
        const button = e.currentTarget as HTMLButtonElement;
        button.style.transform = 'translateY(0)';
        button.style.background = baseBg;
        button.style.borderColor = borderCol;
        button.style.color = textColor; // Reset to original text color
      }}
    >
      <AnimatedPulsingDot
        show
        color={accentColour}
        size={6}
        animationDuration={360}
        style={{ flexShrink: 0 }}
      />
      <Icon style={{ fontSize: 15, opacity: 0.9 }} />
      {showLabel && (
        <>
          <span style={{ 
            fontSize: 13, 
            fontWeight: 500, 
            opacity: showLabel ? 1 : 0,
            width: showLabel ? 'auto' : 0,
            overflow: 'hidden',
            transition: 'opacity 200ms ease, width 200ms ease',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ 
              fontSize: 11, 
              opacity: showLabel ? 0.8 : 0,
              transition: 'opacity 200ms ease'
            }}>
              {' '}{subtitle}
            </span>
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
                opacity: showLabel ? 1 : 0,
                transition: 'opacity 200ms ease',
              }}
            >
              {count}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default ImmediateActionChip;
