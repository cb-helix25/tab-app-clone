// src/app/styles/CustomTabs.tsx

import React from 'react';
import { Pivot, PivotItem, IPivotStyles, initializeIcons } from '@fluentui/react';
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
}

const customPivotStyles = (isDarkMode: boolean): Partial<IPivotStyles> => ({
  root: {
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    borderRadius: '8px',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.3s',
  },
  link: {
    fontSize: '16px',
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    backgroundColor: 'transparent',
    padding: '10px 20px',
    borderRadius: '4px',
    transition: 'background-color 0.3s, color 0.3s',
    selectors: {
      '::after': {
        content: '"|"',
        position: 'absolute',
        right: '-10px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: isDarkMode ? '#555' : '#ccc',
      },
      ':last-child::after': {
        content: '""',
      },
      ':hover': {
        backgroundColor: isDarkMode
          ? colours.dark.cardHover
          : colours.light.cardHover,
      },
    },
  },
  linkIsSelected: {
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    transform: 'scale(1.05)',
    boxShadow: isDarkMode
      ? '0 4px 8px rgba(255,255,255,0.2)'
      : '0 4px 8px rgba(0,0,0,0.2)',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    selectors: {
      '::after': {
        content: '""',
      },
    },
  },
});

const CustomTabs: React.FC<CustomTabsProps> = ({
  selectedKey,
  onLinkClick,
  tabs,
  ariaLabel,
}) => {
  const { isDarkMode } = useTheme();

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
    <Pivot
      selectedKey={selectedKey}
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
  );
};

export default CustomTabs;
