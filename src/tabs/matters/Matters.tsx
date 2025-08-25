import React, { useMemo, useState, useEffect } from 'react';
import { Stack, Text, Spinner, SpinnerSize, MessageBar, MessageBarType, IconButton, mergeStyles, Icon } from '@fluentui/react';
import ToggleSwitch from '../../components/ToggleSwitch';
import SegmentedControl from '../../components/filter/SegmentedControl';
import { NormalizedMatter, UserData } from '../../app/functionality/types';
import {
  filterMattersByStatus,
  filterMattersByArea,
  filterMattersByRole,
  applyAdminFilter,
  hasAdminAccess,
  getUniquePracticeAreas
} from '../../utils/matterNormalization';
import MatterLineItem from './MatterLineItem';
import MatterOverview from './MatterOverview';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigatorActions } from '../../app/functionality/NavigatorContext';
import MatterApiDebugger from '../../components/MatterApiDebugger';

interface MattersProps {
  matters: NormalizedMatter[];
  isLoading: boolean;
  error: string | null;
  userData: UserData[] | null;
}

const Matters: React.FC<MattersProps> = ({ matters, isLoading, error, userData }) => {
  const { isDarkMode } = useTheme();
  const { setContent } = useNavigatorActions();
  const [selected, setSelected] = useState<NormalizedMatter | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('Active');
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>('All');
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('All');
  const [showDataInspector, setShowDataInspector] = useState<boolean>(false);
  // Scope & dataset selection
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [useNewData, setUseNewData] = useState<boolean>(false); // Admin-only toggle to view VNet (new) data
  const [twoColumn, setTwoColumn] = useState<boolean>(false);

  const userFullName = userData?.[0]?.FullName?.toLowerCase();
  const userRole = userData?.[0]?.Role?.toLowerCase();
  const isAdmin = hasAdminAccess(userRole || '', userFullName || '');
  const isLocalhost = (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Debug flag to control verbose logging
  const DEBUG_MATTERS_FILTERING = false;

  // Debug the incoming matters
  if (DEBUG_MATTERS_FILTERING) {
    console.log('🔍 Matters received:', matters.length);
    console.log('🔍 First matter sample:', matters[0]);
    console.log('🔍 User info:', { userFullName, userRole, isAdmin });
  }

  // Apply all filters in sequence
  const filtered = useMemo(() => {
    let result = matters;
    if (DEBUG_MATTERS_FILTERING) {
      console.log('🔍 Filter Debug - Starting with matters:', result.length);
    }

    // Decide dataset and scope to construct allowed sources
    const effectiveUseNew = isAdmin ? useNewData : false;
    const allowedSources = new Set<string>([
      ...(effectiveUseNew ? ['vnet_direct'] : ['legacy_all']),
    ]);
    if (allowedSources.size > 0) {
      result = result.filter((m) => allowedSources.has(m.dataSource));
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 After source filter:', result.length, 'sources:', Array.from(allowedSources));
        // console.log('🔍 Sample after source filter:', result.slice(0,3).map(m => ({id: m.matterId, ds: m.dataSource, originalStatus: m.originalStatus, status: m.status, role: m.role})));
      }
    } else {
      // If no sources selected, show nothing
      result = [];
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 After source filter: 0 (no sources selected)');
      }
    }

    // Apply admin filter next
  // - If scope is 'all' and user is admin => show everyone
  // - Otherwise => show only user's matters
  const effectiveShowEveryone = scope === 'all' && isAdmin;
  result = applyAdminFilter(result, effectiveShowEveryone, userFullName || '', userRole || '');
  if (DEBUG_MATTERS_FILTERING) {
    console.log('🔍 After admin filter:', result.length, 'showEveryone:', effectiveShowEveryone);
  }

    // For New data + Mine, restrict to Responsible solicitor only
    if (effectiveUseNew && scope === 'mine') {
      const before = result.length;
      result = result.filter(m => m.role === 'responsible' || m.role === 'both');
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 New+Mine responsible-only filter:', { before, after: result.length });
      }
    }

    // Apply status filter
    // Admin-only extra option: 'Matter Requests' filters by originalStatus === 'MatterRequest'
    if (activeFilter === 'Matter Requests') {
      const before = result.length;
      result = result.filter(m => (m.originalStatus || '').toLowerCase() === 'matterrequest');
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 Matter Requests filter applied:', { before, after: result.length });
      }
    } else if (activeFilter !== 'All') {
      result = filterMattersByStatus(result, activeFilter.toLowerCase() as any);
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 After status filter:', result.length, 'activeFilter:', activeFilter);
      }
    } else {
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 Status filter skipped (All selected):', result.length);
      }
    }

    // Apply area filter
    result = filterMattersByArea(result, activeAreaFilter);
    if (DEBUG_MATTERS_FILTERING) {
      console.log('🔍 After area filter:', result.length, 'activeAreaFilter:', activeAreaFilter);
    }

    // Apply role filter
    if (activeRoleFilter !== 'All') {
      const allowedRoles = activeRoleFilter === 'Responsible' ? ['responsible'] :
                          activeRoleFilter === 'Originating' ? ['originating'] :
                          ['responsible', 'originating'];
      result = filterMattersByRole(result, allowedRoles as any);
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 After role filter:', result.length, 'activeRoleFilter:', activeRoleFilter);
      }
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((m) =>
        m.clientName?.toLowerCase().includes(term) ||
        m.displayNumber?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.practiceArea?.toLowerCase().includes(term)
      );
      if (DEBUG_MATTERS_FILTERING) {
        console.log('🔍 After search filter:', result.length, 'searchTerm:', searchTerm);
      }
    }

    if (DEBUG_MATTERS_FILTERING) {
      console.log('🔍 Final filtered result:', result.length);
    }
    return result;
  }, [
    matters,
    userFullName,
    userRole,
    activeFilter,
    activeAreaFilter,
    activeRoleFilter,
    searchTerm,
    scope,
    useNewData,
  ]);

  // Dataset count (post-source selection only, before other filters)
  const datasetCount = useMemo(() => {
    const effectiveUseNew = isAdmin ? useNewData : false;
    const allowedSources = new Set<string>([
      ...(effectiveUseNew ? ['vnet_direct'] : ['legacy_all']),
    ]);
    return matters.filter(m => allowedSources.has(m.dataSource)).length;
  }, [matters, useNewData, isAdmin]);

  // Get unique practice areas for filtering
  const availableAreas = useMemo(() => {
    return getUniquePracticeAreas(matters);
  }, [matters]);

  // No auto-toggle for admins; let Luke/Alex choose when to see everyone's matters.

  // Set up navigation content with filter bar
  useEffect(() => {
    if (!selected) {
      const filterOptions = isAdmin ? ['All', 'Active', 'Closed', 'Matter Requests'] : ['All', 'Active', 'Closed'];
      setContent(
        <div style={{
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          padding: '10px 24px 12px 24px',
          boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontFamily: 'Raleway, sans-serif',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>
          {/* Status filter navigation buttons */}
          <SegmentedControl
            id="matters-status-seg"
            ariaLabel="Filter matters by status"
            value={activeFilter}
            onChange={setActiveFilter}
            options={filterOptions.map(o => ({ key: o, label: o }))}
          />
          {/* Role filter buttons */}
          <SegmentedControl
            id="matters-role-seg"
            ariaLabel="Filter matters by role"
            value={activeRoleFilter}
            onChange={setActiveRoleFilter}
            options={['All','Responsible','Originating'].map(o => ({ key: o, label: o }))}
          />
          {/* Area dropdown - scalable for many areas */}
          {availableAreas.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: isDarkMode ? colours.dark.text : colours.light.text }}>Area:</span>
              <select
                value={activeAreaFilter}
                onChange={(e) => setActiveAreaFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                  background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '12px',
                  fontFamily: 'Raleway, sans-serif',
                  minWidth: '120px'
                }}
              >
                <option value="All">All Areas</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          )}
          {/* Search input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              placeholder="Search matters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                color: isDarkMode ? colours.dark.text : colours.light.text,
                fontSize: '12px',
                fontFamily: 'Raleway, sans-serif',
                outline: 'none',
                width: '160px',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <Icon iconName="Clear" style={{ fontSize: '12px' }} />
              </button>
            )}
          </div>
          {/* Admin controls (debug + data toggle) for admin or localhost */}
          {(isAdmin || isLocalhost) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '2px 10px 2px 6px',
                  height: 40,
                  borderRadius: 12,
                  background: isDarkMode ? '#5a4a12' : colours.highlightYellow,
                  border: isDarkMode ? '1px solid #806c1d' : '1px solid #e2c56a',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDarkMode ? '#ffe9a3' : '#5d4700'
                }}
                title="Admin Debugger (alex, luke, cass only)"
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? '#ffe9a3' : '#5d4700', marginRight: 4 }}>
                  Admin Only
                </span>
                {/* Scope toggle moved into debug pill */}
                <SegmentedControl
                  id="matters-scope-seg"
                  ariaLabel="Scope mine or all"
                  value={scope}
                  onChange={(k) => setScope(k as 'mine' | 'all')}
                  options={[{ key: 'mine', label: 'Mine' }, ...(isAdmin ? [{ key: 'all', label: 'All' }] : [])]}
                />
                <span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>Showing {filtered.length}/{datasetCount}</span>
                <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.15)' }} />
                <IconButton
                  iconProps={{ iconName: 'TestBeaker', style: { fontSize: 16 } }}
                  title="Admin Debugger (alex, luke, cass only)"
                  ariaLabel="Admin Debugger (alex, luke, cass only)"
                  onClick={() => setShowDataInspector(v => !v)}
                  styles={{ root: { borderRadius: 8, background: 'rgba(0,0,0,0.08)', height: 30, width: 30 } }}
                  data-tooltip="alex, luke, cass"
                />
                <ToggleSwitch
                  id="matters-new-data-toggle"
                  checked={useNewData}
                  onChange={(v) => setUseNewData(v)}
                  size="sm"
                  onText="New"
                  offText="Legacy"
                  ariaLabel="Toggle dataset between legacy and new"
                />
                <ToggleSwitch
                  id="matters-two-column-toggle"
                  checked={twoColumn}
                  onChange={setTwoColumn}
                  size="sm"
                  onText="2-col"
                  offText="1-col"
                  ariaLabel="Toggle two column layout"
                />
              </div>
            </div>
          )}
        </div>
      );
    } else {
      setContent(
        <div style={{
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
          borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          alignItems: 'center',
          height: '48px',
          position: 'sticky',
          top: '48px',
          zIndex: 999,
        }}>
          <IconButton
            iconProps={{ iconName: 'ChevronLeft' }}
            onClick={() => setSelected(null)}
            styles={{
              root: {
                width: 32,
                height: 32,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDarkMode ? colours.dark.sectionBackground : '#f3f3f3',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                marginRight: 8,
              }
            }}
            title="Back"
            ariaLabel="Back"
          />
          <Text variant="mediumPlus" styles={{
            root: {
              fontWeight: '600',
              color: isDarkMode ? colours.dark.text : colours.light.text,
              fontFamily: 'Raleway, sans-serif',
            }
          }}>
            Matter Details
          </Text>
        </div>
      );
    }
    return () => setContent(null);
  }, [
    setContent,
    selected,
    isDarkMode,
    activeFilter,
    activeAreaFilter,
    availableAreas,
    searchTerm,
  scope,
  useNewData,
    activeRoleFilter,
    filtered.length,
  ]);

  if (selected) {
    return (
      <div style={{ padding: 20 }}>
        <MatterOverview matter={selected} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={containerStyle(isDarkMode)}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px' 
        }}>
          <Spinner label="Loading matters..." size={SpinnerSize.medium} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerStyle(isDarkMode)}>
        <div style={{ padding: '20px' }}>
          <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
        </div>
      </div>
    );
  }

  if (filtered.length === 0 && !isLoading && !error) {
    return (
      <div className={containerStyle(isDarkMode)}>
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: 'none',
        }}>
          <Icon
            iconName="Search"
            styles={{
              root: {
                fontSize: '48px',
                color: isDarkMode ? colours.dark.subText : colours.light.subText,
                marginBottom: '20px',
              },
            }}
          />
          <Text
            variant="xLarge"
            styles={{
              root: {
                color: isDarkMode ? colours.dark.text : colours.light.text,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: '600',
                marginBottom: '8px',
              },
            }}
          >
            No matters found
          </Text>
          <Text
            variant="medium"
            styles={{
              root: {
                color: isDarkMode ? colours.dark.subText : colours.light.subText,
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          >
            Try adjusting your search criteria or filters
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyle(isDarkMode)}>
      <section className="page-section">
        <Stack
          tokens={{ childrenGap: 0 }}
          styles={{
            root: {
              backgroundColor: isDarkMode 
                ? colours.dark.sectionBackground 
                : colours.light.sectionBackground,
              padding: '16px',
              borderRadius: 0,
              boxShadow: isDarkMode
                ? `0 4px 12px ${colours.dark.border}`
                : `0 4px 12px ${colours.light.border}`,
              width: '100%',
              fontFamily: 'Raleway, sans-serif',
            },
          }}
        >
          {/* Connected List Items (supports 1-col / 2-col) */}
          <div
            className={twoColumn ? 'two-col-grid' : undefined}
            style={{
              display: twoColumn ? 'grid' : 'flex',
              flexDirection: twoColumn ? undefined : 'column',
              gap: twoColumn ? '12px' : '0px',
              padding: 0,
              margin: 0,
              backgroundColor: 'transparent',
              gridTemplateColumns: twoColumn ? 'repeat(2, minmax(0, 1fr))' : undefined,
              width: '100%',
              transition: 'grid-template-columns .25s ease',
            }}
          >
            {/* Inject responsive fallback style once */}
            {twoColumn && typeof document !== 'undefined' && !document.getElementById('mattersTwoColStyles') && (
              (() => {
                const styleEl = document.createElement('style');
                styleEl.id = 'mattersTwoColStyles';
                styleEl.textContent = '@media (max-width: 860px){.two-col-grid{display:flex!important;flex-direction:column!important;}}';
                document.head.appendChild(styleEl);
                return null;
              })()
            )}
            {filtered.map((m, idx) => (
              <MatterLineItem
                key={m.matterId || idx}
                matter={m}
                onSelect={setSelected}
                isLast={idx === filtered.length - 1}
              />
            ))}
          </div>
        </Stack>
      </section>

      {/* Matter API Debugger - Only in development */}
      {showDataInspector && (
        <MatterApiDebugger
          currentMatters={filtered}
          onClose={() => setShowDataInspector(false)}
        />
      )}
    </div>
  );

  function containerStyle(dark: boolean) {
    return mergeStyles({
      backgroundColor: dark ? colours.dark.background : colours.light.background,
      minHeight: '100vh',
      boxSizing: 'border-box',
      color: dark ? colours.light.text : colours.dark.text,
    });
  }
};

export default Matters;