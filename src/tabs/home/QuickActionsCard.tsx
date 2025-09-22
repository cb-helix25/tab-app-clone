import React from 'react';
import {
  FaRegCheckSquare,
  FaCheckSquare,
  FaRegCalendarAlt,
  FaCalendarAlt,
  FaRegClock,
  FaClock,
  FaRegBuilding,
  FaBuilding,
  FaPhone,
  FaRegUser,
  FaUser,
  FaRegFolder,
  FaFolder,
  FaRegIdBadge,
  FaIdBadge,
  FaUserCheck,
  FaMobileAlt,
  FaRegCalendarCheck,
  FaCalendarCheck,
} from 'react-icons/fa';
import {
  AiOutlinePlus,
  AiFillPlusSquare,
} from 'react-icons/ai';
import {
  MdOutlineEventSeat,
  MdEventSeat,
  MdPhone,
  MdCall,
  MdOutlineAssessment,
  MdAssessment,
  MdOutlineArticle,
  MdArticle,
  MdOutlineLocationCity,
  MdLocationCity,
  MdOutlineConstruction,
  MdConstruction,
  MdSmartphone,
  MdOutlineSlideshow,
  MdSlideshow,
} from 'react-icons/md';
import { PiTreePalm, PiTreePalmFill } from 'react-icons/pi';
import { colours } from '../../app/styles/colours';
import '../../app/styles/QuickActionsCard.css';
import AnimatedPulsingDot from '../../components/AnimatedPulsingDot';

interface QuickActionsCardProps {
  title: string;
  icon: string;
  isDarkMode: boolean;
  onClick: () => void;
  iconColor?: string;
  selected?: boolean;
  confirmed?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  orientation?: 'row' | 'column';
  alwaysShowText?: boolean;
  showPulsingDot?: boolean;
  panelActive?: boolean;
}

// Icon mapping with outline/filled pairs
const iconMap: Record<string, { outline: React.ComponentType<any>; filled: React.ComponentType<any> }> = {
  Accept: { outline: FaRegCheckSquare, filled: FaCheckSquare },
  Checklist: { outline: FaRegCheckSquare, filled: FaCheckSquare },
  Comment: { outline: MdSmartphone, filled: FaMobileAlt },
  Calendar: { outline: FaRegCalendarCheck, filled: FaCalendarCheck },
  CalendarCheck: { outline: FaRegUser, filled: FaUser },
  Room: { outline: MdOutlineEventSeat, filled: MdEventSeat },
  Building: { outline: FaRegBuilding, filled: FaBuilding },
  Plus: { outline: AiOutlinePlus, filled: AiFillPlusSquare },
  Phone: { outline: MdSmartphone, filled: FaMobileAlt },
  Leave: { outline: PiTreePalm, filled: PiTreePalmFill },
  PalmTree: { outline: PiTreePalm, filled: PiTreePalmFill },
  OpenFile: { outline: FaRegFolder, filled: FaFolder },
  IdCheck: { outline: FaRegIdBadge, filled: FaIdBadge },
  Assessment: { outline: MdOutlineAssessment, filled: MdAssessment },
  KnowledgeArticle: { outline: MdOutlineArticle, filled: MdArticle },
  CityNext: { outline: MdOutlineLocationCity, filled: MdLocationCity },
  ConstructionCone: { outline: MdOutlineConstruction, filled: MdConstruction },
  Presentation: { outline: MdOutlineSlideshow, filled: MdSlideshow },
};

// Export function to get filled icon for panel headers
export const getQuickActionIcon = (iconName: string): React.ComponentType<any> | null => {
  const mapping = iconMap[iconName];
  if (!mapping) {
    console.log(`❌ No mapping found for icon: ${iconName}`);
    return null;
  }
  
  const IconComponent = mapping.filled;
  
  console.log(`🔍 Processing icon "${iconName}":`, {
    type: typeof IconComponent,
    isFunction: typeof IconComponent === 'function',
    hasDefault: IconComponent && typeof IconComponent === 'object' && (IconComponent as any).default,
    iconComponent: IconComponent
  });
  
  // React Icons are functions, but might be wrapped differently in different environments
  if (typeof IconComponent === 'function') {
    return IconComponent;
  }
  
  // Try to get the default export if it's an object
  if (IconComponent && typeof IconComponent === 'object' && (IconComponent as any).default) {
    const defaultIcon = (IconComponent as any).default;
    console.log(`🔧 Using default export for "${iconName}":`, typeof defaultIcon);
    return defaultIcon;
  }
  
  // If still not a function, return null
  console.log(`❌ Could not resolve icon component for "${iconName}"`);
  return null;
};

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  title,
  icon,
  isDarkMode,
  onClick,
  selected = false,
  disabled = false,
  style = {},
  orientation = 'row',
  alwaysShowText = false,
  showPulsingDot = false,
  panelActive = false,
}) => {

  // Get icon components
  const getIcons = (iconName: string) => {
    const mapping = iconMap[iconName];
    if (mapping) {
      return {
        OutlineIcon: mapping.outline,
        FilledIcon: mapping.filled,
      };
    }
    // Fallback
    return {
      OutlineIcon: FaRegCheckSquare,
      FilledIcon: FaCheckSquare,
    };
  };

  const { OutlineIcon, FilledIcon } = getIcons(icon);

  // Dynamic classes
  const cardClasses = [
    'quickActionCard',
    selected && 'selected',
    orientation === 'column' && 'vertical',
    alwaysShowText && 'always-show-text',
    disabled && 'disabled',
    panelActive && 'panel-active'
  ].filter(Boolean).join(' ');

  const iconStyle = {
    fontSize: 20,
    color: isDarkMode ? colours.dark.text : colours.light.text,
  };

  return (
    <div
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      style={style}
      onKeyPress={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      {/* Icon container */}
      <div className="quick-action-icon">
        <OutlineIcon className="icon-outline" style={iconStyle} />
        <FilledIcon className="icon-filled" style={iconStyle} />
      </div>

      {/* Label */}
      <span className="quick-action-label">
        {title}
        {showPulsingDot && (
          <AnimatedPulsingDot 
            show={showPulsingDot} 
            size={6} 
            animationDuration={350} 
            style={{ marginLeft: 6 }}
          />
        )}
      </span>
    </div>
  );
};

export default QuickActionsCard;