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

const RANGE_OPTIONS: RangeOption[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const getDatePickerStyles = (isDarkMode: boolean): Partial<IDatePickerStyles> => {
  const baseBorder = isDarkMode ? 'rgba(148, 163, 184, 0.32)' : 'rgba(13, 47, 96, 0.2)';
  const hoverBorder = isDarkMode ? 'rgba(135, 176, 255, 0.6)' : 'rgba(13, 47, 96, 0.32)';
  const focusBorder = isDarkMode ? '#87f3f3' : colours.highlight;
  const backgroundColour = isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(248, 250, 252, 0.95)';

  return {
    root: { maxWidth: 210 },
    textField: {
      root: {
        fontFamily: 'Raleway, sans-serif',
      },
      fieldGroup: {
        height: 34,
        borderRadius: 999,
        border: `1px solid ${baseBorder}`,
        background: backgroundColour,
        padding: '0 12px',
        boxShadow: 'none',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      },
      fieldGroupHovered: {
        border: `1px solid ${hoverBorder}`,
        background: isDarkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(240, 244, 248, 0.95)',
      },
      fieldGroupFocused: {
        border: `1px solid ${focusBorder}`,
        background: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(236, 244, 251, 0.96)',
      },
      field: {
        fontSize: 13,
        color: isDarkMode ? colours.dark.text : colours.light.text,
        fontFamily: 'Raleway, sans-serif',
      },
    },
    icon: {
      color: isDarkMode ? colours.highlight : colours.missedBlue,
    },
    callout: {
      fontSize: 13,
      borderRadius: 10,
      boxShadow: isDarkMode ? '0 6px 14px rgba(0, 0, 0, 0.32)' : '0 4px 12px rgba(15, 23, 42, 0.12)',
    },
    wrapper: { borderRadius: 10 },
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
  minHeight: 30,
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
  const activeBackground = colours.highlight;
  const inactiveBackground = isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'transparent';

  return {
    root: {
      borderRadius: 999,
      minHeight: 30,
  padding: '0 8px',
      fontWeight: 600,
      fontSize: 12,
      border: active
        ? `1px solid ${isDarkMode ? 'rgba(135, 176, 255, 0.5)' : 'rgba(13, 47, 96, 0.28)'}`
        : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`,
      background: active ? activeBackground : inactiveBackground,
      color: active ? '#ffffff' : (isDarkMode ? '#E2E8F0' : colours.missedBlue),
      boxShadow: 'none',
      fontFamily: 'Raleway, sans-serif',
    },
    rootHovered: {
      background: active ? '#2f7cb3' : (isDarkMode ? 'rgba(15, 23, 42, 0.86)' : 'rgba(54, 144, 206, 0.1)'),
    },
    rootPressed: {
      background: active ? '#266795' : (isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(54, 144, 206, 0.14)'),
    },
  };
};

const summaryChipStyle = (isDarkMode: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 8,
  background: isDarkMode ? 'rgba(15, 23, 42, 0.72)' : '#ffffff',
  border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0'}`,
  boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
  minWidth: 100,
  rowGap: 4,
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
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
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
    matters.filter((entry) => withinRange(parseDateValue(entry.OpenDate ?? entry.CloseDate ?? '')))
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
        return Boolean(member['Initials']) && isActive;
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
      const enquiriesForMember = filteredEnquiries.filter((enquiry) => enquiriesHandledBy(enquiry, member.initials));
      const mattersForMember = filteredMatters.filter((matterRecord) => matterOwnedBy(matterRecord, member.initials));
      const wipForMember = filteredWip.filter((record) => {
        const matchId = member.clioId && record.user_id !== undefined
          ? String(record.user_id) === member.clioId
          : false;
        return matchId;
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

  const totals = metricsByMember.reduce(
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

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
        <div style={summaryChipStyle(isDarkMode)}>
          <span style={{ fontSize: 12, opacity: 0.65 }}>Last Refresh</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {lastRefreshTimestamp ? formatDateTag(new Date(lastRefreshTimestamp)) : 'Pending'}
          </span>
        </div>
      </div>

      {isFetching && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Spinner label="Refreshing data" />
        </div>
      )}

      <div className="metrics-table">
        <div className="metrics-table-header">
          <span>Team</span>
          <span>Enquiries</span>
          <span>Matters</span>
          <span>WIP (h)</span>
          <span>WIP (£)</span>
          <span>Collected</span>
        </div>
        {metricsByMember.length === 0 && (
          <div className="metrics-table-row animate-table-row">
            <span>No team members selected</span>
            <span>0</span>
            <span>0</span>
            <span>0h</span>
            <span>£0</span>
            <span>£0</span>
          </div>
        )}
        {metricsByMember.map((row, index) => (
          <div key={row.initials} className="metrics-table-row animate-table-row" style={{ animationDelay: `${index * 0.05}s` }}>
            <span>{row.displayName}</span>
            <span>{row.enquiries.toLocaleString('en-GB')}</span>
            <span>{row.matters.toLocaleString('en-GB')}</span>
            <span>{formatHours(row.wipHours)}</span>
            <span>{formatCurrency(row.wipValue)}</span>
            <span>{formatCurrency(row.collected)}</span>
          </div>
        ))}
        <div className="metrics-table-row animate-table-row" style={{ animationDelay: `${metricsByMember.length * 0.05}s` }}>
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