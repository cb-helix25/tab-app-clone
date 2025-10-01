import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  DatePicker,
  DayOfWeek,
  DefaultButton,
  IButtonStyles,
  IDatePickerStyles,
  PrimaryButton,
  Spinner,
  Stack,
} from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import type { Enquiry, Matter, POID, TeamData, UserData } from '../../app/functionality/types';
import type { AnnualLeaveRecord } from './AnnualLeaveReport';
import { debugLog, debugWarn } from '../../utils/debug';
import './ManagementDashboard.css';

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
  user_id: number;
}

export interface WIP {
  date?: string; // YYYY-MM-DD format date field from Clio/SQL
  created_at: string;
  total?: number;
  quantity_in_hours?: number;
  user_id?: number;
  // When sourced from Clio API, user is nested
  user?: { id?: number | string };
}

interface ManagementDashboardProps {
  enquiries?: Enquiry[] | null;
  allMatters?: Matter[] | null;
  wip?: WIP[] | null | undefined;
  recoveredFees?: RecoveredFee[] | null;
  teamData?: TeamData[] | null;
  userData?: UserData[] | null;
  poidData?: POID[] | null;
  annualLeave?: AnnualLeaveRecord[] | null;
  triggerRefresh?: () => void;
  lastRefreshTimestamp?: number;
  isFetching?: boolean;
}

type RangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface RangeOption {
  key: RangeKey;
  label: string;
}

interface MemberMetrics {
  initials: string;
  displayName: string;
  enquiries: number;
  matters: number;
  wipHours: number;
  wipValue: number;
  collected: number;
  targetHours?: number;
  trendDirection?: 'up' | 'down' | 'neutral' | 'away';
}

type SortColumn = 'displayName' | 'enquiries' | 'matters' | 'wipHours' | 'wipValue' | 'collected';
type SortDirection = 'asc' | 'desc';

const RANGE_OPTIONS: RangeOption[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

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
      }
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
            transform: 'translateY(-1px) !important',
          },
          ':focus-within': {
            border: `1px solid ${focusBorder} !important`,
            background: `${focusBackground} !important`,
            boxShadow: isDarkMode 
              ? `0 0 0 3px rgba(135, 206, 235, 0.1), 0 4px 12px rgba(0, 0, 0, 0.25) !important`
              : `0 0 0 3px rgba(54, 144, 206, 0.1), 0 2px 8px rgba(15, 23, 42, 0.15) !important`,
            transform: 'translateY(-1px) !important',
          }
        }
      },
      field: {
        fontSize: '14px !important',
        color: `${isDarkMode ? colours.dark.text : colours.light.text} !important`,
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

const getRangeButtonStyles = (isDarkMode: boolean, active: boolean): IButtonStyles => {
  const activeBackground = colours.highlight;
  const inactiveBackground = isDarkMode ? 'rgba(148, 163, 184, 0.16)' : 'transparent';

  return {
    root: {
      borderRadius: 999,
      border: active
        ? `1px solid ${isDarkMode ? 'rgba(135, 176, 255, 0.5)' : 'rgba(13, 47, 96, 0.32)'}`
        : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.28)' : 'rgba(13, 47, 96, 0.18)'}`,
  padding: '0 12px',
  minHeight: 32,
  height: 32,
      fontWeight: 600,
      fontSize: 13,
      color: active ? '#ffffff' : (isDarkMode ? '#E2E8F0' : colours.missedBlue),
      background: active ? activeBackground : inactiveBackground,
      boxShadow: 'none',
      fontFamily: 'Raleway, sans-serif',
    },
    rootHovered: {
      background: active ? '#2f7cb3' : (isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(54, 144, 206, 0.12)'),
    },
    rootPressed: {
      background: active ? '#266795' : (isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(54, 144, 206, 0.16)'),
    },
  };
};

const getTeamButtonStyles = (isDarkMode: boolean, active: boolean, hasWorked: boolean = true): IButtonStyles => {
  const activeBackground = active 
    ? `linear-gradient(135deg, ${colours.highlight} 0%, #2f7cb3 100%)`
    : (isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'transparent');
  
  const activeBorder = active
    ? `2px solid ${isDarkMode ? '#87ceeb' : colours.highlight}`
    : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`;

  // Greyed out styling when member hasn't worked
  const greyedOut = !hasWorked;
  const opacity = greyedOut ? 0.4 : 1;
  const textColor = active ? '#ffffff' : 
    greyedOut ? (isDarkMode ? '#64748B' : '#94A3B8') :
    (isDarkMode ? '#E2E8F0' : colours.missedBlue);

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
        ? (isDarkMode ? '0 2px 8px rgba(54, 144, 206, 0.3)' : '0 2px 8px rgba(54, 144, 206, 0.25)')
        : 'none',
      fontFamily: 'Raleway, sans-serif',
      transform: active ? 'translateY(-1px)' : 'none',
      transition: 'all 0.2s ease',
    },
    rootHovered: {
      background: active 
        ? `linear-gradient(135deg, #2f7cb3 0%, #266795 100%)` 
        : (isDarkMode ? 'rgba(15, 23, 42, 0.86)' : 'rgba(54, 144, 206, 0.1)'),
      transform: 'translateY(-1px)',
      boxShadow: active 
        ? (isDarkMode ? '0 4px 12px rgba(54, 144, 206, 0.4)' : '0 4px 12px rgba(54, 144, 206, 0.35)')
        : (isDarkMode ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(15, 23, 42, 0.05)'),
    },
    rootPressed: {
      background: active 
        ? `linear-gradient(135deg, #266795 0%, #1e5a7a 100%)` 
        : (isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(54, 144, 206, 0.14)'),
      transform: 'translateY(0)',
    },
  };
};

const summaryChipStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: 10,
  background: isDarkMode ? 'rgba(15, 23, 42, 0.72)' : '#ffffff',
  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0'}`,
  boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
  textAlign: 'center' as const,
  rowGap: 6,
  width: '100%',
});

const computeRange = (range: RangeKey): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      const day = now.getDay();
      const diff = (day + 6) % 7; // Monday as start
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterStart, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'year': {
      // Financial year: 1 April to 31 March
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11 (0 = January)
      
      if (currentMonth >= 3) { // April onwards (month 3+)
        // We're in the financial year that started this calendar year
        start.setFullYear(currentYear, 3, 1); // 1 April this year
      } else {
        // We're in Jan/Feb/Mar - still in the financial year that started last calendar year
        start.setFullYear(currentYear - 1, 3, 1); // 1 April last year
      }
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'all':
    default:
      return { start: new Date(0), end };
  }

  return { start, end };
};

const computePreviousRange = (range: RangeKey, currentStart: Date, currentEnd: Date): { start: Date; end: Date } | null => {
  if (range === 'all') return null;

  const start = new Date();
  const end = new Date();

  switch (range) {
    case 'today': {
      // Previous working day
      const prevDay = new Date(currentStart);
      prevDay.setDate(prevDay.getDate() - 1);
      // Skip weekends
      while (prevDay.getDay() === 0 || prevDay.getDay() === 6) {
        prevDay.setDate(prevDay.getDate() - 1);
      }
      start.setTime(prevDay.getTime());
      start.setHours(0, 0, 0, 0);
      end.setTime(prevDay.getTime());
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'week': {
      // Previous week, accounting for partial weeks
      const currentDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const weekStart = new Date(currentStart);
      weekStart.setDate(weekStart.getDate() - 7);
      
      start.setTime(weekStart.getTime());
      end.setTime(weekStart.getTime());
      end.setDate(end.getDate() + currentDays - 1);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      // Previous month - get the full previous month
      const prevMonth = new Date(currentStart);
      prevMonth.setMonth(prevMonth.getMonth() - 1, 1); // Set to 1st of previous month
      start.setTime(prevMonth.getTime());
      start.setHours(0, 0, 0, 0);
      
      // End of previous month
      end.setTime(prevMonth.getTime());
      end.setMonth(end.getMonth() + 1, 0); // Last day of previous month
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'quarter': {
      // Previous quarter - get the full previous quarter
      const prevQuarter = new Date(currentStart);
      prevQuarter.setMonth(prevQuarter.getMonth() - 3, 1); // Set to 1st of quarter start month
      start.setTime(prevQuarter.getTime());
      start.setHours(0, 0, 0, 0);
      
      // End of previous quarter
      end.setTime(prevQuarter.getTime());
      end.setMonth(end.getMonth() + 3, 0); // Last day of previous quarter
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'year': {
      // Previous financial year
      const prevYear = new Date(currentStart);
      prevYear.setFullYear(prevYear.getFullYear() - 1);
      start.setTime(prevYear.getTime());
      start.setHours(0, 0, 0, 0);
      
      // End of previous financial year (day before current year starts)
      end.setTime(currentStart.getTime());
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    }
    default:
      return null;
  }

  return { start, end };
};

// Helper function to format date range for display
const formatDateRange = (start: Date, end: Date): string => {
  const formatOptions: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
  };
  
  const startStr = start.toLocaleDateString('en-GB', formatOptions);
  const endStr = end.toLocaleDateString('en-GB', formatOptions);
  
  if (startStr === endStr) return startStr;
  return `${startStr} - ${endStr}`;
};

// Helper function to get range label
const getRangeLabel = (range: RangeKey): string => {
  switch (range) {
    case 'today': return 'Today';
    case 'week': return 'This Week';
    case 'month': return 'This Month';
    case 'quarter': return 'This Quarter';
    case 'year': return 'This Year';
    case 'all': return 'All Time';
    default: return 'Custom';
  }
};

// Helper function to get previous range label
const getPreviousRangeLabel = (range: RangeKey): string => {
  switch (range) {
    case 'today': return 'Previous Working Day';
    case 'week': return 'Previous Week';
    case 'month': return 'Previous Month';
    case 'quarter': return 'Previous Quarter';
    case 'year': return 'Previous Year';
    default: return 'Previous Period';
  }
};

const parseDateValue = (input: unknown): Date | null => {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return null;
  }
  const trimmed = input.trim();
  const normalised = trimmed.includes('/') && !trimmed.includes('T')
    ? (() => {
      const parts = trimmed.split('/');
      if (parts.length !== 3) {
        return trimmed;
      }
      const [day, month, year] = parts;
      return `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    })()
    : trimmed;
  const candidate = new Date(normalised);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

const formatDateForPicker = (date?: Date | null): string => {
  if (!date) {
    return '';
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const parseDatePickerInput = (value?: string | null): Date | null => (
  value ? parseDateValue(value) : null
);

const matchesInitials = (value: unknown, initials: string): boolean => {
  if (!initials || typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase().includes(initials.toLowerCase());
};

// Normalise a full name: letters only, lowercase
const normalizeName = (name?: string | null): string => (
  typeof name === 'string' ? name.replace(/[^a-zA-Z]/g, '').toLowerCase() : ''
);

// Known display name corrections from legacy data
const NAME_MAP: Record<string, string> = {
  'Samuel Packwood': 'Sam Packwood',
  'Bianca ODonnell': "Bianca O'Donnell",
};

const mapNameIfNeeded = (name?: string | null): string => {
  if (!name) return '';
  return NAME_MAP[name] ?? name;
};

const displayName = (record?: TeamData | null): string => {
  if (!record) {
    return 'Unknown';
  }
  return (
    record['Nickname']
    || record['Full Name']
    || record['First']
    || record['Last']
    || record['Initials']
    || 'Unknown'
  );
};

const formatHours = (hours: number): string => {
  if (hours <= 0) {
    return '0h';
  }
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes > 0 ? `${whole}h ${minutes}m` : `${whole}h`;
};

// Calculate working days between two dates (excluding weekends and basic UK bank holidays)
const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  // Basic UK bank holidays for 2024-2025 (simplified - could be made more dynamic)
  const bankHolidays = [
    '2024-01-01', '2024-03-29', '2024-04-01', '2024-05-06', '2024-05-27', '2024-08-26', '2024-12-25', '2024-12-26',
    '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-05', '2025-05-26', '2025-08-25', '2025-12-25', '2025-12-26'
  ];
  
  const bankHolidaySet = new Set(bankHolidays);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];
    
    // Skip weekends (0 = Sunday, 6 = Saturday) and bank holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !bankHolidaySet.has(dateString)) {
      workingDays++;
    }
  }
  
  return workingDays;
};

// Determine trend direction based on actual vs target hours
const getTrendDirection = (actualHours: number, targetHours: number): 'up' | 'down' | 'neutral' => {
  if (targetHours === 0) return 'neutral';
  const performance = actualHours / targetHours;
  if (performance > 1.0) return 'up'; // Any amount above target
  if (performance < 1.0) return 'down'; // Any amount below target
  return 'neutral'; // Exactly at target (very rare)
};

// Get trend arrow and color
const getTrendArrow = (direction: 'up' | 'down' | 'neutral' | 'away'): string => {
  switch (direction) {
    case 'up': return '↗';
    case 'down': return '↘';
    case 'away': return '✈'; // Travel/away icon
    default: return '';
  }
};

const getTrendColor = (direction: 'up' | 'down' | 'neutral' | 'away', isDarkMode: boolean): string => {
  switch (direction) {
    case 'up': return '#10B981'; // Green
    case 'down': return '#EF4444'; // Red
    case 'away': return isDarkMode ? '#94A3B8' : '#64748B'; // Blue-gray for away
    default: return isDarkMode ? '#9CA3AF' : '#6B7280'; // Gray
  }
};

const formatCurrency = (amount: number): string => {
  if (amount === 0) {
    return '£0';
  }
  if (Math.abs(amount) < 1000) {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (Math.abs(amount) < 1000000) {
    return `£${(amount / 1000).toFixed(1)}k`;
  }
  return `£${(amount / 1000000).toFixed(2)}m`;
};

const formatDateTag = (date: Date | null): string => {
  if (!date) {
    return 'n/a';
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const enquiriesHandledBy = (enquiry: Enquiry, initials: string): boolean => (
  matchesInitials(enquiry.Point_of_Contact, initials)
  || matchesInitials(enquiry.Call_Taker, initials)
);

const matterOwnedBy = (matter: Matter, initials: string): boolean => (
  matchesInitials(matter.ResponsibleSolicitor, initials)
  || matchesInitials(matter.OriginatingSolicitor, initials)
);

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({
  enquiries: rawEnquiries,
  allMatters: rawMatters,
  wip: rawWip,
  recoveredFees: rawFees,
  teamData: rawTeam,
  userData: rawUsers,
  annualLeave: rawAnnualLeave,
  triggerRefresh,
  lastRefreshTimestamp,
  isFetching = false,
}) => {
  // Add CSS animation for spinning refresh icon
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('refreshSpinAnimation')) {
      const style = document.createElement('style');
      style.id = 'refreshSpinAnimation';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const { isDarkMode } = useTheme();
  const [{ start: rangeStart, end: rangeEnd }, setRangeState] = useState(() => computeRange('week'));
  const [rangeKey, setRangeKey] = useState<RangeKey>('week');
  const [startDate, setStartDate] = useState<Date | undefined>(() => rangeStart);
  const [endDate, setEndDate] = useState<Date | undefined>(() => rangeEnd);
  const [hoveredMetric, setHoveredMetric] = useState<{ type: string; x: number; y: number } | null>(null);
  const [hoveredMember, setHoveredMember] = useState<{ 
    member: MemberMetrics; 
    previousData?: any; 
    x: number; 
    y: number 
  } | null>(null);

  // Sync range calculation when rangeKey changes (but not if using custom dates)
  React.useEffect(() => {
    const newRange = computeRange(rangeKey);
    setRangeState(newRange);
    // Only update custom dates if they match the old range (not manually set)
    if (startDate?.getTime() === rangeStart.getTime() || !startDate) {
      setStartDate(newRange.start);
    }
    if (endDate?.getTime() === rangeEnd.getTime() || !endDate) {
      setEndDate(newRange.end);
    }
  }, [rangeKey]);

  // Check if member was completely away during the period (for daily/weekly views)
  const wasCompletelyAway = (startDate: Date, endDate: Date, memberInitials: string): boolean => {
    if (!rawAnnualLeave) return false;
    
    const workingDays = calculateWorkingDays(startDate, endDate);
    if (workingDays === 0) return false; // No working days in period
    
    const memberLeave = rawAnnualLeave.filter(record => 
      record.fe === memberInitials && 
      (record.status.toLowerCase().includes('approved') || record.status.toLowerCase().includes('confirmed'))
    );
    
    let totalLeaveDays = 0;
    
    for (const leave of memberLeave) {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      
      // Check if leave period overlaps with our date range
      const overlapStart = leaveStart > startDate ? leaveStart : startDate;
      const overlapEnd = leaveEnd < endDate ? leaveEnd : endDate;
      
      if (overlapStart <= overlapEnd) {
        // Calculate working days within the overlap period
        const overlapLeaveDays = calculateWorkingDays(overlapStart, overlapEnd);
        totalLeaveDays += overlapLeaveDays;
      }
    }
    
    // Return true if ALL working days in the period were leave days
    return totalLeaveDays >= workingDays;
  };

  // Calculate leave days for a team member within the specified date range
  const calculateLeaveDays = (startDate: Date, endDate: Date, memberInitials: string, rangeKey: RangeKey): number => {
    if (!rawAnnualLeave) return 0;
    
    // For daily and weekly views, don't subtract leave days if completely away
    // (we'll grey out the indicator instead)
    if ((rangeKey === 'today' || rangeKey === 'week') && wasCompletelyAway(startDate, endDate, memberInitials)) {
      return 0; // Don't reduce target, we'll handle this in trend calculation
    }
    
    // For longer periods (month, quarter, year), subtract actual leave days
    const memberLeave = rawAnnualLeave.filter(record => 
      record.fe === memberInitials && 
      (record.status.toLowerCase().includes('approved') || record.status.toLowerCase().includes('confirmed'))
    );
    
    let totalLeaveDays = 0;
    
    for (const leave of memberLeave) {
      const leaveStart = new Date(leave.start_date);
      const leaveEnd = new Date(leave.end_date);
      
      // Check if leave period overlaps with our date range
      const overlapStart = leaveStart > startDate ? leaveStart : startDate;
      const overlapEnd = leaveEnd < endDate ? leaveEnd : endDate;
      
      if (overlapStart <= overlapEnd) {
        // Calculate working days within the overlap period
        const overlapLeaveDays = calculateWorkingDays(overlapStart, overlapEnd);
        totalLeaveDays += overlapLeaveDays;
      }
    }
    
    return totalLeaveDays;
  };

  // Calculate target hours for a team member (6 hours per working day, minus leave days for longer periods)
  const calculateTargetHours = (startDate: Date, endDate: Date, memberInitials: string): number => {
    const workingDays = calculateWorkingDays(startDate, endDate);
    const leaveDays = calculateLeaveDays(startDate, endDate, memberInitials, rangeKey);
    const availableDays = Math.max(0, workingDays - leaveDays);
    const targetHours = availableDays * 6; // 6 hours per working day
    
    return targetHours;
  };
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const next = computeRange(rangeKey);
    setRangeState(next);
    setStartDate(next.start);
    setEndDate(next.end);
  }, [rangeKey]);

  const enquiries = rawEnquiries ?? [];
  const matters = rawMatters ?? [];
  const wip = rawWip ?? [];
  const fees = rawFees ?? [];
  const team = rawTeam ?? [];

  const activeStart = startDate ?? rangeStart;
  const activeEnd = endDate ?? rangeEnd;

  const withinRange = (value: Date | null): boolean => {
    if (!value) {
      return false;
    }
    const endOfDay = new Date(activeEnd);
    endOfDay.setHours(23, 59, 59, 999);
    return value >= activeStart && value <= endOfDay;
  };

  const filteredEnquiries = useMemo(() => (
    enquiries.filter((entry) => withinRange(parseDateValue(entry.Touchpoint_Date)))
  ), [enquiries, activeStart, activeEnd]);

  const filteredMatters = useMemo(() => (
    matters.filter((entry) => {
      const openDate = (entry as any)['Open Date'] ?? entry.OpenDate;
      const closeDate = (entry as any)['Close Date'] ?? entry.CloseDate;
      const dateToCheck = openDate ?? closeDate ?? '';
      const parsedDate = parseDateValue(dateToCheck);
      return withinRange(parsedDate);
    })
  ), [matters, activeStart, activeEnd]);

  const filteredWip = useMemo(() => {
    // Debug: Check first few WIP entries
    const sampleWip = wip.slice(0, 5);
    console.log('📋 Sample WIP entries:', sampleWip.map(e => ({
      date: e.date,
      created_at: e.created_at,
      hours: e.quantity_in_hours,
      parsed: parseDateValue(e.date || e.created_at)?.toISOString().split('T')[0]
    })));
    
    // Check for entries with date field (our Clio entries)
    const withDateField = wip.filter(e => e.date).slice(0, 3);
    console.log('📅 Entries with date field:', withDateField.map(e => ({
      date: e.date,
      created_at: e.created_at,
      hours: e.quantity_in_hours
    })));
    
    const filtered = wip.filter((entry) => {
      // Prefer date field (YYYY-MM-DD from Clio) over created_at for more accurate filtering
      const dateValue = entry.date || entry.created_at;
      const parsed = parseDateValue(dateValue);
      const inRange = withinRange(parsed);
      return inRange;
    });
    
    // Debug: Log WIP filtering for current range
    console.log('🔍 WIP Filtering:', {
      totalWip: wip.length,
      filtered: filtered.length,
      rangeStart: activeStart.toISOString().split('T')[0],
      rangeEnd: activeEnd.toISOString().split('T')[0],
      sampleFiltered: filtered.slice(0, 3).map(e => ({ date: e.date, created_at: e.created_at, hours: e.quantity_in_hours })),
      totalHours: filtered.reduce((sum, e) => sum + (e.quantity_in_hours || 0), 0)
    });
    
    return filtered;
  }, [wip, activeStart, activeEnd]);

  const filteredFees = useMemo(() => (
    fees.filter((entry) => withinRange(parseDateValue(entry.payment_date)))
  ), [fees, activeStart, activeEnd]);

  const teamMembers = useMemo(() => (
    team
      .filter((member) => {
        const statusValueRaw = typeof member.status === 'string'
          ? member.status
          : typeof (member as Record<string, unknown>)['Status'] === 'string'
            ? String((member as Record<string, unknown>)['Status'])
            : undefined;
        const isActive = statusValueRaw ? statusValueRaw.toLowerCase() === 'active' : false;
        const roleValueRaw = (member as Record<string, unknown>)['Role'] 
          ? String((member as Record<string, unknown>)['Role'])
          : undefined;
        const isFeeEarningRole = roleValueRaw && ['Partner', 'Associate Solicitor', 'Solicitor', 'Paralegal'].includes(roleValueRaw);
        return Boolean(member['Initials']) && isActive && isFeeEarningRole;
      })
      .map((member) => ({
        initials: member['Initials'] ?? '',
        record: member,
        display: displayName(member),
        clioId: member['Clio ID'] ? String(member['Clio ID']) : undefined,
      }))
      .sort((a, b) => a.display.localeCompare(b.display))
  ), [team]);

  const visibleMembers = selectedTeams.length > 0
    ? teamMembers.filter((member) => selectedTeams.includes(member.initials))
    : teamMembers;

  const metricsByMember: MemberMetrics[] = useMemo(() => (
    visibleMembers.map((member) => {
      const memberEmail = (member.record as Record<string, unknown>)['Email']
        ? String((member.record as Record<string, unknown>)['Email']).toLowerCase()
        : undefined;
      const memberFullName = (member.record as Record<string, unknown>)['Full Name']
        ? String((member.record as Record<string, unknown>)['Full Name'])
        : member.display;

      // Enquiries: prefer email equality when available; otherwise fallback to initials containment
      const enquiriesForMember = filteredEnquiries.filter((enquiry) => {
        if (memberEmail && typeof enquiry.Point_of_Contact === 'string') {
          return enquiry.Point_of_Contact.toLowerCase() === memberEmail;
        }
        return enquiriesHandledBy(enquiry, member.initials);
      });

      // Matters: match by normalized full name against Originating/Responsible Solicitor with legacy name map
      const normalizedMemberName = normalizeName(memberFullName);
      const mattersForMember = filteredMatters.filter((m) => {
        const rawOriginating = mapNameIfNeeded((m as any)['Originating Solicitor'] ?? (m as any).OriginatingSolicitor);
        const rawResponsible = mapNameIfNeeded((m as any)['Responsible Solicitor'] ?? (m as any).ResponsibleSolicitor);
        const normalizedOriginating = normalizeName(rawOriginating);
        const normalizedResponsible = normalizeName(rawResponsible);
        return (
          normalizedMemberName !== '' &&
          (normalizedOriginating === normalizedMemberName || normalizedResponsible === normalizedMemberName)
        );
      });

      // WIP: support DB shape (user_id) and Clio API shape (user.id)
      const wipForMember = filteredWip.filter((record) => {
        if (!member.clioId) return false;
        const flat = record.user_id != null ? String(record.user_id) : undefined;
        const nested = record.user?.id != null ? String(record.user.id) : undefined;
        return flat === member.clioId || nested === member.clioId;
      });
      const feesForMember = filteredFees.filter((record) => (
        member.clioId ? String(record.user_id ?? '') === member.clioId : false
      ));
      const wipHours = wipForMember.reduce((total, record) => total + safeNumber(record.quantity_in_hours), 0);
      const targetHours = startDate && endDate ? calculateTargetHours(startDate, endDate, member.initials) : 0;
      
      // Check if member was completely away for daily/weekly views
      const completelyAway = startDate && endDate && 
        (rangeKey === 'today' || rangeKey === 'week') && 
        wasCompletelyAway(startDate, endDate, member.initials);
      
      // Check if member has 0 hours but had leave days (should be neutral, not penalized)
      const hadLeaveWithNoWork = wipHours === 0 && startDate && endDate && 
        rawAnnualLeave && rawAnnualLeave.some(record => {
          if (record.fe !== member.initials) return false;
          if (!(record.status.toLowerCase().includes('approved') || record.status.toLowerCase().includes('confirmed'))) return false;
          
          const leaveStart = new Date(record.start_date);
          const leaveEnd = new Date(record.end_date);
          
          // Check if leave period overlaps with our date range
          return leaveStart <= endDate && leaveEnd >= startDate;
        });
      
      let trendDirection: 'up' | 'down' | 'neutral' | 'away';
      if (completelyAway) {
        trendDirection = 'away';
      } else if (hadLeaveWithNoWork) {
        trendDirection = 'neutral';
      } else if (targetHours === 0 && wipHours > 0) {
        // If target calculation failed but they have work hours, show as above target
        trendDirection = 'up';
      } else {
        trendDirection = getTrendDirection(wipHours, targetHours);
      }
      
      return {
        initials: member.initials,
        displayName: member.display,
        enquiries: enquiriesForMember.length,
        matters: mattersForMember.length,
        wipHours,
        wipValue: wipForMember.reduce((total, record) => total + safeNumber(record.total), 0),
        collected: feesForMember.reduce((total, record) => total + safeNumber(record.payment_allocated), 0),
        targetHours,
        trendDirection,
      } as MemberMetrics;
    })
  ), [visibleMembers, filteredEnquiries, filteredMatters, filteredWip, filteredFees]);

  // Sort the metrics by the selected column and direction
  const sortedMetricsByMember = useMemo(() => {
    const sorted = [...metricsByMember].sort((a, b) => {
      // First, separate active (has work) from inactive (no work) members
      const aHasWork = a.wipHours > 0;
      const bHasWork = b.wipHours > 0;
      
      // Active members always come before inactive members
      if (aHasWork && !bHasWork) return -1;
      if (!aHasWork && bHasWork) return 1;
      
      // Within the same group (active or inactive), sort by the selected column
      let aValue: string | number = a[sortColumn];
      let bValue: string | number = b[sortColumn];

      // For string comparison (displayName), use locale compare
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? result : -result;
      }

      // For numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortDirection === 'asc' ? result : -result;
      }

      return 0;
    });
    return sorted;
  }, [metricsByMember, sortColumn, sortDirection]);

  const totals = sortedMetricsByMember.reduce(
    (acc, row) => ({
      enquiries: acc.enquiries + row.enquiries,
      matters: acc.matters + row.matters,
      wipHours: acc.wipHours + row.wipHours,
      wipValue: acc.wipValue + row.wipValue,
      collected: acc.collected + row.collected,
    }),
    { enquiries: 0, matters: 0, wipHours: 0, wipValue: 0, collected: 0 },
  );

  const summaryTotals = {
    enquiries: filteredEnquiries.length,
    matters: filteredMatters.length,
    wipHours: filteredWip.reduce((total, record) => total + safeNumber(record.quantity_in_hours), 0),
    wipValue: filteredWip.reduce((total, record) => total + safeNumber(record.total), 0),
    collected: filteredFees.reduce((total, record) => total + safeNumber(record.payment_allocated), 0),
  };

  // Calculate previous period metrics for comparison
  const previousRange = computePreviousRange(rangeKey, startDate || rangeStart, endDate || rangeEnd);
  
  // Debug logging for previous range
  debugLog('🔍 Previous Range Debug:', {
    rangeKey,
    currentStart: startDate || rangeStart,
    currentEnd: endDate || rangeEnd,
    previousRange,
    hasPreviousRange: !!previousRange
  });
  
  const previousMetrics = useMemo(() => {
    if (!previousRange) {
      debugLog('❌ No previous range calculated');
      return null;
    }

    debugLog('📊 Calculating previous metrics for range:', previousRange);

    const prevEnquiries = rawEnquiries?.filter((e: any) => {
      const date = parseDateValue(e.Touchpoint_Date);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const prevMatters = rawMatters?.filter((m: any) => {
      // Align with current-period filtering: prefer Open Date, fallback to Close Date
      const openDate = (m as any)['Open Date'] ?? m.OpenDate;
      const closeDate = (m as any)['Close Date'] ?? m.CloseDate;
      const dateToCheck = openDate ?? closeDate ?? '';
      const date = parseDateValue(dateToCheck);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const prevWip = rawWip?.filter((w: any) => {
      const date = parseDateValue(w.created_at);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const prevFees = rawFees?.filter((f: any) => {
      const date = parseDateValue(f.payment_date);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    return {
      enquiries: prevEnquiries.length,
      matters: prevMatters.length,
      wipHours: prevWip.reduce((total: number, record: any) => total + safeNumber(record.quantity_in_hours), 0),
      wipValue: prevWip.reduce((total: number, record: any) => total + safeNumber(record.total), 0),
      collected: prevFees.reduce((total: number, record: any) => total + safeNumber(record.payment_allocated), 0),
    };
  }, [previousRange, rawEnquiries, rawMatters, rawWip, rawFees]);

  // Calculate previous period metrics for individual team members
  const previousMemberMetrics = useMemo(() => {
    if (!previousRange || !teamMembers.length) return new Map();

    const prevEnquiries = rawEnquiries?.filter((e: any) => {
      const date = parseDateValue(e.Touchpoint_Date);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const prevMatters = rawMatters?.filter((m: any) => {
      // Align with current-period filtering: prefer Open Date, fallback to Close Date
      const openDate = (m as any)['Open Date'] ?? m.OpenDate;
      const closeDate = (m as any)['Close Date'] ?? m.CloseDate;
      const dateToCheck = openDate ?? closeDate ?? '';
      const date = parseDateValue(dateToCheck);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const prevWip = rawWip?.filter((w: any) => {
      const date = parseDateValue(w.created_at);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const prevFees = rawFees?.filter((f: any) => {
      const date = parseDateValue(f.payment_date);
      return date && date >= previousRange.start && date <= previousRange.end;
    }) || [];

    const memberMap = new Map();

    teamMembers.forEach((member) => {
      // Calculate previous period metrics for this member
      const prevEnquiriesForMember = prevEnquiries.filter((enquiry: any) => {
        const memberEmail = member.record.Email?.toLowerCase();
        if (memberEmail && enquiry.Point_of_Contact?.toLowerCase() === memberEmail) {
          return true;
        }
        return enquiriesHandledBy(enquiry, member.initials);
      });

      const prevMattersForMember = prevMatters.filter((matter: any) => 
        matterOwnedBy(matter, member.initials)
      );

      const prevWipForMember = prevWip.filter((wipEntry: any) => {
        if (!member.clioId) return false;
        const flat = wipEntry.user_id != null ? String(wipEntry.user_id) : undefined;
        const nested = wipEntry.user?.id != null ? String(wipEntry.user.id) : undefined;
        return flat === member.clioId || nested === member.clioId;
      });

      const prevFeesForMember = prevFees.filter((fee: any) => {
        return member.clioId ? String(fee.user_id ?? '') === member.clioId : false;
      });

      const prevWipHours = prevWipForMember.reduce((total: number, record: any) => 
        total + safeNumber(record.quantity_in_hours), 0
      );
      const prevWipValue = prevWipForMember.reduce((total: number, record: any) => 
        total + safeNumber(record.total), 0
      );
      const prevCollected = prevFeesForMember.reduce((total: number, record: any) => 
        total + safeNumber(record.payment_allocated), 0
      );

      memberMap.set(member.initials, {
        enquiries: prevEnquiriesForMember.length,
        matters: prevMattersForMember.length,
        wipHours: prevWipHours,
        wipValue: prevWipValue,
        collected: prevCollected,
      });

      // Temporary debug for matters - remove after testing
      if (member.initials === 'CH' && prevMattersForMember.length === 0) {
        debugLog('CH matters debug:', {
          totalPrevMatters: prevMatters.length,
          prevMattersForMember: prevMattersForMember.length,
          memberInitials: member.initials,
          sampleMatters: prevMatters.slice(0, 3).map((m: any) => ({
            DateOpened: m.DateOpened,
            ResponsibleSolicitor: m.ResponsibleSolicitor,
            OriginatingSolicitor: m.OriginatingSolicitor
          }))
        });
      }
    });

    return memberMap;
  }, [previousRange, rawEnquiries, rawMatters, rawWip, rawFees, teamMembers]);

  // Helper function to calculate percentage change
  const calculateChange = (current: number, previous: number): { percentage: number; direction: 'up' | 'down' | 'neutral' } => {
    // If both are zero, no change
    if (current === 0 && previous === 0) {
      return { percentage: 0, direction: 'neutral' };
    }
    
    // If previous is zero but current has value, that's a new addition (not 100% increase)
    if (previous === 0 && current > 0) {
      return { percentage: current, direction: 'up' };
    }
    
    // If current is zero but previous had value, that's a complete drop
    if (current === 0 && previous > 0) {
      return { percentage: 100, direction: 'down' };
    }
    
    // Normal percentage calculation
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
    };
  };

  // Helper function to render trend indicator
  const renderTrendIndicator = (current: number, previous: number | undefined, type: 'count' | 'currency' | 'hours' = 'count', metricName: string) => {
    if (!previousMetrics || previous === undefined) return null;

    const change = calculateChange(current, previous);
    if (change.direction === 'neutral') return null;

    const color = change.direction === 'up' 
      ? (isDarkMode ? '#22c55e' : '#16a34a') 
      : (isDarkMode ? '#ef4444' : '#dc2626');

    const arrow = change.direction === 'up' ? '↗' : '↘';
    
    // Different display logic based on type
    let displayText: string;
    
    if (type === 'currency') {
      // For currency, show actual amount difference
      const difference = current - previous;
      const absChange = Math.abs(difference);
      if (absChange >= 1000) {
        displayText = `£${(absChange / 1000).toFixed(0)}k`;
      } else {
        displayText = `£${absChange.toFixed(0)}`;
      }
    } else if (type === 'hours') {
      // For hours, show hour difference for small changes, percentage for large
      const difference = Math.abs(current - previous);
      if (difference < 10) {
        displayText = `${difference.toFixed(1)}h`;
      } else {
        displayText = `${change.percentage.toFixed(0)}%`;
      }
    } else {
      // For counts (enquiries, matters), show numbers for small changes, percentages for large
      const difference = Math.abs(current - previous);
      if (previous === 0 && current > 0) {
        displayText = `+${current}`;
      } else if (current === 0 && previous > 0) {
        displayText = `${difference}`;
      } else if (difference <= 5) {
        displayText = `${difference}`;
      } else {
        displayText = `${change.percentage.toFixed(0)}%`;
      }
    }

    return (
      <span 
        style={{
          fontSize: 10,
          fontWeight: 600,
          color,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontFamily: 'Raleway, sans-serif',
          letterSpacing: '0.02em',
          cursor: 'help',
          padding: '2px 4px',
          borderRadius: 4,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoveredMetric({
            type: metricName,
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
        }}
        onMouseLeave={() => setHoveredMetric(null)}
        title={`Compare ${getRangeLabel(rangeKey)} vs ${getPreviousRangeLabel(rangeKey)}`}
      >
        {arrow} {displayText}
      </span>
    );
  };

  const handleRangeSelect = (key: RangeKey) => {
    setRangeKey(key);
  };

  const toggleTeamSelection = (initials: string) => {
    setSelectedTeams((prev) => (
      prev.includes(initials)
        ? prev.filter((item) => item !== initials)
        : [...prev, initials]
    ));
  };

  // Check if a team member has worked (has WIP hours) in the current date range
  const memberHasWorked = (memberInitials: string): boolean => {
    const memberMetric = metricsByMember.find(m => m.initials === memberInitials);
    return memberMetric ? memberMetric.wipHours > 0 : false;
  };

  const handleColumnSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn): JSX.Element => {
    const isActive = sortColumn === column;
    const iconStyle: React.CSSProperties = {
      marginLeft: '4px',
      fontSize: '8px',
      opacity: isActive ? 0.9 : 0.3,
      transition: 'opacity 0.2s ease',
      fontWeight: 'bold',
      color: 'currentColor',
    };

    if (!isActive) {
      return (
        <span style={iconStyle}>▸</span>
      );
    }

    return (
      <span style={iconStyle}>
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const dashboardThemeClass = isDarkMode ? 'dark-theme' : 'light-theme';
  const allTeamsSelected = selectedTeams.length === 0 || selectedTeams.length === teamMembers.length;

  const handleSelectAllTeams = () => {
    if (allTeamsSelected) {
      return;
    }
    setSelectedTeams([]);
  };

  return (
    <div className={`management-dashboard-container animate-dashboard ${dashboardThemeClass}`}>
      <div className="filter-section">
        <div className="date-filter-wrapper">
          <div className="date-pickers">
            <DatePicker
              label="From"
              styles={getDatePickerStyles(isDarkMode)}
              value={startDate}
              onSelectDate={(date) => setStartDate(date ?? undefined)}
              allowTextInput
              firstDayOfWeek={DayOfWeek.Monday}
              formatDate={formatDateForPicker}
              parseDateFromString={parseDatePickerInput}
            />
            <DatePicker
              label="To"
              styles={getDatePickerStyles(isDarkMode)}
              value={endDate}
              onSelectDate={(date) => setEndDate(date ?? undefined)}
              allowTextInput
              firstDayOfWeek={DayOfWeek.Monday}
              formatDate={formatDateForPicker}
              parseDateFromString={parseDatePickerInput}
            />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginLeft: 'auto',
          }}>
            {/* Refresh Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.4)'}`,
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              color: isDarkMode ? '#e2e8f0' : '#475569',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'Raleway, sans-serif',
              letterSpacing: '0.02em',
              userSelect: 'none',
              gap: 6,
            }}>
              {isFetching ? (
                <>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isDarkMode ? '#60a5fa' : colours.highlight,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  Refreshing
                </>
              ) : (
                <>
                  Last: {lastRefreshTimestamp ? new Date(lastRefreshTimestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit', 
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Pending'}
                </>
              )}
            </div>
            
            {/* Refresh Button */}
            {triggerRefresh && (
              <button
                onClick={triggerRefresh}
                disabled={isFetching}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.4)'}`,
                  background: isFetching 
                    ? (isDarkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(226, 232, 240, 0.6)')
                    : (isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'),
                  color: isFetching 
                    ? (isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)')
                    : (isDarkMode ? '#e2e8f0' : '#475569'),
                  cursor: isFetching ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: 14,
                }}
                title={isFetching ? 'Refreshing data...' : 'Refresh datasets'}
                aria-label={isFetching ? 'Refreshing data' : 'Refresh datasets'}
                onMouseEnter={(e) => {
                  if (!isFetching) {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(51, 65, 85, 0.9)' : 'rgba(248, 250, 252, 1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isFetching) {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{
                  display: 'inline-block',
                  animation: isFetching ? 'spin 1s linear infinite' : 'none',
                }}>
                  {isFetching ? '⟳' : '↻'}
                </span>
              </button>
            )}
          </div>
          <div className="date-range-buttons">
            <Stack horizontal tokens={{ childrenGap: 6 }}>
              {RANGE_OPTIONS.map(({ key, label }) => (
                <DefaultButton
                  key={key}
                  text={label}
                  onClick={() => handleRangeSelect(key)}
                  styles={getRangeButtonStyles(isDarkMode, rangeKey === key)}
                />
              ))}
            </Stack>
          </div>
        </div>
        <div className="team-slicer-buttons">
          <DefaultButton
            text="All team"
            onClick={handleSelectAllTeams}
            disabled={allTeamsSelected}
            styles={getTeamButtonStyles(isDarkMode, allTeamsSelected, true)}
          />
          {teamMembers.map((member) => (
            <DefaultButton
              key={member.initials}
              text={member.initials}
              onClick={() => toggleTeamSelection(member.initials)}
              title={memberHasWorked(member.initials) ? undefined : `${member.display || member.initials} has no WIP hours in this period`}
              styles={getTeamButtonStyles(isDarkMode, selectedTeams.includes(member.initials), memberHasWorked(member.initials))}
            />
          ))}
        </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={summaryChipStyle(isDarkMode)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>Enquiries</span>
            {renderTrendIndicator(summaryTotals.enquiries, previousMetrics?.enquiries, 'count', 'enquiries')}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{summaryTotals.enquiries.toLocaleString('en-GB')}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>Matters</span>
            {renderTrendIndicator(summaryTotals.matters, previousMetrics?.matters, 'count', 'matters')}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{summaryTotals.matters.toLocaleString('en-GB')}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>WIP Hours</span>
            {renderTrendIndicator(summaryTotals.wipHours, previousMetrics?.wipHours, 'hours', 'wipHours')}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{formatHours(summaryTotals.wipHours)}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>WIP (£)</span>
            {renderTrendIndicator(summaryTotals.wipValue, previousMetrics?.wipValue, 'currency', 'wipValue')}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(summaryTotals.wipValue)}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>Collected</span>
            {renderTrendIndicator(summaryTotals.collected, previousMetrics?.collected, 'currency', 'collected')}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(summaryTotals.collected)}</span>
        </div>
      </div>

      {isFetching && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Spinner label="Refreshing data" />
        </div>
      )}

      <div className="metrics-table">
        <div className="metrics-table-header">
          <span 
            onClick={() => handleColumnSort('displayName')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to sort by team member"
          >
            Team {getSortIcon('displayName')}
          </span>
          <span 
            onClick={() => handleColumnSort('enquiries')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to sort by enquiries"
          >
            Enquiries {getSortIcon('enquiries')}
          </span>
          <span 
            onClick={() => handleColumnSort('matters')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to sort by matters"
          >
            Matters {getSortIcon('matters')}
          </span>
          <span 
            onClick={() => handleColumnSort('wipHours')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to sort by WIP hours"
          >
            WIP (h) {getSortIcon('wipHours')}
          </span>
          <span 
            onClick={() => handleColumnSort('wipValue')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to sort by WIP value"
          >
            WIP (£) {getSortIcon('wipValue')}
          </span>
          <span 
            onClick={() => handleColumnSort('collected')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to sort by collected fees"
          >
            Collected {getSortIcon('collected')}
          </span>
        </div>
        {sortedMetricsByMember.length === 0 && (
          <div className="metrics-table-row animate-table-row">
            <span>No team members selected</span>
            <span>0</span>
            <span>0</span>
            <span>0h</span>
            <span>£0</span>
            <span>£0</span>
          </div>
        )}
        {sortedMetricsByMember.map((row, index) => {
          const isInactive = row.wipHours === 0;
          const prevRow = index > 0 ? sortedMetricsByMember[index - 1] : null;
          const isFirstInactive = isInactive && (prevRow?.wipHours || 0) > 0;
          
          return (
            <React.Fragment key={`${row.initials}-${startDate?.getTime()}-${endDate?.getTime()}-${rangeKey}`}>
              {isFirstInactive && (
                <div className="metrics-table-row" style={{
                  opacity: 0.6,
                  fontSize: '11px',
                  fontStyle: 'italic',
                  background: isDarkMode ? 'rgba(71, 85, 105, 0.1)' : 'rgba(148, 163, 184, 0.08)',
                  borderTop: `1px solid ${isDarkMode ? '#475569' : '#94A3B8'}`,
                  padding: '6px 12px',
                }}>
                  <span>— Inactive in this period —</span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div 
                className="metrics-table-row animate-table-row" 
                style={{ 
                  animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                  opacity: isInactive ? 0.4 : 1,
                  background: isInactive ? (isDarkMode ? 'rgba(71, 85, 105, 0.15)' : 'rgba(148, 163, 184, 0.1)') : 'transparent',
                  borderLeft: isInactive ? `3px solid ${isDarkMode ? '#475569' : '#94A3B8'}` : 'none',
                  paddingLeft: isInactive ? '9px' : '12px',
                  filter: isInactive ? 'grayscale(20%)' : 'none',
                  color: isInactive ? (isDarkMode ? '#64748B' : '#94A3B8') : 'inherit'
                }}
              >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span 
                style={{ 
                  cursor: 'help',
                  padding: '2px 4px',
                  borderRadius: 4,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const previousData = previousMemberMetrics.get(row.initials);
                  setHoveredMember({
                    member: row,
                    previousData,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }}
                onMouseLeave={() => setHoveredMember(null)}
              >
                {row.displayName}
              </span>
              {row.trendDirection && row.trendDirection !== 'neutral' && (
                <span 
                  style={{ 
                    color: getTrendColor(row.trendDirection, isDarkMode),
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title={
                    row.trendDirection === 'away' ? 'Away on leave' :
                    row.trendDirection === 'up' && (row.targetHours || 0) === 0 ? 'Above target (calculation issue)' :
                    row.trendDirection === 'up' ? `Performance: ${row.wipHours.toFixed(1)}h / ${(row.targetHours || 0).toFixed(1)}h target (${((row.wipHours / (row.targetHours || 1)) * 100).toFixed(1)}% of target)` :
                    row.trendDirection === 'down' ? `Performance: ${row.wipHours.toFixed(1)}h / ${(row.targetHours || 0).toFixed(1)}h target (${((row.wipHours / (row.targetHours || 1)) * 100).toFixed(1)}% of target)` :
                    `At target: ${row.wipHours.toFixed(1)}h / ${(row.targetHours || 0).toFixed(1)}h`
                  }
                >
                  {getTrendArrow(row.trendDirection)}
                  {row.trendDirection !== 'away' && row.targetHours && row.targetHours > 0 && (
                    <span style={{ 
                      fontSize: '9px', 
                      marginLeft: '2px',
                      opacity: 0.7,
                      fontWeight: 500
                    }}>
                      {((row.wipHours / row.targetHours) * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              )}
              {row.trendDirection === 'neutral' && row.wipHours === 0 && (
                <span 
                  style={{ 
                    color: getTrendColor('neutral', isDarkMode),
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title="No work due to leave"
                >
                  —
                </span>
              )}
            </span>
            <span>{row.enquiries.toLocaleString('en-GB')}</span>
            <span>{row.matters.toLocaleString('en-GB')}</span>
            <span 
              title={`WIP Hours: ${formatHours(row.wipHours)}\nTarget: ${formatHours(row.targetHours || 0)}\nDate Range: ${startDate?.toLocaleDateString('en-GB')} - ${endDate?.toLocaleDateString('en-GB')}\nPerformance: ${row.targetHours ? ((row.wipHours / row.targetHours) * 100).toFixed(1) : 'N/A'}% of target`}
            >
              {formatHours(row.wipHours)}
            </span>
            <span>{formatCurrency(row.wipValue)}</span>
            <span>{formatCurrency(row.collected)}</span>
          </div>
            </React.Fragment>
          );
        })}
        <div className="metrics-table-row animate-table-row" style={{ animationDelay: `${sortedMetricsByMember.length * 0.05}s` }}>
          <span>Total</span>
          <span>{totals.enquiries.toLocaleString('en-GB')}</span>
          <span>{totals.matters.toLocaleString('en-GB')}</span>
          <span>{formatHours(totals.wipHours)}</span>
          <span>{formatCurrency(totals.wipValue)}</span>
          <span>{formatCurrency(totals.collected)}</span>
        </div>
      </div>

      {/* Premium Hover Tooltip */}
      {hoveredMetric && previousRange && (
        <div
          style={{
            position: 'fixed',
            left: Math.max(20, Math.min(hoveredMetric.x, window.innerWidth - 300)), // Keep within screen bounds
            top: hoveredMetric.y - 20, // 20px above cursor
            transform: hoveredMetric.x > window.innerWidth - 140 ? 'translateX(-100%)' : 
                      hoveredMetric.x < 140 ? 'translateX(0%)' : 'translateX(-50%)', // Smart alignment
            zIndex: 10000,
            pointerEvents: 'none',
            maxWidth: 280,
          }}
        >
          <div style={{
            background: isDarkMode 
              ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.25)'}`,
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 12,
            fontFamily: 'Raleway, sans-serif',
            boxShadow: isDarkMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
            color: isDarkMode ? '#e2e8f0' : '#475569',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
              Period Comparison
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ opacity: 0.7, fontWeight: 500 }}>{getRangeLabel(rangeKey)}:</span>
                <span style={{ fontWeight: 600 }}>
                  {hoveredMetric.type === 'enquiries' ? summaryTotals.enquiries.toLocaleString('en-GB') :
                   hoveredMetric.type === 'matters' ? summaryTotals.matters.toLocaleString('en-GB') :
                   hoveredMetric.type === 'wipHours' ? formatHours(summaryTotals.wipHours) :
                   hoveredMetric.type === 'wipValue' ? formatCurrency(summaryTotals.wipValue) :
                   hoveredMetric.type === 'collected' ? formatCurrency(summaryTotals.collected) : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ opacity: 0.7, fontWeight: 500 }}>{getPreviousRangeLabel(rangeKey)}:</span>
                <span style={{ fontWeight: 600 }}>
                  {hoveredMetric.type === 'enquiries' ? (previousMetrics?.enquiries || 0).toLocaleString('en-GB') :
                   hoveredMetric.type === 'matters' ? (previousMetrics?.matters || 0).toLocaleString('en-GB') :
                   hoveredMetric.type === 'wipHours' ? formatHours(previousMetrics?.wipHours || 0) :
                   hoveredMetric.type === 'wipValue' ? formatCurrency(previousMetrics?.wipValue || 0) :
                   hoveredMetric.type === 'collected' ? formatCurrency(previousMetrics?.collected || 0) : ''}
                </span>
              </div>
              <div style={{ 
                height: 1, 
                background: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)', 
                margin: '6px 0' 
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ opacity: 0.6 }}>{formatDateRange(startDate || rangeStart, endDate || rangeEnd)}</span>
                <span style={{ opacity: 0.6 }}>vs {formatDateRange(previousRange.start, previousRange.end)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Team Member Hover Tooltip */}
      {hoveredMember && previousRange && (
        <div
          style={{
            position: 'fixed',
            left: Math.max(20, Math.min(hoveredMember.x, window.innerWidth - 340)), // Keep within screen bounds
            top: hoveredMember.y - 20, // 20px above cursor
            transform: hoveredMember.x > window.innerWidth - 160 ? 'translateX(-100%)' : 
                      hoveredMember.x < 160 ? 'translateX(0%)' : 'translateX(-50%)', // Smart alignment
            zIndex: 10000,
            pointerEvents: 'none',
            maxWidth: 320,
          }}
        >
          <div style={{
            background: isDarkMode 
              ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.25)'}`,
            borderRadius: 12,
            padding: '16px 20px',
            fontSize: 12,
            fontFamily: 'Raleway, sans-serif',
            boxShadow: isDarkMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
            color: isDarkMode ? '#e2e8f0' : '#475569',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, color: isDarkMode ? '#f1f5f9' : '#334155' }}>
              {hoveredMember.member.displayName}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px 16px', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, opacity: 0.8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metric</div>
              <div style={{ fontWeight: 600, opacity: 0.8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>{getRangeLabel(rangeKey)}</div>
              <div style={{ fontWeight: 600, opacity: 0.8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>{getPreviousRangeLabel(rangeKey)}</div>
              
              <div style={{ 
                gridColumn: '1 / -1', 
                height: 1, 
                background: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)', 
                margin: '4px 0' 
              }} />
              
              <div style={{ fontWeight: 500 }}>Enquiries</div>
              <div style={{ fontWeight: 600, textAlign: 'right' }}>{hoveredMember.member.enquiries}</div>
              <div style={{ fontWeight: 600, textAlign: 'right', opacity: 0.7 }}>{hoveredMember.previousData?.enquiries || 0}</div>
              
              <div style={{ fontWeight: 500 }}>Matters</div>
              <div style={{ fontWeight: 600, textAlign: 'right' }}>{hoveredMember.member.matters}</div>
              <div style={{ fontWeight: 600, textAlign: 'right', opacity: 0.7 }}>{hoveredMember.previousData?.matters || 0}</div>
              
              <div style={{ fontWeight: 500 }}>WIP Hours</div>
              <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatHours(hoveredMember.member.wipHours)}</div>
              <div style={{ fontWeight: 600, textAlign: 'right', opacity: 0.7 }}>{formatHours(hoveredMember.previousData?.wipHours || 0)}</div>
              
              <div style={{ fontWeight: 500 }}>WIP Value</div>
              <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(hoveredMember.member.wipValue)}</div>
              <div style={{ fontWeight: 600, textAlign: 'right', opacity: 0.7 }}>{formatCurrency(hoveredMember.previousData?.wipValue || 0)}</div>
              
              <div style={{ fontWeight: 500 }}>Collected</div>
              <div style={{ fontWeight: 600, textAlign: 'right' }}>{formatCurrency(hoveredMember.member.collected)}</div>
              <div style={{ fontWeight: 600, textAlign: 'right', opacity: 0.7 }}>{formatCurrency(hoveredMember.previousData?.collected || 0)}</div>
            </div>

            <div style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTop: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)'}`,
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: 10, 
              opacity: 0.6 
            }}>
              <span>{formatDateRange(startDate || rangeStart, endDate || rangeEnd)}</span>
              <span>{formatDateRange(previousRange.start, previousRange.end)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;