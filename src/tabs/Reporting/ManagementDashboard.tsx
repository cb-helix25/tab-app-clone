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
import './ManagementDashboard.css';

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
  user_id: number;
}

export interface WIP {
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

const getTeamButtonStyles = (isDarkMode: boolean, active: boolean): IButtonStyles => {
  const activeBackground = active 
    ? `linear-gradient(135deg, ${colours.highlight} 0%, #2f7cb3 100%)`
    : (isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'transparent');
  
  const activeBorder = active
    ? `2px solid ${isDarkMode ? '#87ceeb' : colours.highlight}`
    : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`;

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
      color: active ? '#ffffff' : (isDarkMode ? '#E2E8F0' : colours.missedBlue),
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
  triggerRefresh,
  lastRefreshTimestamp,
  isFetching = false,
}) => {
  const { isDarkMode } = useTheme();
  const [{ start: rangeStart, end: rangeEnd }, setRangeState] = useState(() => computeRange('month'));
  const [rangeKey, setRangeKey] = useState<RangeKey>('month');
  const [startDate, setStartDate] = useState<Date | undefined>(() => rangeStart);
  const [endDate, setEndDate] = useState<Date | undefined>(() => rangeEnd);
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

  const filteredWip = useMemo(() => (
    wip.filter((entry) => withinRange(parseDateValue(entry.created_at)))
  ), [wip, activeStart, activeEnd]);

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
      return {
        initials: member.initials,
        displayName: member.display,
        enquiries: enquiriesForMember.length,
        matters: mattersForMember.length,
        wipHours: wipForMember.reduce((total, record) => total + safeNumber(record.quantity_in_hours), 0),
        wipValue: wipForMember.reduce((total, record) => total + safeNumber(record.total), 0),
        collected: feesForMember.reduce((total, record) => total + safeNumber(record.payment_allocated), 0),
      } as MemberMetrics;
    })
  ), [visibleMembers, filteredEnquiries, filteredMatters, filteredWip, filteredFees]);

  // Sort the metrics by the selected column and direction
  const sortedMetricsByMember = useMemo(() => {
    const sorted = [...metricsByMember].sort((a, b) => {
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
            gap: 12,
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 500,
            color: isDarkMode ? 'rgba(226, 232, 240, 0.7)' : 'rgba(15, 23, 42, 0.6)',
            fontFamily: 'Monaco, Consolas, monospace',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '6px 12px',
            borderRadius: 6,
            background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
            border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)'}`,
            userSelect: 'none',
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
                Last Refreshed: {lastRefreshTimestamp ? new Date(lastRefreshTimestamp).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : 'Pending'}
              </>
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
            styles={getTeamButtonStyles(isDarkMode, allTeamsSelected)}
          />
          {teamMembers.map((member) => (
            <DefaultButton
              key={member.initials}
              text={member.initials}
              onClick={() => toggleTeamSelection(member.initials)}
              styles={getTeamButtonStyles(isDarkMode, selectedTeams.includes(member.initials))}
            />
          ))}
        </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={summaryChipStyle(isDarkMode)}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>Enquiries</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{summaryTotals.enquiries.toLocaleString('en-GB')}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>Matters</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{summaryTotals.matters.toLocaleString('en-GB')}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>WIP Hours</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{formatHours(summaryTotals.wipHours)}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>WIP (£)</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(summaryTotals.wipValue)}</span>
        </div>
        <div style={summaryChipStyle(isDarkMode)}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>Collected</span>
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
        {sortedMetricsByMember.map((row, index) => (
          <div key={row.initials} className="metrics-table-row animate-table-row" style={{ animationDelay: `${index * 0.05}s` }}>
            <span>{row.displayName}</span>
            <span>{row.enquiries.toLocaleString('en-GB')}</span>
            <span>{row.matters.toLocaleString('en-GB')}</span>
            <span>{formatHours(row.wipHours)}</span>
            <span>{formatCurrency(row.wipValue)}</span>
            <span>{formatCurrency(row.collected)}</span>
          </div>
        ))}
        <div className="metrics-table-row animate-table-row" style={{ animationDelay: `${sortedMetricsByMember.length * 0.05}s` }}>
          <span>Total</span>
          <span>{totals.enquiries.toLocaleString('en-GB')}</span>
          <span>{totals.matters.toLocaleString('en-GB')}</span>
          <span>{formatHours(totals.wipHours)}</span>
          <span>{formatCurrency(totals.wipValue)}</span>
          <span>{formatCurrency(totals.collected)}</span>
        </div>
      </div>

      {triggerRefresh && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryButton
            text={isFetching ? 'Refreshing…' : 'Refresh datasets'}
            onClick={triggerRefresh}
            disabled={isFetching}
            styles={{
              root: {
                borderRadius: 10,
                minWidth: 0,
                padding: '0 14px',
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;