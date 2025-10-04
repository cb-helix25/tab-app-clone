import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatePicker,
  DayOfWeek,
  DefaultButton,
  Icon,
  type IButtonStyles,
  type IDatePickerStyles,
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import type { Enquiry, TeamData } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import './ManagementDashboard.css';
import { getNormalizedEnquirySourceLabel } from '../../utils/enquirySource';

interface EnquiriesReportProps {
  enquiries: Enquiry[] | null;
  teamData?: TeamData[] | null;
  triggerRefresh?: () => void;
  lastRefreshTimestamp?: number;
  isFetching?: boolean;
}

const EMPTY_DAY_FILTER = { name: '', poc: '', taker: '', status: '' } as const;

type RangeKey =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'week'
  | 'lastWeek'
  | 'month'
  | 'lastMonth'
  | 'last90Days'
  | 'quarter'
  | 'yearToDate'
  | 'year'
  | 'custom';

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'month', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'last90Days', label: 'Last 90 Days' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'yearToDate', label: 'Year To Date' },
  { key: 'year', label: 'Current Year' },
];

const ROLE_OPTIONS = [
  { key: 'Partner', label: 'Partner' },
  { key: 'Associate Solicitor', label: 'Associate' },
  { key: 'Solicitor', label: 'Solicitor' },
  { key: 'Paralegal', label: 'Paralegal' },
  { key: 'Ops', label: 'Ops' },
  { key: 'Inactive', label: 'Inactive' },
] as const;

interface TeamMember {
  initials: string;
  display: string;
  role?: string;
  isActive: boolean;
  record: TeamData;
  email?: string;
  normalizedName: string;
}

interface EnrichedEnquiry {
  enquiry: Enquiry;
  member?: TeamMember;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const candidate = new Date(String(value));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function getInitials(input: string): string {
  const s = (input || '').trim();
  if (!s) return '?';
  let tokens: string[] = [];
  if (s.includes('@')) {
    const local = s.split('@')[0] || '';
    tokens = local.split(/[^a-zA-Z]+/).filter(Boolean);
  } else {
    tokens = s.split(/\s+/).filter(Boolean);
  }
  if (tokens.length === 0) return '?';
  const first = tokens[0][0] || '';
  const last = tokens.length > 1 ? tokens[tokens.length - 1][0] : tokens[0][1] || '';
  const initials = (first + last).toUpperCase();
  return initials || '?';
}

const NAME_MAP: Record<string, string> = {
  'Samuel Packwood': 'Sam Packwood',
  'Bianca ODonnell': "Bianca O'Donnell",
};

const normalizeName = (name?: string | null): string =>
  typeof name === 'string' ? name.replace(/[^a-zA-Z]/g, '').toLowerCase() : '';

const mapNameIfNeeded = (name?: string | null): string => {
  if (!name) return '';
  return NAME_MAP[name] ?? name;
};

const displayName = (record?: TeamData | null): string => {
  if (!record) return 'Unknown';
  return (
    record['Nickname'] ||
    record['Full Name'] ||
    record['First'] ||
    record['Last'] ||
    record['Initials'] ||
    'Unknown'
  );
};

const getDatePickerStyles = (isDarkMode: boolean): Partial<IDatePickerStyles> => {
  const baseBorder = isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.18)';
  const hoverBorder = isDarkMode ? 'rgba(135, 206, 255, 0.5)' : 'rgba(54, 144, 206, 0.4)';
  const focusBorder = isDarkMode ? '#87ceeb' : colours.highlight;
  const backgroundColour = isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  const hoverBackground = isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 1)';
  const focusBackground = isDarkMode ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)';

  return {
    root: {
      maxWidth: 220,
      '.ms-DatePicker': {
        fontFamily: 'Raleway, sans-serif !important',
      },
    },
    textField: {
      root: {
        fontFamily: 'Raleway, sans-serif !important',
        width: '100% !important',
      },
      fieldGroup: {
        height: '36px !important',
        borderRadius: '8px !important',
        border: `1px solid ${baseBorder} !important`,
        background: `${backgroundColour} !important`,
        padding: '0 14px !important',
        boxShadow: isDarkMode
          ? '0 2px 4px rgba(0, 0, 0, 0.2) !important'
          : '0 1px 3px rgba(15, 23, 42, 0.08) !important',
        transition: 'all 0.2s ease !important',
        selectors: {
          ':hover': {
            border: `1px solid ${hoverBorder} !important`,
            background: `${hoverBackground} !important`,
            boxShadow: isDarkMode
              ? '0 4px 8px rgba(0, 0, 0, 0.25) !important'
              : '0 2px 6px rgba(15, 23, 42, 0.12) !important',
          },
          ':focus-within': {
            border: `1px solid ${focusBorder} !important`,
            background: `${focusBackground} !important`,
            boxShadow: isDarkMode
              ? '0 2px 4px rgba(135, 206, 255, 0.12) !important'
              : '0 2px 6px rgba(54, 144, 206, 0.15) !important',
          },
        },
      },
      field: {
        fontSize: '14px !important',
        fontFamily: 'Raleway, sans-serif !important',
        fontWeight: '500 !important',
        background: 'transparent !important',
        lineHeight: '20px !important',
        border: 'none !important',
        outline: 'none !important',
      },
    },
    icon: {
      color: `${isDarkMode ? colours.highlight : colours.missedBlue} !important`,
      fontSize: '16px !important',
      fontWeight: 'bold !important',
    },
    callout: {
      fontSize: '14px !important',
      borderRadius: '12px !important',
      border: `1px solid ${baseBorder} !important`,
      boxShadow: isDarkMode
        ? '0 8px 24px rgba(0, 0, 0, 0.4) !important'
        : '0 6px 20px rgba(15, 23, 42, 0.15) !important',
    },
    wrapper: {
      borderRadius: '12px !important',
    },
  };
};

const getRangeButtonStyles = (
  isDarkMode: boolean,
  active: boolean,
  disabled: boolean = false,
): IButtonStyles => {
  const activeBackground = colours.highlight;
  const inactiveBackground = isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'transparent';

  const resolvedBackground = disabled
    ? isDarkMode
      ? 'rgba(15, 23, 42, 0.8)'
      : 'transparent'
    : active
      ? activeBackground
      : inactiveBackground;

  const resolvedBorder = active
    ? `1px solid ${isDarkMode ? 'rgba(135, 176, 255, 0.5)' : 'rgba(13, 47, 96, 0.32)'}`
    : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`;

  const resolvedColor = disabled
    ? isDarkMode
      ? '#E2E8F0'
      : colours.missedBlue
    : active
      ? '#ffffff'
      : isDarkMode
        ? '#E2E8F0'
        : colours.missedBlue;

  return {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      borderRadius: 999,
      border: resolvedBorder,
      padding: '0 12px',
      minHeight: 32,
      height: 32,
      fontWeight: 600,
      fontSize: 13,
      color: resolvedColor,
      background: resolvedBackground,
      boxShadow: active && !disabled ? '0 2px 8px rgba(54, 144, 206, 0.25)' : 'none',
      fontFamily: 'Raleway, sans-serif',
      cursor: disabled ? 'default' : 'pointer',
      transition: 'all 0.2s ease',
    },
    rootHovered: {
      background: disabled
        ? resolvedBackground
        : active
          ? '#2f7cb3'
          : isDarkMode
            ? 'rgba(148, 163, 184, 0.24)'
            : 'rgba(54, 144, 206, 0.12)',
    },
    rootPressed: {
      background: disabled
        ? resolvedBackground
        : active
          ? '#266795'
          : isDarkMode
            ? 'rgba(148, 163, 184, 0.3)'
            : 'rgba(54, 144, 206, 0.16)',
    },
  };
};

const getTeamButtonStyles = (
  isDarkMode: boolean,
  active: boolean,
  hasEnquiries: boolean = true,
): IButtonStyles => {
  const activeBackground = active
    ? `linear-gradient(135deg, ${colours.highlight} 0%, #2f7cb3 100%)`
    : isDarkMode
      ? 'rgba(15, 23, 42, 0.8)'
      : 'transparent';

  const activeBorder = active
    ? `2px solid ${isDarkMode ? '#87ceeb' : colours.highlight}`
    : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`;

  const greyedOut = !hasEnquiries;
  const opacity = greyedOut ? 0.4 : 1;
  const textColor = active
    ? '#ffffff'
    : greyedOut
      ? isDarkMode
        ? '#64748B'
        : '#94A3B8'
      : isDarkMode
        ? '#E2E8F0'
        : colours.missedBlue;

  return {
    root: {
      borderRadius: 999,
      minHeight: 32,
      height: 32,
      padding: '0 8px',
      fontWeight: active ? 700 : 600,
      fontSize: 12,
      border: activeBorder,
      background: activeBackground,
      color: textColor,
      opacity,
      boxShadow: active
        ? isDarkMode
          ? '0 2px 8px rgba(54, 144, 206, 0.3)'
          : '0 2px 8px rgba(54, 144, 206, 0.25)'
        : 'none',
      fontFamily: 'Raleway, sans-serif',
      transform: active ? 'translateY(-1px)' : 'none',
      transition: 'all 0.2s ease',
    },
    rootHovered: {
      background: active
        ? 'linear-gradient(135deg, #2f7cb3 0%, #266795 100%)'
        : isDarkMode
          ? 'rgba(15, 23, 42, 0.86)'
          : 'rgba(54, 144, 206, 0.1)',
      transform: 'translateY(-1px)',
      boxShadow: active
        ? isDarkMode
          ? '0 4px 12px rgba(54, 144, 206, 0.4)'
          : '0 4px 12px rgba(54, 144, 206, 0.35)'
        : isDarkMode
          ? '0 2px 4px rgba(0, 0, 0, 0.1)'
          : '0 2px 4px rgba(15, 23, 42, 0.05)',
    },
    rootPressed: {
      background: active
        ? 'linear-gradient(135deg, #266795 0%, #1e5a7a 100%)'
        : isDarkMode
          ? 'rgba(15, 23, 42, 0.9)'
          : 'rgba(54, 144, 206, 0.14)',
      transform: 'translateY(0)',
    },
  };
};

const getRoleButtonStyles = (isDarkMode: boolean, active: boolean, hasData: boolean = true): IButtonStyles => {
  const activeBackground = active
    ? `linear-gradient(135deg, ${colours.highlight} 0%, #2f7cb3 100%)`
    : isDarkMode
      ? 'rgba(15, 23, 42, 0.8)'
      : 'transparent';

  const activeBorder = active
    ? `2px solid ${isDarkMode ? '#87ceeb' : colours.highlight}`
    : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`;

  const textColor = active
    ? '#ffffff'
    : hasData
      ? (isDarkMode ? '#E2E8F0' : colours.missedBlue)
      : (isDarkMode ? '#64748B' : '#94A3B8');
  const opacity = hasData ? 1 : 0.55;

  return {
    root: {
      borderRadius: 999,
      minHeight: 32,
      height: 32,
      padding: '0 12px',
      fontWeight: active ? 700 : 600,
      fontSize: 12,
      border: activeBorder,
      background: activeBackground,
      color: textColor,
      opacity,
      boxShadow: active
        ? isDarkMode
          ? '0 2px 8px rgba(54, 144, 206, 0.3)'
          : '0 2px 8px rgba(54, 144, 206, 0.25)'
        : 'none',
      fontFamily: 'Raleway, sans-serif',
      transform: active ? 'translateY(-1px)' : 'none',
      transition: 'all 0.2s ease',
    },
    rootHovered: {
      background: active
        ? 'linear-gradient(135deg, #2f7cb3 0%, #266795 100%)'
        : isDarkMode
          ? 'rgba(15, 23, 42, 0.86)'
          : 'rgba(54, 144, 206, 0.1)',
      transform: hasData ? 'translateY(-1px)' : 'none',
      opacity: hasData ? 1 : opacity,
      boxShadow: active
        ? isDarkMode
          ? '0 4px 12px rgba(54, 144, 206, 0.4)'
          : '0 4px 12px rgba(54, 144, 206, 0.35)'
        : isDarkMode
          ? '0 2px 4px rgba(0, 0, 0, 0.1)'
          : '0 2px 4px rgba(15, 23, 42, 0.05)',
    },
    rootPressed: {
      background: active
        ? 'linear-gradient(135deg, #266795 0%, #1e5a7a 100%)'
        : isDarkMode
          ? 'rgba(15, 23, 42, 0.9)'
          : 'rgba(54, 144, 206, 0.14)',
      transform: hasData ? 'translateY(0)' : 'none',
    },
  };
};

const clearFilterButtonStyle = (isDarkMode: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 12px',
  height: 32,
  borderRadius: 8,
  border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)'}`,
  background: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(254, 242, 242, 0.85)',
  color: isDarkMode ? '#fca5a5' : '#dc2626',
  gap: 6,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: 'nowrap',
});

const dateStampButtonStyle = (isDarkMode: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 2,
  padding: '8px 12px',
  borderRadius: 10,
  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`,
  background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
  minWidth: 120,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
});

const computeRange = (range: RangeKey): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start.setTime(yesterday.getTime());
      start.setHours(0, 0, 0, 0);
      end.setTime(yesterday.getTime());
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'week': {
      const day = now.getDay();
      const diff = (day + 6) % 7;
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'lastWeek': {
      const day = now.getDay();
      const diff = (day + 6) % 7;
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - diff);
      thisWeekStart.setHours(0, 0, 0, 0);

      start.setTime(thisWeekStart.getTime());
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'lastMonth': {
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'last90Days':
      start.setDate(now.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterStart, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'yearToDate': {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      if (currentMonth >= 3) {
        start.setFullYear(currentYear, 3, 1);
      } else {
        start.setFullYear(currentYear - 1, 3, 1);
      }
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'year':
      start.setFullYear(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      return { start: new Date(now), end: new Date(now) };
    case 'all':
    default:
      return { start: new Date(0), end };
  }

  return { start, end };
};

const normalizeRange = (input: { start: Date; end: Date }): { start: Date; end: Date } => {
  const start = new Date(input.start);
  const end = new Date(input.end);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const quickRanges: Array<{ key: RangeKey; label: string; get: () => { start: Date; end: Date } | null }> = [
  { key: 'all', label: 'All', get: () => null },
  ...RANGE_OPTIONS.map(({ key, label }) => ({
    key,
    label,
    get: () => normalizeRange(computeRange(key)),
  })),
];

const isWithin = (value: Date | null, start: Date, end: Date): boolean => {
  if (!value) return false;
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

const formatDateForPicker = (date?: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const parseDatePickerInput = (value?: string | null): Date | null =>
  value ? parseDate(value) : null;

const formatDateTag = (date: Date | null): string => {
  if (!date) return 'n/a';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const workingDaysBetween = (start: Date, end: Date): number => {
  if (!start || !end) return 1;
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endCopy = new Date(end);
  endCopy.setHours(23, 59, 59, 999);

  while (cursor <= endCopy) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(1, count);
};

const formatTimeAgo = (timestamp?: number): string => {
  if (!timestamp) return 'Not refreshed yet';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return 'Just now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

const formatDayHeaderLabel = (isoDate: string): string => {
  const parsed = parseDate(isoDate);
  if (!parsed) return isoDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  const startOfWeek = new Date(today);
  const dayIndex = (startOfWeek.getDay() + 6) % 7; // Monday as start of week
  startOfWeek.setDate(startOfWeek.getDate() - dayIndex);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  if (target >= startOfWeek && target <= endOfWeek) {
    return target.toLocaleDateString('en-GB', { weekday: 'long' });
  }

  return target.toLocaleDateString('en-GB');
};

// Triaged POC identifiers and patterns (case-insensitive)
function isTriagedPoc(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  if (!v) return false;
  if (v === 'property@helix-law.com' || v === 'commercial@helix-law.com' || v === 'construction@helix-law.com') return true;
  const local = v.includes('@') ? v.split('@')[0] : v;
  if (local === 'commercial' || local === 'construction' || local === 'property') return true;
  return false;
}

const getPocRaw = (entry: unknown): string => {
  if (!entry || typeof entry !== 'object') return '';
  const candidate = entry as Record<string, unknown>;
  const poc = candidate.Point_of_Contact ?? candidate.poc;
  return typeof poc === 'string' ? poc.trim() : '';
};

function containerStyle(isDark: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: isDark ? colours.dark.background : colours.light.background,
    padding: '18px 22px',
    minHeight: '100%',
  };
}

function surface(isDark: boolean, overrides: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: isDark ? 'rgba(15, 23, 42, 0.88)' : '#FFFFFF',
    borderRadius: 12,
    border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.06)'}`,
    boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.22)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
    padding: 16,
    ...overrides,
  };
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 12,
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

function sectionTitle(): React.CSSProperties {
  return { fontSize: 16, fontWeight: 600, margin: 0 };
}

const EnquiriesReport: React.FC<EnquiriesReportProps> = ({ enquiries, teamData, triggerRefresh, lastRefreshTimestamp, isFetching }) => {
  const { isDarkMode } = useTheme();
  const [rangeKey, setRangeKey] = useState<RangeKey>('month');
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null } | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // Time since last refresh in seconds
  const [showRoleFilter, setShowRoleFilter] = useState<boolean>(false);
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);

  // Auto-refresh tracking - Update elapsed time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset timer when manual refresh happens
  React.useEffect(() => {
    if (lastRefreshTimestamp) {
      setTimeElapsed(0);
    }
  }, [lastRefreshTimestamp]);

  // Calculate color based on elapsed time (green → blue over 15 minutes)
  const getRefreshIndicatorColor = (): string => {
    const maxSeconds = 15 * 60; // 15 minutes
    const progress = Math.min(timeElapsed / maxSeconds, 1); // 0 to 1

    // Green (start): rgb(34, 197, 94)
    // Blue (end): rgb(59, 130, 246)
    const r = Math.round(34 + (59 - 34) * progress);
    const g = Math.round(197 + (130 - 197) * progress);
    const b = Math.round(94 + (246 - 94) * progress);

    return `rgb(${r}, ${g}, ${b})`;
  };
  const range = useMemo(() => {
    if (rangeKey === 'custom') {
      if (!customDateRange || !customDateRange.start || !customDateRange.end) {
        return null;
      }
      return normalizeRange({ start: customDateRange.start, end: customDateRange.end });
    }
    const preset = quickRanges.find((entry) => entry.key === rangeKey);
    const base = preset?.get();
    return base ?? null;
  }, [rangeKey, customDateRange]);

  const teamMembers = useMemo<TeamMember[]>(() => {
    if (!teamData || teamData.length === 0) return [];
    return teamData
      .map((record) => {
        const display = mapNameIfNeeded(displayName(record));
        const initialsRaw = (record['Initials'] || '').trim();
        const initials = initialsRaw || getInitials(display);
        const normalizedName = normalizeName(display);
        const role = record['Role']?.trim();
        const status = (record.status || '').toLowerCase();
        const email = record['Email']?.trim();
        return {
          initials,
          display,
          role,
          isActive: status !== 'inactive',
          record,
          email,
          normalizedName,
        } satisfies TeamMember;
      })
  .filter((member) => Boolean(member.initials) && member.initials !== '?')
      .sort((a, b) => a.display.localeCompare(b.display));
  }, [teamData]);

  const enrichedEnquiries = useMemo<EnrichedEnquiry[]>(() => {
    const list = enquiries || [];
    if (list.length === 0) return [];

    const byNormalizedName = new Map<string, TeamMember>();
    const byInitials = new Map<string, TeamMember>();

    teamMembers.forEach((member) => {
      if (member.normalizedName) {
        byNormalizedName.set(member.normalizedName, member);
      }
      byInitials.set(member.initials.toLowerCase(), member);
      if (member.email) {
        const local = member.email.split('@')[0] || '';
        const normalizedLocal = normalizeName(local);
        if (normalizedLocal) {
          byNormalizedName.set(normalizedLocal, member);
        }
      }
    });

    return list.map((enquiry) => {
      const candidate = (enquiry.Point_of_Contact || (enquiry as any).poc || (enquiry as any).pocname || '').trim();
      const mapped = mapNameIfNeeded(candidate);
      const normalized = normalizeName(mapped);
      let member = normalized ? byNormalizedName.get(normalized) : undefined;

      if (!member && mapped) {
        const initials = getInitials(mapped).toLowerCase();
        if (initials) {
          member = byInitials.get(initials);
        }
      }

      if (!member) {
        const taker = (enquiry.Call_Taker || (enquiry as any).call_taker || '').trim();
        const takerNormalized = normalizeName(mapNameIfNeeded(taker));
        if (takerNormalized) {
          member = byNormalizedName.get(takerNormalized) ?? byInitials.get(getInitials(taker).toLowerCase());
        }
      }

      return { enquiry, member };
    });
  }, [enquiries, teamMembers]);

  // Calculate actual date range from available data
  const dataDateRange = useMemo(() => {
    if (!enquiries || enquiries.length === 0) return null;
    
    const dates = enquiries
      .map(e => parseDate((e as any).Touchpoint_Date))
      .filter(d => d !== null) as Date[];
    
    if (dates.length === 0) return null;
    
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return { earliest, latest };
  }, [enquiries]);

  // Debug: Check what data we're receiving
  React.useEffect(() => {
    console.log('[EnquiriesReport] Received enquiries:', {
      isNull: enquiries === null,
      isArray: Array.isArray(enquiries),
      length: Array.isArray(enquiries) ? enquiries.length : 0,
      sample: Array.isArray(enquiries) && enquiries.length > 0 ? enquiries[0] : null
    });
  }, [enquiries]);

  const filteredEntries = useMemo(() => {
    return enrichedEnquiries.filter(({ enquiry, member }) => {
      if (range) {
        const date = parseDate((enquiry as any).Touchpoint_Date || (enquiry as any).Date_Created);
        if (!date || !isWithin(date, range.start, range.end)) {
          return false;
        }
      }

      if (selectedTeams.size > 0) {
        const memberInitials = member?.initials;
        if (!memberInitials || !selectedTeams.has(memberInitials)) {
          return false;
        }
      }

      if (selectedRoles.size > 0) {
        const memberRole = member?.role?.trim();
        if (!memberRole || !selectedRoles.has(memberRole)) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedEnquiries, range, selectedRoles, selectedTeams]);

  const filtered = useMemo(() => filteredEntries.map((entry) => entry.enquiry), [filteredEntries]);

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEntries.forEach(({ member }) => {
      if (member) {
        counts.set(member.initials, (counts.get(member.initials) || 0) + 1);
      }
    });
    return counts;
  }, [filteredEntries]);

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEntries.forEach(({ member }) => {
      const roleKey = member?.role?.trim();
      if (!roleKey) return;
      counts.set(roleKey, (counts.get(roleKey) || 0) + 1);
    });
    return counts;
  }, [filteredEntries]);

  const lastRefreshLabel = useMemo(() => formatTimeAgo(lastRefreshTimestamp), [lastRefreshTimestamp]);
  const showCustomPickers = rangeKey === 'custom';
  const customStartValue = customDateRange?.start ?? null;
  const customEndValue = customDateRange?.end ?? null;
  const displayRangeStart = range?.start ?? (showCustomPickers ? customStartValue : null);
  const displayRangeEnd = range?.end ?? (showCustomPickers ? customEndValue : null);
  const fromLabel = rangeKey === 'all'
    ? 'All time'
    : displayRangeStart
      ? formatDateTag(displayRangeStart)
      : 'Select start';
  const toLabel = rangeKey === 'all'
    ? 'Latest'
    : displayRangeEnd
      ? formatDateTag(displayRangeEnd)
      : 'Select end';
  const currentRangeLabel = rangeKey === 'custom'
    ? 'Custom'
    : quickRanges.find((entry) => entry.key === rangeKey)?.label ?? 'All';

  const stats = useMemo(() => {
    const total = filtered.length;
    const bySource = new Map<string, number>();
    const byPoc = new Map<string, number>();
    let claimed = 0;
    let unclaimed = 0;

    const getSource = (e: any): string => getNormalizedEnquirySourceLabel(e);

    const isClaimed = (pocRaw: string): boolean => {
      const v = pocRaw.toLowerCase();
      if (!v) return false;
      // Treat team inbox and placeholders as unclaimed
      if (v === 'team@helix-law.com' || v === 'team' || v === 'anyone' || v === 'unassigned' || v === 'unknown' || v === 'n/a') return false;
      // Triaged are not considered claimed
      if (isTriagedPoc(v)) return false;
      return true;
    };

    filtered.forEach((e: any) => {
      const src = getSource(e);
      bySource.set(src, (bySource.get(src) || 0) + 1);

      const pocRaw = getPocRaw(e);
      const claimedFlag = isClaimed(pocRaw);
      let pocKey: string;
      if (claimedFlag) pocKey = pocRaw;
      else if (isTriagedPoc(pocRaw)) pocKey = 'Triaged';
      else pocKey = 'Unassigned';
      byPoc.set(pocKey, (byPoc.get(pocKey) || 0) + 1);
      if (claimedFlag) claimed++; else unclaimed++;
    });
    const wdRaw = range ? workingDaysBetween(range.start, range.end) : workingDaysBetween(new Date(2000,0,1), new Date());
    const wdForRate = Math.max(1, wdRaw); // avoid divide-by-zero; do not alter displayed badge count
    const perDay = total / wdForRate;
    return { total, perDay, bySource, byPoc, workingDays: wdRaw, claimed, unclaimed };
  }, [filtered, range]);

  const workingDaysLabel = range
    ? `${stats.workingDays} working days in selected range`
    : 'All data (working days not applicable)';

  // Group recent enquiries by day for progressive loading (timeline style)
  const dayGroups = useMemo(() => {
    const groupsMap = new Map<string, any[]>();
    for (const e of filtered) {
      const d0 = parseDate((e as any).Touchpoint_Date);
      if (!d0 || isNaN(d0.getTime())) continue;
      const y = d0.getFullYear();
      const m = String(d0.getMonth() + 1).padStart(2, '0');
      const day = String(d0.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const arr = groupsMap.get(key) || [];
      arr.push(e);
      groupsMap.set(key, arr);
    }
    return Array.from(groupsMap.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }, [filtered]);
  // Infinite scroll over date groups
  const [visibleGroupCount, setVisibleGroupCount] = useState<number>(3);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    setVisibleGroupCount(3);
  }, [rangeKey, dayGroups.length]);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first && first.isIntersecting) {
        setVisibleGroupCount((n) => Math.min(dayGroups.length, n + 3));
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [dayGroups.length]);

  const topSources = useMemo(() => Array.from(stats.bySource.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6), [stats.bySource]);
  const topPocs = useMemo(() => Array.from(stats.byPoc.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10), [stats.byPoc]);

  // Hover highlight for fee earner within a day group
  const [hoverHighlight, setHoverHighlight] = useState<{ date: string; poc: string } | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [dayFilters, setDayFilters] = useState<Record<string, { name: string; poc: string; taker: string; status: string }>>({});

  // Role and team filters
  const handleRoleToggle = (role: string) => {
    const updated = new Set(selectedRoles);
    if (updated.has(role)) updated.delete(role);
    else updated.add(role);
    setSelectedRoles(updated);
  };

  const handleTeamToggle = (team: string) => {
    const updated = new Set(selectedTeams);
    if (updated.has(team)) updated.delete(team);
    else updated.add(team);
    setSelectedTeams(updated);
  };

  const updateDayFilter = useCallback((date: string, key: 'name' | 'poc' | 'taker' | 'status', value: string) => {
    setDayFilters((prev) => {
      const current = prev[date] ?? EMPTY_DAY_FILTER;
      const next = { ...current, [key]: value };
      const hasAny = Object.values(next).some((v) => v.trim().length > 0);
      if (!hasAny) {
        const { [date]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: next };
    });
  }, []);

  const handleRangeSelect = (key: RangeKey) => {
    if (key === 'custom') {
      setCustomDateRange((prev) => {
        if (prev && prev.start && prev.end) {
          return prev;
        }
        const fallbackStart = range ? new Date(range.start) : new Date();
        const fallbackEnd = range ? new Date(range.end) : new Date();
        return { start: fallbackStart, end: fallbackEnd };
      });
    } else {
      setCustomDateRange(null);
    }
    setRangeKey(key);
  };

  // Helper for range button active state
  const isActive = (key: string) => rangeKey === key;

  const handleCustomDateChange = (position: 'start' | 'end') => (date?: Date | null) => {
    setCustomDateRange((prev) => {
      const next = prev ? { ...prev } : { start: null as Date | null, end: null as Date | null };
      next[position] = date ? new Date(date) : null;
      return next;
    });
    setRangeKey('custom');
  };

  const handleClearTeams = () => {
    setSelectedTeams(new Set());
  };

  const handleClearRoles = () => {
    setSelectedRoles(new Set());
  };

  // Refresh data manually
  const handleRefresh = () => {
    if (triggerRefresh) {
      triggerRefresh();
      setTimeElapsed(0); // Reset timer on manual refresh
    }
  };

  return (
    <div style={containerStyle(isDarkMode)}>
      <div style={surface(isDarkMode)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            {showCustomPickers ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <DatePicker
                  label="From"
                  styles={getDatePickerStyles(isDarkMode)}
                  value={customStartValue || undefined}
                  onSelectDate={handleCustomDateChange('start')}
                  allowTextInput
                  firstDayOfWeek={DayOfWeek.Monday}
                  formatDate={formatDateForPicker}
                  parseDateFromString={parseDatePickerInput}
                />
                <DatePicker
                  label="To"
                  styles={getDatePickerStyles(isDarkMode)}
                  value={customEndValue || undefined}
                  onSelectDate={handleCustomDateChange('end')}
                  allowTextInput
                  firstDayOfWeek={DayOfWeek.Monday}
                  formatDate={formatDateForPicker}
                  parseDateFromString={parseDatePickerInput}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={dateStampButtonStyle(isDarkMode)}
                  onClick={() => handleRangeSelect('custom')}
                  title="Click to customise the start date"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.86)' : 'rgba(248, 250, 252, 1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>From</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{fromLabel}</span>
                </button>
                <button
                  type="button"
                  style={dateStampButtonStyle(isDarkMode)}
                  onClick={() => handleRangeSelect('custom')}
                  title="Click to customise the end date"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.86)' : 'rgba(248, 250, 252, 1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>To</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{toLabel}</span>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${isFetching ? (isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.25)') : getRefreshIndicatorColor()}`,
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
                  transition: 'border-color 1s ease',
                }}
                title={
                  isFetching 
                    ? 'Refreshing data...' 
                    : `Next auto-refresh in ${Math.floor((15 * 60 - timeElapsed) / 60)}m ${(15 * 60 - timeElapsed) % 60}s`
                }
              >
                {isFetching ? (
                  <>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(13, 47, 96, 0.5)',
                    }} />
                    Refreshing
                  </>
                ) : (
                  <>
                    <div 
                      style={{ 
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: getRefreshIndicatorColor(),
                        transition: 'background 1s ease',
                      }}
                    />
                    {lastRefreshLabel}
                  </>
                )}
              </div>

              {triggerRefresh && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`,
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                    color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
                    cursor: isFetching ? 'default' : 'pointer',
                    opacity: isFetching ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  title={isFetching ? 'Refreshing data...' : 'Refresh datasets (auto-refreshes every 15 min)'}
                  aria-label={isFetching ? 'Refreshing data' : 'Refresh datasets'}
                  onMouseEnter={(e) => {
                    if (!isFetching) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.86)' : 'rgba(248, 250, 252, 1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isFetching) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)';
                    }
                  }}
                >
                  <Icon 
                    iconName="Refresh" 
                    style={{ 
                      fontSize: 16,
                      animation: isFetching ? 'spin 1s linear infinite' : 'none'
                    }} 
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowRoleFilter(!showRoleFilter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`,
                  background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                  color: showRoleFilter 
                    ? (isDarkMode ? '#60a5fa' : colours.highlight)
                    : (isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(13, 47, 96, 0.5)'),
                  cursor: 'pointer',
                  transform: showRoleFilter ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 0.2s ease',
                }}
                title={showRoleFilter ? 'Hide role filter' : 'Show role filter'}
                aria-label={showRoleFilter ? 'Hide role filter' : 'Show role filter'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.86)' : 'rgba(248, 250, 252, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = showRoleFilter ? 'translateY(-1px)' : 'translateY(0)';
                  e.currentTarget.style.background = isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)';
                }}
              >
                <Icon iconName="People" style={{ fontSize: 16 }} />
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onMouseEnter={() => setShowDatasetInfo(true)}
                  onMouseLeave={() => setShowDatasetInfo(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`,
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                    color: isDarkMode ? '#60a5fa' : colours.highlight,
                    cursor: 'pointer',
                    transform: showDatasetInfo ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'all 0.2s ease',
                  }}
                  title="Dataset information"
                  aria-label="Dataset information"
                >
                  <Icon iconName="Info" style={{ fontSize: 16 }} />
                </button>

                {showDatasetInfo && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    padding: '10px 12px',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.25)'}`,
                    borderRadius: 8,
                    boxShadow: isDarkMode ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                    fontSize: 11,
                    lineHeight: 1.5,
                    width: 240,
                    zIndex: 1000,
                    color: isDarkMode ? '#e2e8f0' : '#334155',
                    textAlign: 'left',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: isDarkMode ? '#60a5fa' : colours.highlight }}>
                      Dataset Information
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ opacity: 0.8 }}>Enquiries:</span>
                        <span style={{ fontWeight: 600 }}>Last 24 months</span>
                      </div>
                    </div>
                    <div style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
                      fontSize: 11,
                      opacity: 0.7,
                      fontStyle: 'italic'
                    }}>
                      Data outside this range won't appear in metrics
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {dataDateRange && (
            <div style={{ 
              padding: '8px 12px',
              borderRadius: 8,
              background: isDarkMode ? 'rgba(148, 163, 184, 0.08)' : 'rgba(13, 47, 96, 0.04)',
              border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'rgba(13, 47, 96, 0.08)'}`,
              fontSize: 12,
              color: isDarkMode ? 'rgba(226, 232, 240, 0.85)' : 'rgba(13, 47, 96, 0.75)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}>
              <span>
                Available data: {dataDateRange.earliest.toLocaleDateString()} to {dataDateRange.latest.toLocaleDateString()} 
                ({enquiries?.length.toLocaleString()} total)
              </span>
              <span>{workingDaysLabel}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {quickRanges.map(r => {
              const active = isActive(r.key);
              return (
                <DefaultButton
                  key={r.key}
                  text={r.label}
                  onClick={() => handleRangeSelect(r.key)}
                  styles={getRangeButtonStyles(isDarkMode, active, false)}
                />
              );
            })}
            {rangeKey !== 'all' && (
              <button
                onClick={() => handleRangeSelect('all')}
                style={clearFilterButtonStyle(isDarkMode)}
                title="Clear date range filter"
              >
                <span style={{ fontSize: 16 }}>×</span>
                Clear
              </button>
            )}
          </div>

          {showRoleFilter && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {ROLE_OPTIONS.map(({ key, label }) => (
                  <DefaultButton
                    key={key}
                    text={label}
                    onClick={() => handleRoleToggle(key)}
                    styles={getRoleButtonStyles(isDarkMode, selectedRoles.has(key))}
                  />
                ))}
                {selectedRoles.size > 0 && (
                  <button
                    onClick={handleClearRoles}
                    style={clearFilterButtonStyle(isDarkMode)}
                    title="Clear role filter"
                  >
                    <span style={{ fontSize: 16 }}>×</span>
                    Clear
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {teamMembers
                  .filter((member) => memberCounts.has(member.initials))
                  .map((member) => {
                    const count = memberCounts.get(member.initials) || 0;
                    const isSelected = selectedTeams.has(member.initials);
                    return (
                      <DefaultButton
                        key={member.initials}
                        text={member.initials}
                        onClick={() => handleTeamToggle(member.initials)}
                        title={`${member.display} (${count} enquiries)`}
                        styles={getTeamButtonStyles(isDarkMode, isSelected, count > 0)}
                      />
                    );
                  })}
                {selectedTeams.size > 0 && (
                  <button
                    onClick={handleClearTeams}
                    style={clearFilterButtonStyle(isDarkMode)}
                    title="Clear team filter"
                  >
                    <span style={{ fontSize: 16 }}>×</span>
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Show data status */}
        {enquiries === null && (
          <div style={{ 
            marginTop: 12, 
            padding: 16, 
            borderRadius: 12, 
            background: isDarkMode ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.08)',
            border: isDarkMode ? '1px solid rgba(248,113,113,0.28)' : '1px solid rgba(220,38,38,0.18)',
            color: isDarkMode ? '#fda4af' : '#b91c1c',
            fontSize: 14
          }}>
            ⚠️ No enquiry data loaded. Click refresh or check console for errors.
          </div>
        )}
        {enquiries && enquiries.length === 0 && (
          <div style={{ 
            marginTop: 12, 
            padding: 16, 
            borderRadius: 12, 
            background: isDarkMode ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.08)',
            border: isDarkMode ? '1px solid rgba(251,191,36,0.28)' : '1px solid rgba(251,191,36,0.18)',
            color: isDarkMode ? '#fcd34d' : '#d97706',
            fontSize: 14
          }}>
            ℹ️ No enquiries found in database for the last 24 months. Check server logs or database.
          </div>
        )}
        {enquiries && enquiries.length > 0 && filtered.length === 0 && (
          <div style={{ 
            marginTop: 12, 
            padding: 16, 
            borderRadius: 12, 
            background: isDarkMode ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.08)',
            border: isDarkMode ? '1px solid rgba(251,191,36,0.28)' : '1px solid rgba(251,191,36,0.18)',
            color: isDarkMode ? '#fcd34d' : '#d97706',
            fontSize: 14
          }}>
            ℹ️ {enquiries.length} enquiries loaded, but none match the selected date range "{currentRangeLabel}". Try "All" to see all data.
          </div>
        )}

        {/* Dashboard-style stat cards */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 12 }}>
          {/* Total Enquiries */}
          <div style={{
            borderRadius: 12,
            padding: 16,
            background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #141C2C 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
            border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Enquiries</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : colours.missedBlue }}>
              {filtered.length.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>~ {Math.round(stats.perDay)} per working day</div>
          </div>

          {/* Claimed */}
          <div style={{
            borderRadius: 12,
            padding: 16,
            background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #12263A 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
            border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Claimed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : colours.missedBlue }}>
              {stats.claimed.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              {filtered.length ? Math.round((stats.claimed / filtered.length) * 100) : 0}% of total
            </div>
          </div>

          {/* Unclaimed */}
          <div style={{
            borderRadius: 12,
            padding: 16,
            background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #2A1B1B 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
            border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Unclaimed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : colours.missedBlue }}>
              {stats.unclaimed.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              {filtered.length ? Math.round((stats.unclaimed / filtered.length) * 100) : 0}% of total
            </div>
          </div>
        </div>

        {/* Migration Status Summary - Transition Management */}
        {(() => {
          const migrationData = (window as any).migrationData;
          if (!migrationData?.stats) return null;
          
          const { stats } = migrationData;
          return (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 8, 
              background: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(248, 250, 252, 0.8)',
              border: isDarkMode ? '1px solid rgba(148,163,184,0.15)' : '1px solid rgba(13,47,96,0.08)',
              boxShadow: 'none'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: isDarkMode ? '#cbd5e1' : '#475569', opacity: 0.8 }}>
                Data Migration Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 11 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isDarkMode ? '#86efac' : '#22c55e' }}>
                    {stats.migrated || 0}
                  </div>
                  <div style={{ opacity: 0.6 }}>● Synced</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isDarkMode ? '#fcd34d' : '#d97706' }}>
                    {stats.partial || 0}
                  </div>
                  <div style={{ opacity: 0.6 }}>◐ Partial</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                    {stats.notMigrated || 0}
                  </div>
                  <div style={{ opacity: 0.6 }}>○ Legacy</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isDarkMode ? '#c4b5fd' : '#8b5cf6' }}>
                    {stats.instructionsOnly || 0}
                  </div>
                  <div style={{ opacity: 0.6 }}>● New Only</div>
                </div>
              </div>
              <div style={{ marginTop: 8, textAlign: 'center', fontSize: 10, opacity: 0.5 }}>
                Sync Rate: {stats.migrationRate || '0.0%'} • {stats.total || 0} enquiries analyzed
              </div>
            </div>
          );
        })()}
      </div>

      <div style={grid}>
        <div style={{ gridColumn: 'span 6' }}>
          <div style={surface(isDarkMode)}>
            <h3 style={sectionTitle()}>Top sources</h3>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topSources.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.08)'}`, padding: '6px 0' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
              ))}
              {topSources.length === 0 && <span style={{ opacity: 0.7 }}>No data in range.</span>}
            </div>
          </div>
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <div style={surface(isDarkMode)}>
            <h3 style={sectionTitle()}>By fee earner</h3>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topPocs.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.08)'}`, padding: '6px 0' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
              ))}
              {topPocs.length === 0 && <span style={{ opacity: 0.7 }}>No data in range.</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={surface(isDarkMode)}>
        <h3 style={sectionTitle()}>Recent enquiries</h3>
        {dayGroups.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No enquiries in the selected range.</div>
        ) : (
          <div>
            {dayGroups.slice(0, visibleGroupCount).map((grp, gIdx) => {
              const isHovered = hoveredDay === grp.date;
              const dateLabel = formatDayHeaderLabel(grp.date);
              const dateTooltip = new Date(grp.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });
              // Connector accent: brand accent in dark mode (higher alpha), standard blue in light mode
              const accent = isDarkMode ? 'rgba(135, 243, 243, 0.55)' : colours.missedBlue;
              const connectorStyle: React.CSSProperties = {
                position: 'absolute',
                left: 10,
                top: gIdx === 0 ? '20px' : 0,
                bottom: gIdx === visibleGroupCount - 1 ? '50%' : 0,
                width: 2,
                background: accent,
                opacity: 1,
                zIndex: 1,
              };
              const nodeStyle: React.CSSProperties = {
                position: 'absolute',
                left: 6,
                top: 16,
                width: 10,
                height: 10,
                borderRadius: 5,
                background: isDarkMode ? 'rgba(255,255,255,0.15)' : '#fff',
                border: `2px solid ${accent}`,
                zIndex: 2,
              };
              const blockStyle: React.CSSProperties = {
                borderRadius: 12,
                padding: 12,
                background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #141C2C 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                boxShadow: isHovered
                  ? (isDarkMode ? '0 6px 16px rgba(15,23,42,0.45)' : '0 10px 24px rgba(15,23,42,0.12)')
                  : (isDarkMode ? '0 2px 6px rgba(0,0,0,0.25)' : '0 2px 6px rgba(15,23,42,0.04)'),
                border: isDarkMode
                  ? `1px solid ${isHovered ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.14)'}`
                  : `1px solid ${isHovered ? 'rgba(13,47,96,0.18)' : 'rgba(13,47,96,0.06)'}`,
                opacity: isHovered ? 1 : 0.6,
                filter: isHovered ? 'none' : 'grayscale(0.12)',
                transition: 'all 0.24s ease'
              };
              const filters = dayFilters[grp.date] ?? EMPTY_DAY_FILTER;
              const filterName = filters.name.trim().toLowerCase();
              const filterPoc = filters.poc.trim().toLowerCase();
              const filterTaker = filters.taker.trim().toLowerCase();
              const filterStatus = filters.status.trim().toLowerCase();
              const hasFilters = Boolean(filterName || filterPoc || filterTaker || filterStatus);

              const filteredItems = grp.items.filter((raw: any) => {
                const nameCandidate = (raw.Client_Name || raw.Description || raw.Client || `${raw.First_Name || ''} ${raw.Last_Name || ''}`.trim() || '-').toLowerCase();
                if (filterName && !nameCandidate.includes(filterName)) return false;

                const pocCandidateRaw = getPocRaw(raw) || '';
                const pocCandidate = pocCandidateRaw.toLowerCase();
                if (filterPoc && !pocCandidate.includes(filterPoc)) return false;

                const takerCandidate = (raw.Call_Taker || '').toString().toLowerCase();
                if (filterTaker && !takerCandidate.includes(filterTaker)) return false;

                if (filterStatus) {
                  const statusLabel = isTriagedPoc(pocCandidateRaw)
                    ? 'triaged'
                    : (!pocCandidateRaw || pocCandidate === 'team@helix-law.com' ? 'unclaimed' : 'claimed');
                  if (statusLabel !== filterStatus) return false;
                }

                return true;
              });

              const displayItems = filteredItems;
              const headerPillStyle: React.CSSProperties = {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(13,47,96,0.05)',
                border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)',
                fontWeight: 700,
                marginBottom: 8,
              };
              const subtleBadge: React.CSSProperties = {
                display: 'inline-block',
                padding: '1px 6px',
                borderRadius: 999,
                background: isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(13,47,96,0.05)',
                border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)',
                fontSize: 11,
                fontWeight: 600,
              };
              return (
                <div
                  key={grp.date}
                  style={{ position: 'relative', paddingLeft: 24, marginBottom: 18, transition: 'opacity 0.2s ease' }}
                  onMouseEnter={() => setHoveredDay(grp.date)}
                  onMouseLeave={() => setHoveredDay((prev) => (prev === grp.date ? null : prev))}
                  onFocus={() => setHoveredDay(grp.date)}
                  onBlur={() => setHoveredDay((prev) => (prev === grp.date ? null : prev))}
                >
                  {/* Accent connector and node */}
                  <div style={connectorStyle} />
                  <div style={nodeStyle} />
                  {/* Block container */}
                  <div style={blockStyle}>
                    {/* Date header pill */}
                    <div style={{ ...headerPillStyle, justifyContent: 'space-between', width: '100%' }}>
                      <span title={dateTooltip}>{dateLabel}</span>
                      <span style={{ fontSize: 12, opacity: 0.75 }}>
                        {displayItems.length} shown
                        {hasFilters ? ` · filtered from ${grp.items.length}` : ` · total ${grp.items.length}`}
                      </span>
                    </div>

                    {/* Column filters */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(220px, 1fr) 220px 160px 120px',
                        gap: 8,
                        margin: '6px 0 10px',
                        opacity: isHovered ? 0.8 : 0.45,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <input
                        value={filters.name}
                        onChange={(event) => updateDayFilter(grp.date, 'name', event.target.value)}
                        placeholder="Filter name / description"
                        style={{
                          fontSize: 11,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(15,23,42,0.14)',
                          background: isDarkMode ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)',
                          color: isDarkMode ? '#e2e8f0' : '#1f2937'
                        }}
                      />
                      <input
                        value={filters.poc}
                        onChange={(event) => updateDayFilter(grp.date, 'poc', event.target.value)}
                        placeholder="Filter point of contact"
                        style={{
                          fontSize: 11,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(15,23,42,0.14)',
                          background: isDarkMode ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)',
                          color: isDarkMode ? '#e2e8f0' : '#1f2937'
                        }}
                      />
                      <input
                        value={filters.taker}
                        onChange={(event) => updateDayFilter(grp.date, 'taker', event.target.value)}
                        placeholder="Filter call taker"
                        style={{
                          fontSize: 11,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(15,23,42,0.14)',
                          background: isDarkMode ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)',
                          color: isDarkMode ? '#e2e8f0' : '#1f2937'
                        }}
                      />
                      <select
                        value={filters.status}
                        onChange={(event) => updateDayFilter(grp.date, 'status', event.target.value)}
                        style={{
                          fontSize: 11,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(15,23,42,0.14)',
                          background: isDarkMode ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.8)',
                          color: isDarkMode ? '#e2e8f0' : '#1f2937'
                        }}
                      >
                        <option value="">All statuses</option>
                        <option value="claimed">Claimed</option>
                        <option value="unclaimed">Unclaimed</option>
                        <option value="triaged">Triaged</option>
                      </select>
                    </div>

                    {/* Group rows: Name | Point of contact | Call taker | Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 220px 160px 120px', gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Name</div>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Point of contact</div>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Call taker</div>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Status</div>
                      {displayItems.length === 0 && (
                        <div style={{ gridColumn: '1 / span 4', fontSize: 11, opacity: 0.6, padding: '8px 0' }}>
                          No enquiries match the filters for this day.
                        </div>
                      )}
                      {displayItems.map((e: any, idx2: number) => {
                        const name = e.Client_Name || e.Description || e.Client || `${e.First_Name || ''} ${e.Last_Name || ''}`.trim() || '-';
                        const stageStr = typeof e.stage === 'string' ? e.stage.toLowerCase() : (typeof (e as any).Stage === 'string' ? (e as any).Stage.toLowerCase() : '');
                        const statusStr = typeof (e as any).Status === 'string' ? (e as any).Status.toLowerCase() : (typeof (e as any).status === 'string' ? (e as any).status.toLowerCase() : '');
                        // Heuristics to identify Deal vs Instruction
                        const instructionRefField = (e as any).InstructionRef || (e as any).instruction_ref || (e as any).instructionRef;
                        const rRefField = instructionRefField || (e as any).RRef || (e as any).rref || (e as any).Rref;
                        const dealIdRaw = (e as any).DealId ?? (e as any).deal_id ?? (e as any).dealId;
                        const prospectIdRaw = (e as any).ProspectId ?? (e as any).prospect_id ?? (e as any).prospectId;
                        const dealIdNum = typeof dealIdRaw === 'string' ? parseInt(dealIdRaw, 10) : (typeof dealIdRaw === 'number' ? dealIdRaw : NaN);
                        const prospectIdNum = typeof prospectIdRaw === 'string' ? parseInt(prospectIdRaw, 10) : (typeof prospectIdRaw === 'number' ? prospectIdRaw : NaN);
                        const hasInstruction = Boolean(
                          instructionRefField ||
                          (e as any).Matter_Ref || (e as any).matter_ref || (e as any).MatterRef || (e as any).matterRef ||
                          (e as any).MatterId || (e as any).MatterID || (e as any).matterId || (e as any).matterID ||
                          statusStr === 'closed' || statusStr === 'instructed' ||
                          (stageStr && stageStr.includes('instruct'))
                        );
                        const hasDeal = Boolean(
                          (e as any).pitch === true ||
                          (e as any).Pitched === true ||
                          Boolean((e as any).PitchedDate) ||
                          (stageStr && (stageStr.includes('deal') || stageStr.includes('pitch'))) ||
                          statusStr === 'pitched' ||
                          // If we have an RRef-like value but no confirmed instruction, treat as deal
                          (!!rRefField && !hasInstruction) ||
                          (Number.isFinite(dealIdNum) && dealIdNum > 0) ||
                          (Number.isFinite(prospectIdNum) && prospectIdNum > 0)
                        );
                        const pocRaw = (e.Point_of_Contact || '').trim().toLowerCase();
                        const isUnclaimed = !pocRaw || pocRaw === 'team@helix-law.com';
                        const isTriaged = isTriagedPoc(pocRaw);
                        const isClaimedEntry = !isUnclaimed && !isTriaged;
                        const isHighlightActive = !!hoverHighlight && hoverHighlight.date === grp.date;
                        const isRowHighlighted = isHighlightActive && hoverHighlight!.poc === pocRaw;
                        const highlightedCellStyle: React.CSSProperties = isRowHighlighted
                          ? (isDarkMode
                              ? { background: 'rgba(135, 243, 243, 0.12)', outline: '1px solid rgba(135, 243, 243, 0.38)', borderRadius: 6 }
                              : { background: 'rgba(13, 47, 96, 0.06)', outline: '1px solid rgba(13, 47, 96, 0.18)', borderRadius: 6 })
                          : {};
                        
                        // Migration status indicators for transition management
                        const migrationStatus = (e as any).migrationStatus || 'unknown';
                        const matchScore = (e as any).matchScore || 0;
                        const instructionsId = (e as any).instructionsId;
                        
                        const getMigrationIndicator = (status: string) => {
                          switch (status) {
                            case 'migrated':
                              return { icon: '●', color: isDarkMode ? '#86efac' : '#22c55e', label: 'Synced', title: `Synced to new system (ID: ${instructionsId})` };
                            case 'partial':
                              return { icon: '◐', color: isDarkMode ? '#fcd34d' : '#d97706', label: 'Partial', title: `Partially synced (Score: ${matchScore})` };
                            case 'not-migrated':
                              return { icon: '○', color: isDarkMode ? '#94a3b8' : '#64748b', label: 'Legacy', title: 'Legacy system only' };
                            case 'sync-pending':
                              return { icon: '◒', color: isDarkMode ? '#93c5fd' : '#3b82f6', label: 'Pending', title: 'Sync pending' };
                            case 'instructions-only':
                              return { icon: '●', color: isDarkMode ? '#c4b5fd' : '#8b5cf6', label: 'New', title: 'New system only' };
                            default:
                              return { icon: '○', color: isDarkMode ? '#64748b' : '#94a3b8', label: 'Unknown', title: 'Migration status unknown' };
                          }
                        };
                        
                        const migrationIndicator = getMigrationIndicator(migrationStatus);
                        const migrationBadge: React.CSSProperties = {
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 4,
                          padding: '1px 4px', 
                          borderRadius: 6, 
                          fontSize: 9, 
                          fontWeight: 500,
                          background: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.7)',
                          border: `1px solid ${migrationIndicator.color}30`,
                          color: migrationIndicator.color,
                          marginLeft: 4,
                          opacity: 0.7,
                          cursor: 'help'
                        };
                        const pocLabel = isUnclaimed ? 'Unclaimed' : (isTriaged ? 'Triaged' : (e.Point_of_Contact as string));
                        const pocStyle: React.CSSProperties = (isUnclaimed || isTriaged)
                          ? {
                              ...subtleBadge,
                              background: isTriaged
                                ? (isDarkMode ? 'rgba(71,85,105,0.18)' : 'rgba(100,116,139,0.12)') // dark grey for Triaged
                                : (isDarkMode ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.08)'),
                              border: isTriaged
                                ? (isDarkMode ? '1px solid rgba(148,163,184,0.35)' : '1px solid rgba(100,116,139,0.28)')
                                : (isDarkMode ? '1px solid rgba(248,113,113,0.28)' : '1px solid rgba(220,38,38,0.18)'),
                              color: isTriaged
                                ? (isDarkMode ? '#CBD5E1' : '#334155')
                                : (isDarkMode ? '#fda4af' : '#b91c1c'),
                            }
                          : {};
                        const taker = (e.Call_Taker || '').trim();
                        const takerLabel = taker.toLowerCase() === 'operations' ? 'Internal' : 'External';
                        const takerStyle: React.CSSProperties = subtleBadge;
                        const claimedBadge: React.CSSProperties = isDarkMode
                          ? { ...subtleBadge, background: 'rgba(32,178,108,0.12)', border: '1px solid rgba(32,178,108,0.28)', color: '#86efac', marginRight: 6 }
                          : { ...subtleBadge, background: 'rgba(32,178,108,0.08)', border: '1px solid rgba(32,178,108,0.18)', color: colours.green, marginRight: 6 };
                        // Claimed status: clear text instead of confusing dots
                        const rowDim: React.CSSProperties = {};
                        const nameCellExtra: React.CSSProperties = {};
                        const statusPrimary = isUnclaimed ? 'Unclaimed' : (isTriaged ? 'Triaged' : 'Claimed');
                        const statusPrimaryBadge: React.CSSProperties = (() => {
                          if (isUnclaimed) {
                            return isDarkMode
                              ? { ...subtleBadge, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.28)', color: '#fca5a5' }
                              : { ...subtleBadge, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.18)', color: '#b91c1c' };
                          }
                          if (isTriaged) {
                            return isDarkMode
                              ? { ...subtleBadge, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.28)', color: '#93c5fd' }
                              : { ...subtleBadge, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.18)', color: '#1d4ed8' };
                          }
                          return { ...claimedBadge, marginRight: 0 };
                        })();
                        const tagBase: React.CSSProperties = {
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                          marginLeft: 8
                        };
                        // Align with Instructions module semantics and colours: Pitched (blue), Instructed (green)
                        const dealTag: React.CSSProperties = isDarkMode
                          ? { ...tagBase, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(147,197,253,0.28)', color: '#93c5fd' }
                          : { ...tagBase, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', color: '#1e40af' };
                        const instructionTag: React.CSSProperties = isDarkMode
                          ? { ...tagBase, background: 'rgba(32,178,108,0.12)', border: '1px solid rgba(32,178,108,0.28)', color: '#86efac' }
                          : { ...tagBase, background: 'rgba(32,178,108,0.08)', border: '1px solid rgba(32,178,108,0.18)', color: colours.green };
                        const initialsPillStyle: React.CSSProperties = {
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 22, height: 22, borderRadius: 999, fontSize: 10, fontWeight: 800,
                          color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
                          background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #12263A 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.35)' : '1px solid rgba(13,47,96,0.18)',
                          boxShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.35)' : '0 1px 2px rgba(15,23,42,0.08)',
                          marginRight: 8, cursor: 'pointer'
                        };
                        return (
                          <React.Fragment key={idx2}>
                            <div style={{ ...rowDim, ...nameCellExtra, ...highlightedCellStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{name}</span>
                              <span 
                                title={migrationIndicator.title}
                                style={migrationBadge}
                              >
                                {migrationIndicator.icon}
                              </span>
                            </div>
                            <div
                              style={{ ...rowDim, ...highlightedCellStyle, display: 'flex', alignItems: 'center', gap: 6 }}
                              onMouseEnter={() => { if (isClaimedEntry) setHoverHighlight({ date: grp.date, poc: pocRaw }); }}
                              onMouseLeave={() => { if (isRowHighlighted) setHoverHighlight(null); }}
                            >
                              {isClaimedEntry && (
                                <span
                                  title={pocLabel}
                                  aria-label={pocLabel}
                                  style={initialsPillStyle}
                                  onMouseEnter={() => setHoverHighlight({ date: grp.date, poc: pocRaw })}
                                  onMouseLeave={() => { if (isRowHighlighted) setHoverHighlight(null); }}
                                >
                                  {getInitials(e.Point_of_Contact as string)}
                                </span>
                              )}
                              {(isUnclaimed || isTriaged) && <span style={pocStyle}>{pocLabel}</span>}
                            </div>
                            <div style={{ ...rowDim, ...highlightedCellStyle }}><span style={takerStyle}>{takerLabel}</span></div>
                            <div style={{ ...rowDim, ...highlightedCellStyle, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={statusPrimaryBadge}>{statusPrimary}</span>
                              {hasInstruction && <span title="Instructed" aria-label="Instructed" style={instructionTag}>Instructed</span>}
                              {!hasInstruction && hasDeal && <span title="Pitched" aria-label="Pitched" style={dealTag}>Pitched</span>}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Sentinel for infinite scroll */}
            {visibleGroupCount < dayGroups.length && <div ref={sentinelRef} style={{ height: 1 }} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnquiriesReport;
