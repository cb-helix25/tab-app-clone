import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { DefaultButton, PrimaryButton, type IButtonStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigatorActions } from '../../app/functionality/NavigatorContext';
import type { Enquiry, Matter, POID, TeamData, UserData } from '../../app/functionality/types';
import ManagementDashboard, { WIP } from './ManagementDashboard';
import HomePreview from './HomePreview';

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
  user_id: number;
}

interface DatasetMap {
  userData: UserData[] | null;
  teamData: TeamData[] | null;
  enquiries: Enquiry[] | null;
  allMatters: Matter[] | null;
  wip: WIP[] | null;
  recoveredFees: RecoveredFee[] | null;
  poidData: POID[] | null;
}

const DATASETS = [
  { key: 'userData', name: 'People' },
  { key: 'teamData', name: 'Teams' },
  { key: 'enquiries', name: 'Enquiries' },
  { key: 'allMatters', name: 'Matters' },
  { key: 'wip', name: 'WIP' },
  { key: 'recoveredFees', name: 'Collected Fees' },
  { key: 'poidData', name: 'ID Submissions' },
] as const;

type DatasetDefinition = typeof DATASETS[number];
type DatasetKey = DatasetDefinition['key'];
type DatasetStatusValue = 'idle' | 'loading' | 'ready' | 'error';

interface DatasetMeta {
  status: DatasetStatusValue;
  updatedAt: number | null;
}

type DatasetStatus = Record<DatasetKey, DatasetMeta>;

interface AvailableReport {
  key: string;
  name: string;
  status: string;
  action?: 'dashboard';
}

const AVAILABLE_REPORTS: AvailableReport[] = [
  {
    key: 'management',
    name: 'Management dashboard',
    status: 'Live today',
    action: 'dashboard',
  },
  {
    key: 'enquiries',
    name: 'Enquiries activity report',
    status: 'Enquiries tab',
  },
  {
    key: 'annualLeave',
    name: 'Annual leave report',
    status: 'Annual Leave tab',
  },
  {
    key: 'matters',
    name: 'Matters snapshot',
    status: 'Matters tab',
  },
];

const MANAGEMENT_DATASET_KEYS = DATASETS.map((dataset) => dataset.key);
const REPORTING_ENDPOINT = '/api/reporting/management-datasets';

const EMPTY_DATASET: DatasetMap = {
  userData: null,
  teamData: null,
  enquiries: null,
  allMatters: null,
  wip: null,
  recoveredFees: null,
  poidData: null,
};

let cachedData: DatasetMap = { ...EMPTY_DATASET };
let cachedTimestamp: number | null = null;

const LIGHT_BACKGROUND_COLOUR = colours.light.background;
const DARK_BACKGROUND_COLOUR = colours.dark.background;
const LIGHT_SURFACE_COLOUR = colours.light.sectionBackground;
const DARK_SURFACE_COLOUR = colours.dark.sectionBackground;

const STATUS_BADGE_COLOURS: Record<DatasetStatusValue, { lightBg: string; darkBg: string; dot: string; label: string }> = {
  ready: {
    lightBg: 'rgba(34, 197, 94, 0.16)',
    darkBg: 'rgba(34, 197, 94, 0.28)',
    dot: '#22c55e',
    label: 'Ready',
  },
  loading: {
    lightBg: 'rgba(59, 130, 246, 0.18)',
    darkBg: 'rgba(59, 130, 246, 0.32)',
    dot: '#60a5fa',
    label: 'Refreshing',
  },
  error: {
    lightBg: 'rgba(248, 113, 113, 0.18)',
    darkBg: 'rgba(248, 113, 113, 0.32)',
    dot: '#f87171',
    label: 'Error',
  },
  idle: {
    lightBg: 'rgba(148, 163, 184, 0.16)',
    darkBg: 'rgba(148, 163, 184, 0.28)',
    dot: 'rgba(148, 163, 184, 0.7)',
    label: 'Not loaded',
  },
};

const surfaceShadow = (isDarkMode: boolean): string => (
  isDarkMode ? '0 2px 10px rgba(0, 0, 0, 0.22)' : '0 2px 8px rgba(15, 23, 42, 0.06)'
);

const subtleStroke = (isDarkMode: boolean): string => (
  isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.06)'
);

const containerStyle = (isDarkMode: boolean): CSSProperties => ({
  minHeight: '100vh',
  width: '100%',
  padding: '26px 30px 40px',
  background: isDarkMode ? colours.dark.background : colours.light.background,
  color: isDarkMode ? colours.dark.text : colours.light.text,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  transition: 'background 0.3s ease, color 0.3s ease',
  fontFamily: 'Raleway, sans-serif',
});

const sectionSurfaceStyle = (isDarkMode: boolean, overrides: CSSProperties = {}): CSSProperties => ({
  background: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : '#FFFFFF',
  borderRadius: 12,
  border: `1px solid ${subtleStroke(isDarkMode)}`,
  boxShadow: surfaceShadow(isDarkMode),
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  ...overrides,
});

const heroSurfaceStyle = (isDarkMode: boolean): CSSProperties => (
  sectionSurfaceStyle(isDarkMode, { gap: 14, padding: '22px 24px' })
);

const reportsListStyle = (): CSSProperties => ({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

const reportRowStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '12px 14px',
  borderRadius: 10,
  border: `1px solid ${subtleStroke(isDarkMode)}`,
  background: isDarkMode ? 'rgba(17, 24, 39, 0.72)' : 'rgba(255, 255, 255, 0.95)',
});

const reportRowHeaderStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  color: isDarkMode ? colours.dark.text : colours.light.text,
});

const reportNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const reportStatusStyle = (isDarkMode: boolean): CSSProperties => ({
  fontSize: 12,
  fontWeight: 600,
  color: isDarkMode ? colours.dark.subText : colours.highlight,
});

const dataFeedListStyle = (): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const feedRowStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: 8,
  padding: '8px 12px',
  background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
  border: `1px solid ${isDarkMode ? colours.dark.borderColor : colours.light.borderColor}`,
  gap: 12,
});

const feedLabelGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const feedLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
};

const feedMetaStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.65,
};

const statusPillStyle = (
  palette: { lightBg: string; darkBg: string; dot: string; label: string },
  isDarkMode: boolean,
): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: isDarkMode ? palette.darkBg : palette.lightBg,
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
  boxShadow: 'none',
});

const statusDotStyle = (colour: string): CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: colour,
});

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  fontFamily: 'Raleway, sans-serif',
};

const heroMetaRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  fontSize: 12,
};

const fullScreenWrapperStyle = (isDarkMode: boolean): CSSProperties => ({
  minHeight: '100vh',
  padding: '24px 28px',
  background: isDarkMode ? DARK_BACKGROUND_COLOUR : LIGHT_BACKGROUND_COLOUR,
  color: isDarkMode ? colours.dark.text : colours.light.text,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  transition: 'background 0.3s ease, color 0.3s ease',
});

const primaryButtonStyles = (isDarkMode: boolean): IButtonStyles => ({
  root: {
    borderRadius: 12,
    padding: '0 20px',
    height: 38,
    background: colours.highlight,
    color: '#ffffff',
    fontWeight: 600,
    boxShadow: 'none',
    transition: 'background 0.2s ease',
    fontFamily: 'Raleway, sans-serif',
  },
  rootHovered: {
    background: '#2f7cb3',
  },
  rootPressed: {
    background: '#266795',
  },
});

const subtleButtonStyles = (isDarkMode: boolean): IButtonStyles => ({
  root: {
    borderRadius: 12,
    padding: '0 18px',
    height: 38,
    background: isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'transparent',
    color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
    border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.32)' : 'rgba(13, 47, 96, 0.22)'}`,
    fontWeight: 600,
    boxShadow: 'none',
    transition: 'background 0.2s ease',
    fontFamily: 'Raleway, sans-serif',
  },
  rootHovered: {
    background: isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(54, 144, 206, 0.12)',
  },
  rootPressed: {
    background: isDarkMode ? 'rgba(148, 163, 184, 0.32)' : 'rgba(54, 144, 206, 0.18)',
  },
});

const dashboardNavigatorStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
});

const dashboardNavigatorTitleStyle = (isDarkMode: boolean): CSSProperties => ({
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'Raleway, sans-serif',
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
});

const dashboardNavigatorButtonStyles = (isDarkMode: boolean): IButtonStyles => ({
  root: {
    borderRadius: 999,
    height: 32,
    padding: '0 12px',
    background: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 250, 252, 0.95)',
    border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.32)' : 'rgba(13, 47, 96, 0.18)'}`,
    color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
    fontWeight: 600,
    fontFamily: 'Raleway, sans-serif',
    boxShadow: 'none',
  },
  rootHovered: {
    background: isDarkMode ? 'rgba(15, 23, 42, 0.78)' : 'rgba(236, 244, 251, 0.96)',
  },
  rootPressed: {
    background: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(222, 235, 249, 0.96)',
  },
  icon: {
    color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
  },
  label: {
    fontSize: 12,
  },
});

const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) {
    const minutes = Math.round(diff / 60000);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.round(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTimestamp = (timestamp: number): string => (
  new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
);

interface ReportingHomeProps {
  userData?: UserData[] | null;
  teamData?: TeamData[] | null;
}

/**
 * Streamlined reporting landing page that centres on the Management Dashboard experience.
 */
const ReportingHome: React.FC<ReportingHomeProps> = ({ userData: propUserData, teamData: propTeamData }) => {
  const { isDarkMode } = useTheme();
  const { setContent } = useNavigatorActions();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeView, setActiveView] = useState<'overview' | 'dashboard'>('overview');
  const handleBackToOverview = useCallback(() => {
    setActiveView('overview');
  }, [setActiveView]);
  const [datasetData, setDatasetData] = useState<DatasetMap>(() => ({
    userData: propUserData ?? cachedData.userData,
    teamData: propTeamData ?? cachedData.teamData,
    enquiries: cachedData.enquiries,
    allMatters: cachedData.allMatters,
    wip: cachedData.wip,
    recoveredFees: cachedData.recoveredFees,
    poidData: cachedData.poidData,
  }));
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus>(() => {
    const record: Partial<DatasetStatus> = {};
    DATASETS.forEach((dataset) => {
      const value = dataset.key === 'userData' && propUserData !== undefined
        ? propUserData
        : dataset.key === 'teamData' && propTeamData !== undefined
          ? propTeamData
          : cachedData[dataset.key];
      const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
      record[dataset.key] = { status: hasValue ? 'ready' : 'idle', updatedAt: cachedTimestamp };
    });
    return record as DatasetStatus;
  });
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(cachedTimestamp);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBootstrapped, setHasBootstrapped] = useState<boolean>(() => Boolean(cachedTimestamp || propUserData || propTeamData));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeView === 'dashboard') {
      setContent(
        <div style={dashboardNavigatorStyle(isDarkMode)}>
          <DefaultButton
            text="Back to overview"
            iconProps={{ iconName: 'Back' }}
            onClick={handleBackToOverview}
            styles={dashboardNavigatorButtonStyles(isDarkMode)}
          />
          <span style={dashboardNavigatorTitleStyle(isDarkMode)}>Management dashboard</span>
        </div>,
      );
    } else {
      setContent(null);
    }

    return () => {
      setContent(null);
    };
  }, [activeView, handleBackToOverview, isDarkMode, setContent]);

  const refreshDatasets = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    setDatasetStatus((prev) => {
      const next: DatasetStatus = { ...prev };
      MANAGEMENT_DATASET_KEYS.forEach((key) => {
        const previousMeta = prev[key];
        next[key] = { status: 'loading', updatedAt: previousMeta?.updatedAt ?? null };
      });
      return next;
    });

    try {
      const params = new URLSearchParams();
      params.set('datasets', MANAGEMENT_DATASET_KEYS.join(','));
      const response = await fetch(`${REPORTING_ENDPOINT}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.status}`);
      }

      const payload = (await response.json()) as Partial<DatasetMap> & { errors?: Record<string, string> };
      const nextData: DatasetMap = {
        userData: payload.userData ?? cachedData.userData,
        teamData: payload.teamData ?? cachedData.teamData,
        enquiries: payload.enquiries ?? cachedData.enquiries,
        allMatters: payload.allMatters ?? cachedData.allMatters,
        wip: payload.wip ?? cachedData.wip,
        recoveredFees: payload.recoveredFees ?? cachedData.recoveredFees,
        poidData: payload.poidData ?? cachedData.poidData,
      };

      const now = Date.now();
      cachedData = nextData;
      cachedTimestamp = now;

      setDatasetData(nextData);
      setDatasetStatus((prev) => {
        const next: DatasetStatus = { ...prev };
        MANAGEMENT_DATASET_KEYS.forEach((key) => {
          const value = nextData[key];
          const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
          next[key] = { status: hasValue ? 'ready' : 'ready', updatedAt: now };
        });
        return next;
      });
      setLastRefreshTimestamp(now);

      if (payload.errors && Object.keys(payload.errors).length > 0) {
        setError('Some datasets were unavailable.');
      }
    } catch (fetchError) {
      console.error('Failed to refresh reporting datasets:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
      setDatasetStatus((prev) => {
        const next: DatasetStatus = { ...prev };
        MANAGEMENT_DATASET_KEYS.forEach((key) => {
          const previous = prev[key];
          next[key] = { status: 'error', updatedAt: previous?.updatedAt ?? null };
        });
        return next;
      });
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (hasBootstrapped) {
      return;
    }
    refreshDatasets();
    setHasBootstrapped(true);
  }, [hasBootstrapped, refreshDatasets]);

  useEffect(() => {
    if (propUserData !== undefined) {
      setDatasetData((prev) => {
        if (prev.userData === propUserData) {
          return prev;
        }
        const next = { ...prev, userData: propUserData ?? null };
        cachedData = { ...cachedData, userData: propUserData ?? null };
        return next;
      });
    }
  }, [propUserData]);

  useEffect(() => {
    if (propTeamData !== undefined) {
      setDatasetData((prev) => {
        if (prev.teamData === propTeamData) {
          return prev;
        }
        const next = { ...prev, teamData: propTeamData ?? null };
        cachedData = { ...cachedData, teamData: propTeamData ?? null };
        return next;
      });
    }
  }, [propTeamData]);

  const datasetSummaries = useMemo(() => (
    DATASETS.map((dataset) => {
      const value = datasetData[dataset.key];
      const meta = datasetStatus[dataset.key];
      const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
      const status: DatasetStatusValue = hasValue ? 'ready' : meta.status;
      const count = Array.isArray(value) ? value.length : hasValue ? 1 : 0;
      return {
        definition: dataset,
        status,
        updatedAt: meta.updatedAt,
        count,
      };
    })
  ), [datasetData, datasetStatus]);

  const readyCount = datasetSummaries.filter((summary) => summary.status === 'ready').length;
  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const heroSubtitle = isFetching
    ? 'Refreshing'
    : lastRefreshTimestamp
      ? `Updated ${formatRelativeTime(lastRefreshTimestamp)}`
      : 'Not refreshed yet';

  const heroMetaItems = [
    `${formattedDate} • ${formattedTime}`,
    heroSubtitle,
    `${readyCount}/${datasetSummaries.length} data feeds`,
  ];

  if (activeView === 'dashboard') {
    return (
      <div style={fullScreenWrapperStyle(isDarkMode)}>
        <ManagementDashboard
          enquiries={datasetData.enquiries}
          allMatters={datasetData.allMatters}
          wip={datasetData.wip}
          recoveredFees={datasetData.recoveredFees}
          teamData={datasetData.teamData}
          userData={datasetData.userData}
          poidData={datasetData.poidData}
          triggerRefresh={refreshDatasets}
          lastRefreshTimestamp={lastRefreshTimestamp ?? undefined}
          isFetching={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="reporting-home-container" style={containerStyle(isDarkMode)}>
      <section style={heroSurfaceStyle(isDarkMode)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              background: isDarkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(37, 99, 235, 0.12)',
              color: isDarkMode ? colours.light.text : colours.missedBlue,
              fontWeight: 600,
              fontFamily: 'Raleway, sans-serif',
            }}
          >
            Restricted access
          </span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'Raleway, sans-serif' }}>Reporting workspace</h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <PrimaryButton
            text={isFetching ? 'Preparing…' : 'Open management dashboard'}
            onClick={() => setActiveView('dashboard')}
            styles={primaryButtonStyles(isDarkMode)}
            disabled={isFetching}
          />
          <DefaultButton
            text={isFetching ? 'Refreshing…' : 'Refresh data'}
            onClick={refreshDatasets}
            styles={subtleButtonStyles(isDarkMode)}
            disabled={isFetching}
          />
        </div>
        <div style={heroMetaRowStyle}>
          {heroMetaItems.map((item) => (
            <span
              key={item}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 999,
                background: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${subtleStroke(isDarkMode)}`,
                boxShadow: 'none',
                color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: isDarkMode ? 'rgba(248, 113, 113, 0.22)' : 'rgba(248, 113, 113, 0.18)',
            color: isDarkMode ? '#fecaca' : '#b91c1c',
            fontSize: 12,
            boxShadow: surfaceShadow(isDarkMode),
            border: `1px solid ${isDarkMode ? 'rgba(248, 113, 113, 0.32)' : 'rgba(248, 113, 113, 0.32)'}`,
          }}>
            {error}
          </div>
        )}
      </section>

      <section style={sectionSurfaceStyle(isDarkMode)}>
        <h2 style={sectionTitleStyle}>Available today</h2>
        <ul style={reportsListStyle()}>
          {AVAILABLE_REPORTS.map((report) => (
            <li key={report.key} style={reportRowStyle(isDarkMode)}>
              <div style={reportRowHeaderStyle(isDarkMode)}>
                <span style={reportNameStyle}>{report.name}</span>
                <span style={reportStatusStyle(isDarkMode)}>{report.status}</span>
              </div>
              {report.action === 'dashboard' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <PrimaryButton
                    text={isFetching ? 'Preparing…' : 'Open dashboard'}
                    onClick={() => setActiveView('dashboard')}
                    styles={primaryButtonStyles(isDarkMode)}
                    disabled={isFetching}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionSurfaceStyle(isDarkMode)}>
        <h2 style={sectionTitleStyle}>Data feeds powering the dashboard</h2>
        <div style={dataFeedListStyle()}>
          {datasetSummaries.map(({ definition, status, updatedAt, count }) => {
            const palette = STATUS_BADGE_COLOURS[status];
            const details: string[] = [count > 0 ? `${count.toLocaleString()} record${count === 1 ? '' : 's'}` : 'No data'];
            if (updatedAt) {
              details.push(formatTimestamp(updatedAt));
            }
            return (
              <div key={definition.key} style={feedRowStyle(isDarkMode)}>
                <div style={feedLabelGroupStyle}>
                  <span style={feedLabelStyle}>{definition.name}</span>
                  <span style={feedMetaStyle}>{details.join(' • ')}</span>
                </div>
                <span style={statusPillStyle(palette, isDarkMode)}>
                  <span style={statusDotStyle(palette.dot)} />
                  {palette.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={sectionSurfaceStyle(isDarkMode)}>
        <h2 style={sectionTitleStyle}>Quick metrics snapshot</h2>
        <HomePreview
          enquiries={datasetData.enquiries}
          allMatters={datasetData.allMatters}
          wip={datasetData.wip}
          recoveredFees={datasetData.recoveredFees}
        />
      </section>
    </div>
  );
};

export default ReportingHome;