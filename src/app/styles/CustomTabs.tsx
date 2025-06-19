// src/app/styles/CustomTabs.tsx

import React from 'react';
import {
  Pivot,
  PivotItem,
  IPivotStyles,
  initializeIcons,
} from '@fluentui/react';
import { AiOutlineHome, AiFillHome } from 'react-icons/ai';
import { colours } from './colours';
import './CustomTabs.css';
import { useTheme } from '../../app/functionality/ThemeContext';
import { Tab } from '../functionality/types';

initializeIcons();

interface CustomTabsProps {
  selectedKey: string;
  onLinkClick: (
    item?: PivotItem,
    ev?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => void;
  tabs: Tab[];
  ariaLabel?: string;
  onHomeClick: () => void;
}

const customPivotStyles = (isDarkMode: boolean): Partial<IPivotStyles> => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
  },
  link: {
    fontSize: '16px',
    fontWeight: 600,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    backgroundColor: 'transparent',
    padding: '0 12px',
    lineHeight: '48px',
    position: 'relative',
    transition: 'color 0.2s',
    selectors: {
      ':hover': {
        color: colours.highlight,
        backgroundColor: 'transparent',
      },
    },
  },
  linkIsSelected: {
    color: colours.highlight,
  },
});

const CustomTabs: React.FC<CustomTabsProps> = ({
  selectedKey,
  onLinkClick,
  tabs,
  ariaLabel,
  onHomeClick,
}) => {
  const { isDarkMode } = useTheme();

  // If the selected key does not match any pivot item, unset it so no tab is
  // highlighted. This prevents the first tab from appearing active when the
  // Home icon is selected.
  const pivotSelectedKey = tabs.some((tab) => tab.key === selectedKey)
    ? selectedKey
    : undefined;

  const handleLinkClick = (
    item?: PivotItem,
    ev?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    const clickedTab = tabs.find((tab) => tab.key === item?.props.itemKey);
    if (clickedTab?.disabled) {
      ev?.preventDefault();
      return;
    }
    onLinkClick(item, ev as any);
  };

  return (
    <div
      style={{
        backgroundColor: isDarkMode
          ? colours.dark.sectionBackground
          : colours.light.sectionBackground,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: '48px',
        borderBottom: `1px solid ${isDarkMode ? '#444' : '#e5e5e5'}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        transition: 'background-color 0.3s',
      }}
    >
      <div
        className={`home-icon icon-hover ${selectedKey === 'home' ? 'active' : ''}`}
        onClick={onHomeClick}
        role="button"
        tabIndex={0}
        aria-label="Home"
        style={{ color: isDarkMode ? colours.dark.text : colours.light.text }}
      >
        <AiOutlineHome className="icon-outline" size={20} />
        <AiFillHome className="icon-filled" size={20} />
      </div>
      <Pivot
        selectedKey={pivotSelectedKey}
        onLinkClick={handleLinkClick}
        aria-label={ariaLabel || 'Custom Tabs'}
        styles={customPivotStyles(isDarkMode)}
        className="customPivot"
      >
        {tabs.map((tab, index) => (
          <PivotItem
            itemKey={tab.key}
            key={tab.key}
            headerText={tab.text}
            itemIcon={tab.key === 'reporting' ? 'Lock' : undefined}
            headerButtonProps={{
              className: tab.disabled ? 'disabledTab' : '',
              style: { '--animation-delay': `${index * 0.1}s` } as React.CSSProperties,
              'aria-disabled': tab.disabled ? 'true' : undefined,
            }}
          />
        ))}
      </Pivot>
    </div>
  );
};

export default CustomTabs;
