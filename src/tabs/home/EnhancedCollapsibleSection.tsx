import React, { useState } from 'react';
import { mergeStyles, Text, Icon, keyframes } from '@fluentui/react';
import { colours } from '../../app/styles/colours';

interface EnhancedCollapsibleSectionProps {
  title: string;
  subtitle?: string;
  metrics: { title: string; icon?: string }[];
  children: React.ReactNode;
  isDarkMode: boolean;
  defaultExpanded?: boolean;
  variant?: 'default' | 'premium';
}

const expandCollapse = keyframes({
  '0%': {
    opacity: 0,
    transform: 'scaleY(0)',
  },
  '100%': {
    opacity: 1,
    transform: 'scaleY(1)',
  },
});

const buttonHover = keyframes({
  '0%': {
    backgroundPosition: '0% 50%',
  },
  '100%': {
    backgroundPosition: '100% 50%',
  },
});

const wrapperClass = (isDark: boolean, collapsed: boolean) => mergeStyles({
  backgroundColor: isDark ? colours.dark.cardBackground : colours.light.cardBackground,
  color: isDark ? colours.dark.text : colours.light.text,
  border: `1px solid ${isDark ? colours.dark.border : colours.light.border}`,
  borderRadius: '8px',
  width: '100%',
  transition: 'all 0.25s ease',
  boxShadow: isDark
    ? '0 2px 6px rgba(0,0,0,0.15)'
    : '0 2px 6px rgba(0,0,0,0.04)',
  overflow: 'hidden',
});

const headerButtonClass = (isDark: boolean) => mergeStyles({
  background: 'transparent',
  border: 'none',
  padding: '12px 16px 10px 16px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  width: '100%',
  fontWeight: 600,
  color: isDark ? colours.dark.text : colours.light.text,
  position: 'relative',
  transition: 'background 0.2s ease',
  textAlign: 'left',
  '&:hover': {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  },
  '&:focus': {
    outline: `2px solid ${colours.highlight}`,
    outlineOffset: '2px',
  },
});

const contentClass = (isDark: boolean, collapsed: boolean) => mergeStyles({
  padding: collapsed ? '0 16px 12px 16px' : '0 16px 16px 16px',
  backgroundColor: isDark ? colours.dark.cardBackground : colours.light.cardBackground,
  maxHeight: collapsed ? '0' : '2000px',
  overflow: 'hidden',
  transition: 'max-height 0.35s ease, padding 0.25s ease',
  position: 'relative',
  transformOrigin: 'top',
});

const tagTrayClass = mergeStyles({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
});

const tagClass = (isDark: boolean, hasIcon: boolean) => mergeStyles({
  backgroundColor: isDark ? colours.dark.border : colours.light.border,
  color: isDark ? colours.dark.text : colours.light.text,
  padding: '6px 12px',
  borderRadius: '16px',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: hasIcon ? '6px' : '0',
  transition: 'all 0.2s ease',
  border: `1px solid ${isDark ? colours.dark.highlight : colours.light.highlight}`,
  
  '&:hover': {
    backgroundColor: isDark ? colours.dark.highlight : colours.light.highlight,
    color: '#ffffff',
    transform: 'scale(1.05)',
  },
});

const chevronIconClass = (collapsed: boolean, variant: string) => mergeStyles({
  fontSize: variant === 'premium' ? '18px' : '16px',
  transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  filter: variant === 'premium' ? `drop-shadow(0 2px 4px rgba(0,0,0,0.1))` : 'none',
});

const titleContainerClass = mergeStyles({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const subtitleClass = (isDark: boolean) => mergeStyles({
  fontSize: '12px',
  fontWeight: '400',
  color: isDark ? colours.dark.text : colours.light.text,
  opacity: 0.7,
});

const collapsedSummaryClass = (isDark: boolean) => mergeStyles({
  fontSize: '11px',
  fontWeight: 500,
  color: isDark ? colours.dark.text : colours.light.text,
  opacity: 0.55,
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
  marginLeft: '16px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  flex: 1,
});

const EnhancedCollapsibleSection: React.FC<EnhancedCollapsibleSectionProps> = ({
  title,
  subtitle,
  metrics,
  children,
  isDarkMode,
  defaultExpanded = true,
  variant = 'default',
}) => {
  const [collapsed, setCollapsed] = useState(!defaultExpanded);
  
  const toggleCollapse = () => setCollapsed(!collapsed);

  // Build subtle summary string for collapsed state (titles only, truncated)
  const summaryString = metrics.map(m => m.title).join(' · ');
  const truncatedSummary = summaryString.length > 80 ? summaryString.slice(0, 77) + '…' : summaryString;

  return (
    <div style={{ marginBottom: '16px' }} className={wrapperClass(isDarkMode, collapsed)}>
      <button
        onClick={toggleCollapse}
        aria-expanded={!collapsed}
        aria-controls={`${title}-content`}
        className={headerButtonClass(isDarkMode)}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div className={titleContainerClass} style={{ flexShrink: 0 }}>
            <span>{title}</span>
            {subtitle && variant === 'premium' && (
              <span className={subtitleClass(isDarkMode)}>{subtitle}</span>
            )}
          </div>
          {collapsed && (
            <div className={collapsedSummaryClass(isDarkMode)} title={summaryString}>
              {truncatedSummary}
            </div>
          )}
          <Icon
            iconName="ChevronDown"
            className={chevronIconClass(collapsed, variant)}
            style={{ marginLeft: '12px', flexShrink: 0 }}
          />
        </div>
      </button>
      <div id={`${title}-content`} className={contentClass(isDarkMode, collapsed)}>
        {!collapsed && children}
      </div>
    </div>
  );
};

export default EnhancedCollapsibleSection;
