import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  FontIcon,
  type IButtonStyles,
} from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigatorActions } from '../../app/functionality/NavigatorContext';
import type { Enquiry, Matter, POID, TeamData, UserData } from '../../app/functionality/types';
import ManagementDashboard, { WIP } from './ManagementDashboard';
import AnnualLeaveReport, { AnnualLeaveRecord } from './AnnualLeaveReport';
import MetaMetricsReport from './MetaMetricsReport';
import { debugLog, debugWarn } from '../../utils/debug';
import HomePreview from './HomePreview';
import EnquiriesReport, { MarketingMetrics } from './EnquiriesReport';
import { useStreamingDatasets } from '../../hooks/useStreamingDatasets';

// Persist streaming progress across navigation
const STREAM_SNAPSHOT_KEY = 'reporting_stream_snapshot_v1';

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
  annualLeave: AnnualLeaveRecord[] | null;
  metaMetrics: MarketingMetrics[] | null;
}

const DATASETS = [
  { key: 'userData', name: 'People' },
  { key: 'teamData', name: 'Teams' },
  { key: 'enquiries', name: 'Enquiries' },
  { key: 'allMatters', name: 'Matters' },
  { key: 'wip', name: 'WIP' },
  { key: 'recoveredFees', name: 'Collected Fees' },
  { key: 'poidData', name: 'ID Submissions' },
  { key: 'annualLeave', name: 'Annual Leave' },
  { key: 'metaMetrics', name: 'Meta Metrics' },
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
  action?: 'dashboard' | 'annualLeave' | 'enquiries' | 'metaMetrics';
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
    name: 'Enquiries report',
    status: 'Live today',
    action: 'enquiries',
  },
  {
    key: 'annualLeave',
    name: 'Annual leave report',
    status: 'Live today',
    action: 'annualLeave',
  },
  {
    key: 'metaMetrics',
    name: 'Meta metrics',
    status: 'Live today',
    action: 'metaMetrics',
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
  annualLeave: null,
  metaMetrics: null,
};

let cachedData: DatasetMap = { ...EMPTY_DATASET };
let cachedTimestamp: number | null = null;

const LIGHT_BACKGROUND_COLOUR = colours.light.background;
const DARK_BACKGROUND_COLOUR = colours.dark.background;
const LIGHT_SURFACE_COLOUR = colours.light.sectionBackground;
const DARK_SURFACE_COLOUR = colours.dark.sectionBackground;

const STATUS_BADGE_COLOURS: Record<DatasetStatusValue, {
  lightBg: string;
  darkBg: string;
  dot: string;
  label: string;
  icon?: string;
}> = {
  ready: {
    lightBg: 'rgba(34, 197, 94, 0.16)',
    darkBg: 'rgba(34, 197, 94, 0.28)',
    dot: '#22c55e',
    label: 'Ready',
    icon: 'CheckMark',
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
    icon: 'WarningSolid',
  },
  idle: {
    lightBg: 'rgba(148, 163, 184, 0.16)',
    darkBg: 'rgba(148, 163, 184, 0.28)',
    dot: 'rgba(148, 163, 184, 0.7)',
    label: 'Not loaded',
    icon: 'Clock',
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

const statusIconStyle = (isDarkMode: boolean): CSSProperties => ({
  fontSize: 12,
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
});

const refreshProgressPanelStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  borderRadius: 12,
  background: isDarkMode
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.94) 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.28)' : 'rgba(59, 130, 246, 0.18)'}`,
  boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
});

const refreshProgressHeaderStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 600,
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
});

const refreshProgressDetailStyle = (isDarkMode: boolean): CSSProperties => ({
  fontSize: 12,
  color: isDarkMode ? 'rgba(226, 232, 240, 0.82)' : 'rgba(15, 23, 42, 0.72)',
  lineHeight: 1.5,
});

const refreshProgressDatasetListStyle = (): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const refreshProgressDatasetRowStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  borderRadius: 10,
  background: isDarkMode ? 'rgba(30, 41, 59, 0.65)' : 'rgba(241, 245, 249, 0.85)',
  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.28)' : 'rgba(148, 163, 184, 0.28)'}`,
  gap: 10,
});

const refreshProgressDatasetLabelStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  fontWeight: 600,
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
});

const refreshProgressDatasetStatusStyle = (isDarkMode: boolean): CSSProperties => ({
  fontSize: 11,
  fontWeight: 600,
  color: isDarkMode ? 'rgba(226, 232, 240, 0.74)' : 'rgba(15, 23, 42, 0.64)',
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

// Convert Clio current week data to WIP format for Management Dashboard
function convertClioToWipFormat(clioData: any, teamData: any[], currentUserData: any[]): WIP[] {
  if (!clioData || !currentUserData?.[0]) return [];
  
  const wipEntries: WIP[] = [];
  const currentWeek = clioData.current_week;
  const currentUser = currentUserData[0];
  const currentUserClioId = currentUser['Clio ID'] ? parseInt(currentUser['Clio ID'], 10) : null;
  
  if (!currentUserClioId || !currentWeek?.daily_data) return [];
  
  // Iterate through each day in current week
  Object.entries(currentWeek.daily_data).forEach(([date, dayData]: [string, any]) => {
    if (dayData && typeof dayData === 'object' && dayData.total_hours > 0) {
      // Create a WIP entry for this day and the current user
      wipEntries.push({
        created_at: `${date}T00:00:00`, // Use the date from Clio
        total: dayData.total_amount || 0,
        quantity_in_hours: dayData.total_hours || 0,
        user_id: currentUserClioId,
      });
    }
  });
  
  return wipEntries;
}

const formatDurationMs = (ms: number): string => {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const REFRESH_PHASES: Array<{ thresholdMs: number; label: string }> = [
  { thresholdMs: 15000, label: 'Connecting to reporting data sources…' },
  { thresholdMs: 45000, label: 'Pulling the latest matters and enquiries…' },
  { thresholdMs: 90000, label: 'Crunching reporting metrics…' },
  { thresholdMs: Number.POSITIVE_INFINITY, label: 'Finalising dashboard views…' },
];

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
  const [activeView, setActiveView] = useState<'overview' | 'dashboard' | 'annualLeave' | 'enquiries' | 'metaMetrics'>('overview');
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
    annualLeave: cachedData.annualLeave,
    metaMetrics: cachedData.metaMetrics,
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
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(() => Boolean(cachedTimestamp));
  const [refreshStartedAt, setRefreshStartedAt] = useState<number | null>(null);

  // Prepare list of datasets to stream (stable identity across re-renders)
  const streamableDatasets = useMemo(
    () => MANAGEMENT_DATASET_KEYS.filter(key => key !== 'annualLeave' && key !== 'metaMetrics'),
    []
  );

  // Add streaming datasets hook
  const {
    datasets: streamingDatasets,
    isConnected: isStreamingConnected,
    isComplete: isStreamingComplete,
    start: startStreaming,
    stop: stopStreaming,
    progress: streamingProgress,
  } = useStreamingDatasets({
    datasets: streamableDatasets,
    entraId: propUserData?.[0]?.EntraID,
    bypassCache: false, // We'll control this via button
    autoStart: false,
  });

  // Restore in-progress streaming state on mount and auto-resume if not complete
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STREAM_SNAPSHOT_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      if (snap && snap.statuses) {
        setDatasetStatus(prev => ({
          ...prev,
          ...snap.statuses,
        }));
      }
      if (snap && snap.isComplete === false) {
        setIsFetching(true);
        setRefreshStartedAt(Date.now());
        // Ensure non-streaming datasets also refresh once during resume
        // Mark them as loading if not present
        setDatasetStatus(prev => ({
          ...prev,
          annualLeave: { status: 'loading', updatedAt: prev.annualLeave?.updatedAt ?? null },
          metaMetrics: { status: 'loading', updatedAt: prev.metaMetrics?.updatedAt ?? null },
        }));
        // Kick off non-streaming fetchers in parallel
        (async () => {
          try {
            const [annualLeaveResponse, meta] = await Promise.all([
              fetch('/api/attendance/annual-leave-all', {
                method: 'GET',
                credentials: 'include',
                headers: { Accept: 'application/json' },
              }),
              fetchMetaMetrics(),
            ]);

            let annualLeaveData: AnnualLeaveRecord[] = [];
            if (annualLeaveResponse.ok) {
              try {
                const payload = await annualLeaveResponse.json();
                if (payload.success && payload.all_data) {
                  annualLeaveData = payload.all_data.map((record: any) => ({
                    request_id: record.request_id,
                    fe: record.person,
                    start_date: record.start_date,
                    end_date: record.end_date,
                    reason: record.reason,
                    status: record.status,
                    days_taken: record.days_taken,
                    leave_type: record.leave_type,
                    rejection_notes: record.rejection_notes,
                    hearing_confirmation: record.hearing_confirmation,
                    hearing_details: record.hearing_details,
                  }));
                }
              } catch {/* ignore parse errors */}
            }

            const now = Date.now();
            setDatasetData(prev => ({
              ...prev,
              annualLeave: annualLeaveData,
              metaMetrics: meta,
            }));
            setDatasetStatus(prev => ({
              ...prev,
              annualLeave: { status: 'ready', updatedAt: now },
              metaMetrics: { status: 'ready', updatedAt: now },
            }));
            cachedData = { ...cachedData, annualLeave: annualLeaveData, metaMetrics: meta };
            cachedTimestamp = now;
            setLastRefreshTimestamp(now);
          } catch {/* ignore resume fetch errors */}
        })();
        startStreaming();
      }
    } catch {/* ignore */}
  // startStreaming is stable from hook; using it is intentional
  }, [startStreaming]);

  // Persist streaming status snapshot whenever it changes
  useEffect(() => {
    try {
      const statuses: Partial<DatasetStatus> = {} as Partial<DatasetStatus>;
      Object.entries(streamingDatasets).forEach(([name, state]) => {
        statuses[name as keyof DatasetStatus] = {
          status: state.status,
          updatedAt: state.updatedAt || null,
        } as any;
      });
      const snapshot = {
        statuses,
        isComplete: isStreamingComplete,
        ts: Date.now(),
      };
      sessionStorage.setItem(STREAM_SNAPSHOT_KEY, JSON.stringify(snapshot));
      if (isStreamingComplete) {
        // Clear snapshot once complete to avoid stale resumes later
        sessionStorage.removeItem(STREAM_SNAPSHOT_KEY);
      }
    } catch {/* ignore */}
  }, [streamingDatasets, isStreamingComplete]);

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
  } else if (activeView === 'annualLeave') {
      setContent(
        <div style={dashboardNavigatorStyle(isDarkMode)}>
          <DefaultButton
            text="Back to overview"
            iconProps={{ iconName: 'Back' }}
            onClick={handleBackToOverview}
            styles={dashboardNavigatorButtonStyles(isDarkMode)}
          />
          <span style={dashboardNavigatorTitleStyle(isDarkMode)}>Annual leave report</span>
        </div>,
      );
    } else if (activeView === 'enquiries') {
      setContent(
        <div style={dashboardNavigatorStyle(isDarkMode)}>
          <DefaultButton
            text="Back to overview"
            iconProps={{ iconName: 'Back' }}
            onClick={handleBackToOverview}
            styles={dashboardNavigatorButtonStyles(isDarkMode)}
          />
          <span style={dashboardNavigatorTitleStyle(isDarkMode)}>Enquiries report</span>
        </div>,
      );
    } else {
      setContent(null);
    }

    return () => {
      setContent(null);
    };
  }, [activeView, handleBackToOverview, isDarkMode, setContent]);

  // Marketing metrics fetching function
  const fetchMetaMetrics = useCallback(async (): Promise<MarketingMetrics[]> => {
    debugLog('ReportingHome: fetchMetaMetrics called');
    
    try {
      // Use our Express server route for live Facebook data with daily breakdown
      const url = `/api/marketing-metrics?daysBack=30`; // Get last 30 days of daily data
      debugLog('ReportingHome: Fetching meta metrics from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Meta metrics fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        debugWarn('ReportingHome: Meta metrics API returned error:', result.error);
        return [];
      }
      
      // The API now returns an array of daily metrics
      const dailyMetrics = result.data;
      
      if (!Array.isArray(dailyMetrics)) {
        debugWarn('ReportingHome: Expected array of daily metrics, got:', typeof dailyMetrics);
        return [];
      }
      
      debugLog('ReportingHome: Meta metrics fetched successfully. Days included:', dailyMetrics.length);
      debugLog('ReportingHome: Date range:', result.dataSource, result.dateRange);
      
      return dailyMetrics; // Return the array directly as it's already in the correct format
      
    } catch (error) {
      console.error('ReportingHome: Meta metrics fetch error:', error);
      debugWarn('ReportingHome: Failed to fetch meta metrics:', error);
      // Return empty array on error to prevent blocking the dashboard
      return [];
    }
  }, []);

  // Enhanced refresh function with streaming support
  const refreshDatasetsWithStreaming = useCallback(async () => {
    debugLog('ReportingHome: refreshDatasetsWithStreaming called');
    setHasFetchedOnce(true);
    setIsFetching(true);
    setError(null);
    setRefreshStartedAt(Date.now());

    // Initialize all dataset statuses to loading
    setDatasetStatus((prev) => {
      const next: DatasetStatus = { ...prev };
      MANAGEMENT_DATASET_KEYS.forEach((key) => {
        const previousMeta = prev[key];
        next[key] = { status: 'loading', updatedAt: previousMeta?.updatedAt ?? null };
      });
      return next;
    });

    try {
      // Start streaming for main datasets
  console.log('🌊 Starting streaming with datasets:', streamableDatasets);
      console.log('🌊 EntraID for streaming:', propUserData?.[0]?.EntraID);
      startStreaming();

      // Fetch annual leave and meta metrics in parallel (not streamable yet)
      const [annualLeaveResponse, metaMetrics] = await Promise.all([
        fetch('/api/attendance/annual-leave-all', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
        fetchMetaMetrics()
      ]);

      // Handle annual leave response
      let annualLeaveData: AnnualLeaveRecord[] = [];
      if (annualLeaveResponse.ok) {
        try {
          const annualLeavePayload = await annualLeaveResponse.json();
          if (annualLeavePayload.success && annualLeavePayload.all_data) {
            annualLeaveData = annualLeavePayload.all_data.map((record: any) => ({
              request_id: record.request_id,
              fe: record.person,
              start_date: record.start_date,
              end_date: record.end_date,
              reason: record.reason,
              status: record.status,
              days_taken: record.days_taken,
              leave_type: record.leave_type,
              rejection_notes: record.rejection_notes,
              hearing_confirmation: record.hearing_confirmation,
              hearing_details: record.hearing_details,
            }));
          }
        } catch (annualLeaveError) {
          debugWarn('Failed to parse annual leave data:', annualLeaveError);
        }
      }

      // Update non-streaming datasets
      setDatasetData(prev => ({
        ...prev,
        annualLeave: annualLeaveData,
        metaMetrics: metaMetrics,
      }));

      // Update status for non-streaming datasets
      const now = Date.now();
      setDatasetStatus(prev => ({
        ...prev,
        annualLeave: { status: 'ready', updatedAt: now },
        metaMetrics: { status: 'ready', updatedAt: now },
      }));

      cachedTimestamp = now;
      setLastRefreshTimestamp(now);

    } catch (fetchError) {
      debugWarn('Failed to refresh non-streaming datasets:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
    } finally {
      setIsFetching(false);
      setRefreshStartedAt(null);
    }
  }, [startStreaming, fetchMetaMetrics, streamableDatasets]);

  // Sync streaming dataset updates with local state
  useEffect(() => {
    Object.entries(streamingDatasets).forEach(([datasetName, datasetState]) => {
      if (datasetState.status === 'ready' && datasetState.data) {
        // Update dataset data
        setDatasetData(prev => ({
          ...prev,
          [datasetName]: datasetState.data,
        }));

        // Update dataset status
        setDatasetStatus(prev => ({
          ...prev,
          [datasetName]: {
            status: 'ready',
            updatedAt: datasetState.updatedAt || Date.now(),
          },
        }));

        // Update cache
        cachedData = { ...cachedData, [datasetName]: datasetState.data };
        if (datasetState.updatedAt) {
          cachedTimestamp = datasetState.updatedAt;
          setLastRefreshTimestamp(datasetState.updatedAt);
        }
      } else if (datasetState.status === 'error') {
        // Update error status
        setDatasetStatus(prev => ({
          ...prev,
          [datasetName]: {
            status: 'error',
            updatedAt: datasetState.updatedAt || Date.now(),
          },
        }));
      }
    });
  }, [streamingDatasets]);

  // Handle streaming completion
  useEffect(() => {
    if (isStreamingComplete) {
      setIsFetching(false);
    }
  }, [isStreamingComplete]);

  const refreshDatasets = useCallback(async () => {
    debugLog('ReportingHome: refreshDatasets called');
    setHasFetchedOnce(true);
    setIsFetching(true);
    setError(null);
    setRefreshStartedAt(Date.now());

    setDatasetStatus((prev) => {
      const next: DatasetStatus = { ...prev };
      MANAGEMENT_DATASET_KEYS.forEach((key) => {
        const previousMeta = prev[key];
        next[key] = { status: 'loading', updatedAt: previousMeta?.updatedAt ?? null };
      });
      return next;
    });

    try {
      // Fetch both management datasets, annual leave data, and marketing metrics in parallel
      debugLog('ReportingHome: Starting parallel fetch calls...');
      const [managementResponse, annualLeaveResponse, metaMetrics] = await Promise.all([
        (async () => {
          const url = new URL(REPORTING_ENDPOINT, window.location.origin);
          // Include current week Clio data in addition to standard datasets
          // Exclude userData from fetch (we get it from props) and annualLeave (fetched separately)
          const allDatasets = [
            ...MANAGEMENT_DATASET_KEYS.filter(key => key !== 'annualLeave' && key !== 'userData'), 
            'wipClioCurrentWeek'
          ];
          debugLog('ReportingHome: Requesting datasets:', allDatasets);
          url.searchParams.set('datasets', allDatasets.join(','));
          
          // Management Dashboard needs all team data, not user-specific data
          // Don't pass entraId to get team-wide WIP data instead of filtered user data
          
          // Force a fresh fetch when user clicks Refresh
          url.searchParams.set('bypassCache', 'true');

          return fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
            headers: { Accept: 'application/json' },
          });
        })(),
        // Fetch annual leave data
        fetch('/api/attendance/annual-leave-all', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
        // Fetch marketing metrics
        fetchMetaMetrics()
      ]);

      if (!managementResponse.ok) {
        const text = await managementResponse.text().catch(() => '');
        throw new Error(`Failed to fetch datasets: ${managementResponse.status} ${managementResponse.statusText}${text ? ` – ${text.slice(0, 160)}` : ''}`);
      }

      const managementContentType = managementResponse.headers.get('content-type') || '';
      if (!managementContentType.toLowerCase().includes('application/json')) {
        const body = await managementResponse.text().catch(() => '');
        throw new Error(`Unexpected response (not JSON). Content-Type: ${managementContentType || 'unknown'} – ${body.slice(0, 160)}`);
      }

      const managementPayload = (await managementResponse.json()) as Partial<DatasetMap> & { 
        errors?: Record<string, string>;
        wipClioCurrentWeek?: any;
        wipCurrentAndLastWeek?: any;
      };

      // Handle annual leave response
      let annualLeaveData: AnnualLeaveRecord[] = [];
      if (annualLeaveResponse.ok) {
        try {
          const annualLeavePayload = await annualLeaveResponse.json();
          if (annualLeavePayload.success && annualLeavePayload.all_data) {
            annualLeaveData = annualLeavePayload.all_data.map((record: any) => ({
              request_id: record.request_id,
              fe: record.person,
              start_date: record.start_date,
              end_date: record.end_date,
              reason: record.reason,
              status: record.status,
              days_taken: record.days_taken,
              leave_type: record.leave_type,
              rejection_notes: record.rejection_notes,
              hearing_confirmation: record.hearing_confirmation,
              hearing_details: record.hearing_details,
            }));
          }
        } catch (annualLeaveError) {
          debugWarn('Failed to parse annual leave data:', annualLeaveError);
        }
      }

      // Merge current week Clio data with historical WIP data
      let mergedWip = managementPayload.wip ?? cachedData.wip;
      // wipClioCurrentWeek now returns { current_week: { activities: [...] }, last_week: {...} }
      const clioCurrentWeek = managementPayload.wipClioCurrentWeek;
      
      if (clioCurrentWeek?.current_week?.activities && Array.isArray(clioCurrentWeek.current_week.activities) && mergedWip && Array.isArray(mergedWip)) {
        const clioWipEntries = clioCurrentWeek.current_week.activities;
        
        debugLog('📊 Merging Clio current week into WIP:', { 
          clioEntries: clioWipEntries.length, 
          historicalWip: mergedWip.length,
          clioWipSample: clioWipEntries.slice(0, 3).map((e: any) => ({ 
            date: e.date, 
            user_id: e.user_id, 
            hours: e.quantity_in_hours 
          }))
        });
        
        // Merge raw activities (with user_id preserved) into WIP array
        mergedWip = [...mergedWip, ...clioWipEntries];
      }

      const nextData: DatasetMap = {
        userData: propUserData ?? cachedData.userData, // Use prop, not fetched data
        teamData: managementPayload.teamData ?? cachedData.teamData,
        enquiries: managementPayload.enquiries ?? cachedData.enquiries,
        allMatters: managementPayload.allMatters ?? cachedData.allMatters,
        wip: mergedWip,
        recoveredFees: managementPayload.recoveredFees ?? cachedData.recoveredFees,
        poidData: managementPayload.poidData ?? cachedData.poidData,
        annualLeave: annualLeaveData,
        metaMetrics: metaMetrics, // Use fetched meta metrics
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

      if (managementPayload.errors && Object.keys(managementPayload.errors).length > 0) {
        setError('Some datasets were unavailable.');
      }
    } catch (fetchError) {
      debugWarn('Failed to refresh reporting datasets:', fetchError);
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
      setRefreshStartedAt(null);
    }
  }, []);

  const handleOpenDashboard = useCallback(() => {
    if (!hasFetchedOnce && !isFetching) {
      void refreshDatasetsWithStreaming(); // Use streaming version
    }
    setActiveView('dashboard');
  }, [hasFetchedOnce, isFetching, refreshDatasetsWithStreaming, setActiveView]);

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
      // Check if this dataset is being streamed
      const streamingState = streamingDatasets[dataset.key];
      const useStreamingState = streamingState && (isStreamingConnected || streamingState.status !== 'idle');

      const value = useStreamingState ? streamingState.data : datasetData[dataset.key];
      const meta = useStreamingState 
        ? { status: streamingState.status, updatedAt: streamingState.updatedAt }
        : datasetStatus[dataset.key];

      const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
      const status: DatasetStatusValue = meta.status === 'loading'
        ? 'loading'
        : hasValue
          ? 'ready'
          : meta.status;
      const count = useStreamingState ? (streamingState.count || 0) : (Array.isArray(value) ? value.length : hasValue ? 1 : 0);
      const cached = useStreamingState ? streamingState.cached : false;
      
      return {
        definition: dataset,
        status,
        updatedAt: meta.updatedAt,
        count,
        cached,
      };
    })
  ), [datasetData, datasetStatus, streamingDatasets, isStreamingConnected]);

  const refreshElapsedMs = useMemo(
    () => (refreshStartedAt ? currentTime.getTime() - refreshStartedAt : 0),
    [currentTime, refreshStartedAt],
  );

  const refreshPhaseLabel = useMemo(() => {
    if (!isFetching || !refreshStartedAt) {
      return null;
    }
    const phase = REFRESH_PHASES.find((candidate) => refreshElapsedMs < candidate.thresholdMs);
    return phase?.label ?? 'Finalising reporting data…';
  }, [isFetching, refreshElapsedMs, refreshStartedAt]);

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
    ? (refreshPhaseLabel ?? 'Refreshing')
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
          annualLeave={datasetData.annualLeave}
          triggerRefresh={refreshDatasetsWithStreaming}
          lastRefreshTimestamp={lastRefreshTimestamp ?? undefined}
          isFetching={isFetching}
        />
      </div>
    );
  }

  if (activeView === 'annualLeave') {
    return (
      <div style={fullScreenWrapperStyle(isDarkMode)}>
        <AnnualLeaveReport
          data={datasetData.annualLeave || []}
          teamData={datasetData.teamData || []}
          triggerRefresh={refreshDatasetsWithStreaming}
          lastRefreshTimestamp={lastRefreshTimestamp ?? undefined}
          isFetching={isFetching}
        />
      </div>
    );
  }

  if (activeView === 'enquiries') {
    return (
      <div style={fullScreenWrapperStyle(isDarkMode)}>
        <EnquiriesReport 
          enquiries={datasetData.enquiries} 
          teamData={datasetData.teamData}
          annualLeave={datasetData.annualLeave}
          metaMetrics={datasetData.metaMetrics}
          triggerRefresh={refreshDatasetsWithStreaming}
          lastRefreshTimestamp={lastRefreshTimestamp ?? undefined}
          isFetching={isFetching}
        />
      </div>
    );
  }

  if (activeView === 'metaMetrics') {
    return (
      <div style={fullScreenWrapperStyle(isDarkMode)}>
        <MetaMetricsReport
          metaMetrics={datasetData.metaMetrics}
          enquiries={datasetData.enquiries}
          triggerRefresh={refreshDatasetsWithStreaming}
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
            onClick={handleOpenDashboard}
            styles={primaryButtonStyles(isDarkMode)}
            disabled={isFetching}
          />
          <DefaultButton
            text={isFetching ? 'Refreshing…' : 'Refresh data'}
            onClick={refreshDatasetsWithStreaming}
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
        {(isFetching || isStreamingConnected) && (
          <div style={refreshProgressPanelStyle(isDarkMode)}>
            <div style={refreshProgressHeaderStyle(isDarkMode)}>
              <Spinner size={SpinnerSize.small} />
              <span>
                {isStreamingConnected 
                  ? `Streaming datasets… (${streamingProgress.completed}/${streamingProgress.total})`
                  : 'Refreshing reporting datasets…'
                }
              </span>
            </div>
            <span style={refreshProgressDetailStyle(isDarkMode)}>
              {refreshStartedAt && !isStreamingConnected
                ? `Elapsed ${formatDurationMs(refreshElapsedMs)}${refreshPhaseLabel ? ` • ${refreshPhaseLabel}` : ''}`
                : isStreamingConnected
                  ? `Progress: ${Math.round(streamingProgress.percentage)}% • Redis caching active`
                  : 'Preparing data sources…'}
            </span>
            <div style={refreshProgressDatasetListStyle()}>
              {datasetSummaries.map(({ definition, status }) => {
                const palette = STATUS_BADGE_COLOURS[status];
                const iconName = palette.icon;
                return (
                  <div key={definition.key} style={refreshProgressDatasetRowStyle(isDarkMode)}>
                    <span style={refreshProgressDatasetLabelStyle(isDarkMode)}>
                      {status === 'loading' ? (
                        <Spinner size={SpinnerSize.xSmall} style={{ width: 16, height: 16 }} />
                      ) : iconName ? (
                        <FontIcon iconName={iconName} style={statusIconStyle(isDarkMode)} />
                      ) : (
                        <span style={statusDotStyle(palette.dot)} />
                      )}
                      {definition.name}
                    </span>
                    <span style={refreshProgressDatasetStatusStyle(isDarkMode)}>{palette.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                    onClick={handleOpenDashboard}
                    styles={primaryButtonStyles(isDarkMode)}
                    disabled={isFetching}
                  />
                </div>
              )}
              {report.action === 'annualLeave' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <PrimaryButton
                    text={isFetching ? 'Preparing…' : 'Open annual leave report'}
                    onClick={() => setActiveView('annualLeave')}
                    styles={primaryButtonStyles(isDarkMode)}
                    disabled={isFetching}
                  />
                </div>
              )}
              {report.action === 'enquiries' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <PrimaryButton
                    text={isFetching ? 'Preparing…' : 'Open enquiries report'}
                    onClick={() => setActiveView('enquiries')}
                    styles={primaryButtonStyles(isDarkMode)}
                    disabled={isFetching}
                  />
                </div>
              )}
              {report.action === 'metaMetrics' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <PrimaryButton
                    text={isFetching ? 'Preparing…' : 'Open Meta metrics'}
                    onClick={() => setActiveView('metaMetrics')}
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
          {datasetSummaries.map(({ definition, status, updatedAt, count, cached }) => {
            const palette = STATUS_BADGE_COLOURS[status];
            const details: string[] = [count > 0 ? `${count.toLocaleString()} record${count === 1 ? '' : 's'}` : 'No data'];
            if (cached) {
              details.push('cached');
            }
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
                  {status === 'loading' ? (
                    <Spinner size={SpinnerSize.xSmall} style={{ width: 14, height: 14 }} />
                  ) : palette.icon ? (
                    <FontIcon iconName={palette.icon} style={statusIconStyle(isDarkMode)} />
                  ) : (
                    <span style={statusDotStyle(palette.dot)} />
                  )}
                  {cached && (
                    <FontIcon
                      iconName="Database"
                      style={{ ...statusIconStyle(isDarkMode), marginLeft: 6 }}
                      title="Cached"
                    />
                  )}
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