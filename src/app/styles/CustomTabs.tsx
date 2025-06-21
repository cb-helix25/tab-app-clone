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
import { UserData } from '../../app/functionality/types';
import UserBubble from '../../components/UserBubble';

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
  user?: UserData;
}

const customPivotStyles = (_isDarkMode: boolean): Partial<IPivotStyles> => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    height: '56px',
  },
  link: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: 'transparent',
    padding: '0 16px',
    lineHeight: '56px',
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
  user,
}) => {
  const { isDarkMode } = useTheme();

  // Include a hidden pivot item for the Home icon so that when the Home tab is
  // active, no other tab appears selected. The Pivot component defaults to
  // selecting the first item when the provided key is not found. By always
  // supplying a matching key, we prevent the first visible tab ("Forms") from
  // being highlighted when "Home" is selected.
  const pivotSelectedKey = selectedKey;

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
      className="customTabsContainer"
      style={{
        backgroundColor: colours.darkBlue,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: '56px',
        borderBottom: `1px solid ${colours.darkBlue}`,
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
        style={{ color: '#ffffff' }}
      >
        <AiOutlineHome className="icon-outline" size={20} />
        <AiFillHome className="icon-filled" size={20} />
      </div>
      <Pivot
        style={{ flexGrow: 1 }}
        // Keep the Pivot mounted so the tab drop-in animation only plays on
        // first render. The selectedKey still controls which tab is active.
        selectedKey={pivotSelectedKey}
        onLinkClick={handleLinkClick}
        aria-label={ariaLabel || 'Custom Tabs'}
        styles={customPivotStyles(isDarkMode)}
        className="customPivot"
      >
        {/* Hidden item to occupy selection when Home is active */}
        <PivotItem
          itemKey="home"
          headerText="Home"
          headerButtonProps={{ style: { display: 'none' } }}
        />
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
      {user && <UserBubble user={user} />}
    </div>
  );
};

export default CustomTabs;
