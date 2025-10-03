import React from 'react';
import { SearchBox, Icon } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import SegmentedControl from './SegmentedControl';
import { sharedSearchBoxStyle } from '../../app/styles/FilterStyles';

// Add spin animation CSS
const spinAnimation = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject CSS into head if not already present
if (typeof document !== 'undefined' && !document.querySelector('#refresh-spin-animation')) {
  const style = document.createElement('style');
  style.id = 'refresh-spin-animation';
  style.textContent = spinAnimation;
  document.head.appendChild(style);
}

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
  
  // Refresh functionality
  refresh?: {
    onRefresh: () => void;
    isLoading?: boolean;
    nextUpdateTime?: string;
    collapsible?: boolean;
  };
  
  // Additional actions/controls
  children?: React.ReactNode;
  
  // Styling options
  className?: string;
  sticky?: boolean;
  topOffset?: number;
  // Remove chrome (background/border/shadow) for embedding inside another banner
  seamless?: boolean;
  // Denser spacing for compact navigators
  dense?: boolean;
  // When true, show a collapsed search icon that expands on click/focus
  collapsibleSearch?: boolean;
}

/**
 * Shared filter banner component for consistent styling across all tabs
 */
const FilterBanner: React.FC<FilterBannerProps> = React.memo(({
  primaryFilter,
  secondaryFilter,
  search,
  refresh,
  children,
  className,
  sticky = true,
  topOffset = 0,
  seamless = false,
  dense = false,
  collapsibleSearch = false
}) => {
  const { isDarkMode } = useTheme();
  const [searchOpen, setSearchOpen] = React.useState<boolean>(!collapsibleSearch || !!search?.value);
  const [refreshOpen, setRefreshOpen] = React.useState<boolean>(!refresh?.collapsible);

  const containerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: dense ? 6 : 12,
    rowGap: dense ? 6 : 8,
    padding: seamless
      ? (dense ? '0' : '8px 12px')
      : (dense ? '0' : '12px 20px'),
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
  minHeight: dense ? 44 : 56,
  // Center wrapped rows vertically within the banner for better balance
  alignContent: 'center',
    ...(sticky && {
      position: 'sticky',
      top: topOffset,
      zIndex: 1000,
    }),
    selectors: {
      '@media (max-width: 600px)': {
        padding: '10px 16px',
        gap: 8,
        rowGap: 8,
        flexDirection: 'column',
        alignItems: 'stretch',
      }
    }
  }, className);

  const filtersContainerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
    flex: '0 0 auto',
  // Keep items centered within their row; when wrapping, center the row group
  alignContent: 'center',
    selectors: {
      '@media (max-width: 600px)': {
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
    minWidth: collapsibleSearch && !searchOpen ? 0 : 240,
    selectors: {
      '@media (max-width: 900px)': {
        marginLeft: 0,
        flex: '1 0 auto',
        minWidth: 'auto',
      },
      '@media (max-width: 600px)': {
        width: '100%',
        flex: '1 1 100%',
      }
    }
  });

  const actionsContainerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
    flex: '0 0 auto',
  alignContent: 'center',
    selectors: {
      '@media (max-width: 600px)': {
        width: '100%',
        justifyContent: 'center',
      }
    }
  });

  // Right-side cluster to keep search and refresh together on wrap
  const rightClusterStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
    flex: '0 1 auto',
    flexWrap: 'nowrap',
    selectors: {
      '@media (max-width: 900px)': {
        marginLeft: 0,
        width: '100%',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      },
      '@media (max-width: 600px)': {
        gap: 8,
      }
    }
  });

  const refreshContainerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    flex: '0 0 auto',
    selectors: {
      '@media (max-width: 900px)': {
        marginLeft: 0,
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

      {/* Right-side: Search + Refresh grouped to wrap together */}
      {(search || refresh) && (
        <div className={rightClusterStyle}>
          {search && (
            <div className={searchContainerStyle}>
              {collapsibleSearch && !searchOpen && !search.value ? (
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => setSearchOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: isDarkMode ? '#E5E7EB' : '#0F172A'
                  }}
                >
                  <span className="ms-Icon root" aria-hidden="true" style={{ fontFamily: 'FabricMDL2Icons', fontSize: 14 }}>
                    
                  </span>
                </button>
              ) : (
                <SearchBox
                  placeholder={search.placeholder}
                  value={search.value}
                  onChange={(_, newValue) => search.onChange(newValue || '')}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => {
                    if (collapsibleSearch && !search.value) setSearchOpen(false);
                  }}
                  styles={sharedSearchBoxStyle(isDarkMode)}
                  iconProps={{ iconName: 'Search' }}
                />
              )}
            </div>
          )}

          {refresh && (
            <div className={refreshContainerStyle}>
              {refresh.collapsible && !refreshOpen ? (
                <button
                  type="button"
                  aria-label="Show refresh options"
                  onClick={() => setRefreshOpen(true)}
                  disabled={refresh.isLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                    background: 'transparent',
                    cursor: refresh.isLoading ? 'not-allowed' : 'pointer',
                    color: isDarkMode ? '#E5E7EB' : '#0F172A',
                    opacity: refresh.isLoading ? 0.6 : 1
                  }}
                >
                  <Icon
                    iconName={refresh.isLoading ? "Sync" : "Refresh"}
                    style={{ 
                      fontSize: 14,
                      animation: refresh.isLoading ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px',
                    height: 32,
                    lineHeight: '24px',
                    borderRadius: 16,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                    fontSize: 12,
                    color: isDarkMode ? colours.dark.highlight : colours.light.highlight,
                  }}
                  onBlur={() => {
                    if (refresh.collapsible) setRefreshOpen(false);
                  }}
                >
                  <Icon
                    iconName={refresh.isLoading ? "Sync" : "Clock"}
                    style={{ 
                      fontSize: 14, 
                      color: isDarkMode ? colours.dark.highlight : colours.light.highlight,
                      animation: refresh.isLoading ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                  {refresh.nextUpdateTime && (
                    <span style={{ fontSize: 11, fontWeight: 500 }}>
                      Next: {refresh.nextUpdateTime}
                    </span>
                  )}
                  <button
                    onClick={refresh.onRefresh}
                    disabled={refresh.isLoading}
                    title="Refresh now"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 4,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      color: isDarkMode ? colours.dark.text : colours.light.text,
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: 'Raleway, sans-serif',
                      cursor: refresh.isLoading ? 'not-allowed' : 'pointer',
                      transition: '0.15s',
                      opacity: refresh.isLoading ? 0.6 : 0.8,
                    }}
                  >
                    <Icon
                      iconName={refresh.isLoading ? "Sync" : "Refresh"}
                      style={{ 
                        fontSize: 12,
                        animation: refresh.isLoading ? 'spin 1s linear infinite' : 'none'
                      }}
                    />
                    <span>Update Now</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default FilterBanner;