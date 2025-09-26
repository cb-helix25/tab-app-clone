import React from 'react';
import { SearchBox } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import SegmentedControl from './SegmentedControl';
import { sharedSearchBoxStyle } from '../../app/styles/FilterStyles';

export interface FilterOption {
  key: string;
  label: string;
}

export interface FilterBannerProps {
  // Primary filter (status/type) - can be React node or SegmentedControl props
  primaryFilter?: React.ReactNode | {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    ariaLabel: string;
  };
  
  // Secondary filter (area/category) - can be React node or SegmentedControl props  
  secondaryFilter?: React.ReactNode | {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    ariaLabel: string;
  };
  
  // Search functionality
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  
  // Additional actions/controls
  children?: React.ReactNode;
  
  // Styling options
  className?: string;
  sticky?: boolean;
  topOffset?: number;
  // Remove chrome (background/border/shadow) for embedding inside another banner
  seamless?: boolean;
}

/**
 * Shared filter banner component for consistent styling across all tabs
 */
const FilterBanner: React.FC<FilterBannerProps> = ({
  primaryFilter,
  secondaryFilter,
  search,
  children,
  className,
  sticky = true,
  topOffset = 0,
  seamless = false
}) => {
  const { isDarkMode } = useTheme();

  const containerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: seamless ? '8px 12px' : '12px 20px',
    background: seamless ? 'transparent' : (isDarkMode 
      ? 'linear-gradient(135deg, rgba(31, 39, 50, 0.95) 0%, rgba(25, 32, 41, 0.98) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)'),
    backdropFilter: seamless ? 'none' : 'blur(12px)',
    WebkitBackdropFilter: seamless ? 'none' : 'blur(12px)',
    borderBottom: seamless ? 'none' : (isDarkMode 
      ? '1px solid rgba(255, 255, 255, 0.08)' 
      : '1px solid rgba(0, 0, 0, 0.06)'),
    boxShadow: seamless ? 'none' : (isDarkMode
      ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      : '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'),
    fontFamily: 'Raleway, sans-serif',
    flexWrap: 'wrap',
    minHeight: 56,
    ...(sticky && {
      position: 'sticky',
      top: topOffset,
      zIndex: 1000,
    }),
    selectors: {
      '@media (max-width: 768px)': {
        padding: '10px 16px',
        gap: 8,
        flexDirection: 'column',
        alignItems: 'stretch',
      }
    }
  }, className);

  const filtersContainerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '0 0 auto',
    selectors: {
      '@media (max-width: 768px)': {
        width: '100%',
        justifyContent: 'space-between',
      }
    }
  });

  const searchContainerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    flex: '0 0 auto',
    minWidth: 280,
    selectors: {
      '@media (max-width: 768px)': {
        marginLeft: 0,
        width: '100%',
        minWidth: 'auto',
      }
    }
  });

  const actionsContainerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '0 0 auto',
    selectors: {
      '@media (max-width: 768px)': {
        width: '100%',
        justifyContent: 'center',
      }
    }
  });

  return (
    <div className={containerStyle}>
      {/* Primary and Secondary Filters */}
      {(primaryFilter || secondaryFilter) && (
        <div className={filtersContainerStyle}>
          {primaryFilter && (
            React.isValidElement(primaryFilter) ? primaryFilter : (
              <SegmentedControl
                id={`${(primaryFilter as any).ariaLabel.toLowerCase().replace(/\s+/g, '-')}-filter`}
                ariaLabel={(primaryFilter as any).ariaLabel}
                value={(primaryFilter as any).value}
                onChange={(primaryFilter as any).onChange}
                options={(primaryFilter as any).options}
              />
            )
          )}
          {secondaryFilter && (
            React.isValidElement(secondaryFilter) ? secondaryFilter : (
              <SegmentedControl
                id={`${(secondaryFilter as any).ariaLabel.toLowerCase().replace(/\s+/g, '-')}-filter`}
                ariaLabel={(secondaryFilter as any).ariaLabel}
                value={(secondaryFilter as any).value}
                onChange={(secondaryFilter as any).onChange}
                options={(secondaryFilter as any).options}
              />
            )
          )}
        </div>
      )}

      {/* Additional Actions */}
      {children && (
        <div className={actionsContainerStyle}>
          {children}
        </div>
      )}

      {/* Search Box */}
      {search && (
        <div className={searchContainerStyle}>
          <SearchBox
            placeholder={search.placeholder}
            value={search.value}
            onChange={(_, newValue) => search.onChange(newValue || '')}
            styles={sharedSearchBoxStyle(isDarkMode)}
            iconProps={{ iconName: 'Search' }}
          />
        </div>
      )}
    </div>
  );
};

export default FilterBanner;