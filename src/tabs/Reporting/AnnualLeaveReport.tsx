import React, { useMemo, useState } from "react";
import { 
  DatePicker, 
  DefaultButton, 
  Stack, 
  IDatePickerStyles, 
  IButtonStyles,
  DayOfWeek
} from "@fluentui/react";
import { colours } from "../../app/styles/colours";
import { useTheme } from "../../app/functionality/ThemeContext";
import { TeamData } from "../../app/functionality/types";
import './ManagementDashboard.css';

export interface AnnualLeaveRecord {
  request_id: number;
  fe: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_taken: number;
  leave_type?: string;
  rejection_notes?: string;
  hearing_confirmation?: boolean;
  hearing_details?: string;
}

interface Props {
  data: AnnualLeaveRecord[];
  teamData: TeamData[];
}

const UNPAID_LEAVE_CAP = 5;

const formatDate = (date?: Date) => (date ? date.toLocaleDateString("en-GB") : "");

function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const start = new Date(date);
  if (date.getMonth() < 3) {
    start.setFullYear(year - 1, 3, 1);
  } else {
    start.setFullYear(year, 3, 1);
  }
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 1);
  end.setMonth(2, 31);
  return { start, end };
}

// Team button styling to match Management Dashboard
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

const AnnualLeaveReport: React.FC<Props> = ({ data, teamData }) => {
  const { isDarkMode } = useTheme();
  const { start: fyStart, end: fyEnd } = getFinancialYear();
  const [startDate, setStartDate] = useState<Date | undefined>(fyStart);
  const [endDate, setEndDate] = useState<Date | undefined>(fyEnd);
  const [selectedInitials, setSelectedInitials] = useState<string[]>([]);

  // Get active team members
  const activePeople = useMemo(
    () =>
      teamData
        .filter((t) => (t.status || "").toLowerCase() === "active" && t.Initials)
        .map((t) => ({
          initials: t.Initials!,
          fullName: t["Full Name"] || t.Initials!,
          holiday_entitlement: t.holiday_entitlement ?? 25,
        })),
    [teamData]
  );

  const toggleInitials = (initials: string) => {
    setSelectedInitials((prev) =>
      prev.includes(initials)
        ? prev.filter((i) => i !== initials)
        : [...prev, initials]
    );
  };

  const clearAll = () => setSelectedInitials([]);

  const filteredPeople = useMemo(() => {
    return selectedInitials.length
      ? activePeople.filter((p) => selectedInitials.includes(p.initials))
      : activePeople;
  }, [activePeople, selectedInitials]);

  // Filter leave data by date range
  const filteredLeave = useMemo(() => {
    return data.filter((row: AnnualLeaveRecord) => {
      const leaveDate = new Date(row.start_date);
      const afterStart = !startDate || leaveDate >= startDate;
      const beforeEnd = !endDate || leaveDate <= endDate;
      const personMatch = selectedInitials.length === 0 || selectedInitials.includes(row.fe);
      const statusMatch = (row.status || "").toLowerCase() === "booked";
      return afterStart && beforeEnd && personMatch && statusMatch;
    });
  }, [data, startDate, endDate, selectedInitials]);

  // Calculate leave statistics per person
  const leaveData = useMemo(() => {
    return filteredPeople.map((person) => {
      const personLeave = filteredLeave.filter((l) => l.fe === person.initials);
      
      const standardTaken = personLeave
        .filter((l) => (l.leave_type || "").toLowerCase() === "standard")
        .reduce((sum, l) => sum + (l.days_taken || 0), 0);
        
      const unpaidTaken = personLeave
        .filter((l) => (l.leave_type || "").toLowerCase() === "unpaid")
        .reduce((sum, l) => sum + (l.days_taken || 0), 0);

      const standardRemaining = Math.max(0, person.holiday_entitlement - standardTaken);
      const unpaidRemaining = Math.max(0, UNPAID_LEAVE_CAP - unpaidTaken);
      const totalTaken = standardTaken + unpaidTaken;
      
      return {
        initials: person.initials,
        fullName: person.fullName,
        entitlement: person.holiday_entitlement,
        standardTaken,
        standardRemaining,
        unpaidTaken,
        unpaidRemaining,
        totalTaken,
      };
    });
  }, [filteredPeople, filteredLeave]);

  // Helper function to get detailed leave breakdown for tooltips
  const getLeaveBreakdown = (personInitials: string, leaveType?: 'taken' | 'remaining' | 'unpaid' | 'total') => {
    const personLeave = filteredLeave.filter(l => l.fe === personInitials);
    const person = filteredPeople.find(p => p.initials === personInitials);
    
    if (!person) return '';
    
    const standardLeave = personLeave.filter(l => (l.leave_type || "").toLowerCase() === "standard");
    const unpaidLeave = personLeave.filter(l => (l.leave_type || "").toLowerCase() === "unpaid");
    
    const standardTaken = standardLeave.reduce((sum, l) => sum + (l.days_taken || 0), 0);
    const unpaidTaken = unpaidLeave.reduce((sum, l) => sum + (l.days_taken || 0), 0);
    
    switch (leaveType) {
      case 'taken':
        if (standardLeave.length === 0) return 'No standard leave taken';
        return `Standard Leave Taken:\n${standardLeave.map(l => 
          `• ${new Date(l.start_date).toLocaleDateString('en-GB')} - ${new Date(l.end_date).toLocaleDateString('en-GB')}: ${l.days_taken} days (${l.reason})`
        ).join('\n')}`;
        
      case 'remaining':
        const remaining = Math.max(0, person.holiday_entitlement - standardTaken);
        return `Remaining Leave:\n• Entitlement: ${person.holiday_entitlement} days\n• Taken: ${standardTaken} days\n• Remaining: ${remaining} days`;
        
      case 'unpaid':
        if (unpaidLeave.length === 0) return 'No unpaid leave taken';
        return `Unpaid Leave:\n${unpaidLeave.map(l => 
          `• ${new Date(l.start_date).toLocaleDateString('en-GB')} - ${new Date(l.end_date).toLocaleDateString('en-GB')}: ${l.days_taken} days (${l.reason})`
        ).join('\n')}\n• Unpaid cap: ${UNPAID_LEAVE_CAP} days`;
        
      case 'total':
        const totalDays = standardTaken + unpaidTaken;
        return `Total Leave Taken:\n• Standard: ${standardTaken} days\n• Unpaid: ${unpaidTaken} days\n• Total: ${totalDays} days`;
        
      default:
        return `${person.fullName}\n• Entitlement: ${person.holiday_entitlement} days\n• Standard taken: ${standardTaken} days\n• Unpaid taken: ${unpaidTaken} days`;
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    return leaveData.reduce(
      (acc, row) => ({
        entitlement: acc.entitlement + row.entitlement,
        standardTaken: acc.standardTaken + row.standardTaken,
        standardRemaining: acc.standardRemaining + row.standardRemaining,
        unpaidTaken: acc.unpaidTaken + row.unpaidTaken,
        unpaidRemaining: acc.unpaidRemaining + row.unpaidRemaining,
        totalTaken: acc.totalTaken + row.totalTaken,
      }),
      { entitlement: 0, standardTaken: 0, standardRemaining: 0, unpaidTaken: 0, unpaidRemaining: 0, totalTaken: 0 }
    );
  }, [leaveData]);

  const allTeamsSelected = selectedInitials.length === 0 || selectedInitials.length === activePeople.length;

  const handleSelectAllTeams = () => {
    if (allTeamsSelected) {
      return;
    }
    setSelectedInitials([]);
  };

  return (
    <div className={`management-dashboard-container animate-dashboard ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Header - minimal like Management Dashboard */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ 
          fontSize: 20, 
          fontWeight: 700, 
          margin: 0,
          color: colours.highlight 
        }}>
          Annual Leave Report
        </h1>
      </div>

      {/* Filter Section - exactly like Management Dashboard */}
      <div className="filter-section" style={{
        background: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : '#FFFFFF',
        borderRadius: 12,
        border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.06)'}`,
        boxShadow: isDarkMode ? '0 2px 10px rgba(0, 0, 0, 0.22)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
        padding: '20px 22px',
      }}>
        <div className="date-filter-wrapper">
          <div className="date-pickers">
            <Stack horizontal tokens={{ childrenGap: 16 }}>
              <DatePicker
                label="From"
                value={startDate}
                onSelectDate={(date) => setStartDate(date || undefined)}
                formatDate={formatDate}
                allowTextInput
                firstDayOfWeek={DayOfWeek.Monday}
                placeholder="Start Date"
              />
              <DatePicker
                label="To"
                value={endDate}
                onSelectDate={(date) => setEndDate(date || undefined)}
                formatDate={formatDate}
                allowTextInput
                firstDayOfWeek={DayOfWeek.Monday}
                placeholder="End Date"
              />
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
          <DefaultButton
            text="Clear"
            onClick={clearAll}
            styles={getTeamButtonStyles(isDarkMode, selectedInitials.length === 0)}
          />
          {activePeople.map((p) => (
            <DefaultButton
              key={p.initials}
              text={p.initials}
              onClick={() => toggleInitials(p.initials)}
              styles={getTeamButtonStyles(isDarkMode, selectedInitials.includes(p.initials))}
            />
          ))}
        </div>
      </div>

      {/* Leave Table - using Management Dashboard grid structure */}
      <div className="metrics-table">
        <div className="metrics-table-header">
          <span title="Employee name and overview">Employee</span>
          <span title="Annual leave entitlement in days">Entitlement</span>
          <span title="Standard annual leave taken (hover rows for details)">Taken</span>
          <span title="Standard annual leave remaining">Remaining</span>
          <span title="Unpaid leave taken (hover rows for details)">Unpaid</span>
          <span title="Total leave taken (standard + unpaid)">Total</span>
        </div>
        {leaveData.length === 0 && (
          <div className="metrics-table-row animate-table-row">
            <span>No team members selected</span>
            <span>0</span>
            <span>0</span>
            <span>0</span>
            <span>0</span>
            <span>0</span>
          </div>
        )}
        {leaveData.map((row, index) => (
          <div 
            key={`${row.initials}-${startDate?.getTime()}-${endDate?.getTime()}`} 
            className="metrics-table-row animate-table-row" 
            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
          >
            <span title={getLeaveBreakdown(row.initials)}>{row.fullName}</span>
            <span title={`Annual leave entitlement: ${row.entitlement} days`}>{row.entitlement}</span>
            <span 
              style={{ color: row.standardTaken > row.entitlement ? '#dc2626' : 'inherit' }}
              title={getLeaveBreakdown(row.initials, 'taken')}
            >
              {row.standardTaken}
            </span>
            <span 
              style={{ color: row.standardRemaining <= 5 ? '#f59e0b' : '#059669' }}
              title={getLeaveBreakdown(row.initials, 'remaining')}
            >
              {row.standardRemaining}
            </span>
            <span 
              style={{ color: row.unpaidTaken > 0 ? '#dc2626' : 'inherit' }}
              title={getLeaveBreakdown(row.initials, 'unpaid')}
            >
              {row.unpaidTaken}
            </span>
            <span 
              style={{ fontWeight: 600 }}
              title={getLeaveBreakdown(row.initials, 'total')}
            >
              {row.totalTaken}
            </span>
          </div>
        ))}
        <div 
          className="metrics-table-row animate-table-row" 
          style={{ animationDelay: `${Math.min(leaveData.length * 0.05, 0.5)}s` }}
        >
          <span title="Summary totals for all selected team members">Total</span>
          <span title={`Total entitlement: ${totals.entitlement} days across ${leaveData.length} team members`}>{totals.entitlement}</span>
          <span title={`Total standard leave taken: ${totals.standardTaken} days`}>{totals.standardTaken}</span>
          <span title={`Total standard leave remaining: ${totals.standardRemaining} days`}>{totals.standardRemaining}</span>
          <span title={`Total unpaid leave taken: ${totals.unpaidTaken} days`}>{totals.unpaidTaken}</span>
          <span title={`Total leave taken: ${totals.totalTaken} days (standard + unpaid)`}>{totals.totalTaken}</span>
        </div>
      </div>

      {/* Footer timestamp - like Management Dashboard */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        padding: '8px 12px',
        fontSize: 12,
        opacity: 0.7,
        fontWeight: 500,
      }}>
        Last Refreshed: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default AnnualLeaveReport;