import React, { useState, useMemo } from 'react';
import { Icon, Text, DefaultButton } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { colours } from '../../app/styles/colours';
import helixLogo from '../../assets/dark blue mark.svg';
import { PiTreePalmFill } from 'react-icons/pi';

interface AttendanceRecord {
  Attendance_ID: number;
  Entry_ID: number;
  First_Name: string;
  Initials: string;
  Level: string;
  Week_Start: string;
  Week_End: string;
  ISO_Week: number;
  Attendance_Days: string;
  Confirmed_At: string | null;
  status?: string;
  isConfirmed?: boolean;
  isOnLeave?: boolean;
  // Some backends provide a comma-separated weekday list here
  Status?: string;
  // Some leave feeds might also attach dates here
  Leave_Start?: string;
  Leave_End?: string;
}

interface WeeklyAttendanceViewProps {
  isDarkMode: boolean;
  attendanceRecords: AttendanceRecord[];
  teamData: any[];
  userData: any;
  annualLeaveRecords: any[];
  futureLeaveRecords: any[];
  onAttendanceUpdated?: (updatedRecords: AttendanceRecord[]) => void;
  onOpenModal?: () => void;
  onDayUpdate?: (initials: string, day: string, status: 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office', week: 'current' | 'next') => void;
}

// Custom icon component to handle both FluentUI icons and custom images
const StatusIcon: React.FC<{ 
  status: 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office';
  size: string;
  color: string;
}> = ({ status, size, color }) => {
  if (status === 'office') {
    return (
      <img 
        src={helixLogo} 
        alt="Helix Office" 
        style={{ 
          width: size, 
          height: size,
          objectFit: 'contain',
          filter: `brightness(0) saturate(100%) invert(17%) sepia(41%) saturate(1344%) hue-rotate(195deg) brightness(95%) contrast(91%)` // Convert to missed blue #0d2f60
        }} 
      />
    );
  }
  
  if (status === 'away') {
    return (
      <PiTreePalmFill
        style={{ 
          color: color, 
          fontSize: size 
        }} 
      />
    );
  }
  
  const iconName = status === 'off-sick' ? 'Health' :
                   status === 'out-of-office' ? 'Suitcase' :
                   status === 'wfh' ? 'Home' : 'Help';
  
  return (
    <Icon 
      iconName={iconName}
      style={{ 
        color: color, 
        fontSize: size 
      }} 
    />
  );
};

const WeeklyAttendanceView: React.FC<WeeklyAttendanceViewProps> = ({
  isDarkMode,
  attendanceRecords,
  teamData,
  userData,
  annualLeaveRecords,
  futureLeaveRecords,
  onAttendanceUpdated,
  onOpenModal,
  onDayUpdate
}) => {
  console.log('WeeklyAttendanceView received data:', {
    attendanceRecordsCount: attendanceRecords?.length,
    teamDataCount: teamData?.length,
    sampleAttendanceRecord: attendanceRecords?.[0],
    sampleTeamMember: teamData?.[0],
    annualLeaveCount: annualLeaveRecords?.length,
    futureLeaveCount: futureLeaveRecords?.length,
    allAttendanceInitials: attendanceRecords?.map(r => r.Initials) || [],
    allTeamInitials: teamData?.map(t => t.Initials) || []
  });
  
  // State for view mode
  const [viewMode, setViewMode] = React.useState<'daily' | 'weekly'>('daily');
  
  // Filters state
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);

  // Helper function to check if someone is on leave for a specific week
  const isOnLeaveForWeek = (initials: string, weekOffset: 0 | 1 = 0): boolean => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    if (weekOffset === 1) {
      startOfWeek.setDate(startOfWeek.getDate() + 7);
    }
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
    
    const leaveRecords = weekOffset === 0 ? annualLeaveRecords : futureLeaveRecords;
    
    // Helper to extract possible date fields with varying keys
    const getDate = (obj: any, keys: string[]): Date | null => {
      for (const k of keys) {
        const v = obj[k];
        if (v) {
          const d = new Date(v);
          if (!isNaN(d.getTime())) return d;
        }
      }
      return null;
    };

    return leaveRecords.some((leave: any) => {
      const leaveInitials = (leave.Initials || leave.person || leave.Person || leave.initials || '').toString().trim().toUpperCase();
      if (leaveInitials !== initials.toString().trim().toUpperCase()) return false;
      
      // Check status is booked
      const leaveStatus = (leave.status || '').toString().toLowerCase();
      if (leaveStatus !== 'booked') return false;
      
      const leaveStart = getDate(leave, ['start_date', 'Leave_Start', 'Start', 'From', 'StartDate', 'start', 'leaveStart']);
      const leaveEnd = getDate(leave, ['end_date', 'Leave_End', 'End', 'To', 'EndDate', 'end', 'leaveEnd']);
      if (!leaveStart || !leaveEnd) return false;
      
      // Check if leave period overlaps with the week
      const overlaps = leaveStart <= endOfWeek && leaveEnd >= startOfWeek;
      
      // Debug log
      if (overlaps) {
        console.log(`DEBUG: ${initials} is on leave for week ${weekOffset}:`, {
          leaveStart: leaveStart.toDateString(),
          leaveEnd: leaveEnd.toDateString(),
          weekStart: startOfWeek.toDateString(),
          weekEnd: endOfWeek.toDateString(),
          status: leaveStatus
        });
      }
      
      return overlaps;
    });
  };

  // Helper function to get daily attendance pattern for a specific week
  const getDailyAttendance = (member: any, weekOffset: 0 | 1 = 0): ('wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office')[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Check if on leave for this specific week (from leave arrays)
    if (isOnLeaveForWeek(member.Initials, weekOffset)) {
      return ['out-of-office', 'out-of-office', 'out-of-office', 'out-of-office', 'out-of-office'];
    }

    // Fallback: trust member-level flags from attendance API
    const memberAwayFlag = (weekOffset === 0) && (member.isOnLeave === true || member.IsOnLeave === true);
    if (memberAwayFlag) {
      return ['out-of-office', 'out-of-office', 'out-of-office', 'out-of-office', 'out-of-office'];
    }
    
    // For next week (weekOffset = 1), we might have different data structure
    const attendanceKey = weekOffset === 0 ? 'attendanceDays' : 'nextWeekAttendanceDays';
    let attendanceDays: string = member[attendanceKey]
      || member.attendanceDays
      || member.Attendance_Days
      || member.Status
      || '';
    
    // Debug: Check what data we actually have
    console.log(`DEBUG: getDailyAttendance for ${member.Initials || member.First}:`, {
      weekOffset,
      attendanceKey,
      attendanceDays,
      memberStatus: member.Status,
      memberKeys: Object.keys(member)
    });
    
    // If still empty, try to find a matching attendance record by initials
    if (!attendanceDays || attendanceDays.toString().trim() === '') {
      const rec = attendanceRecords.find(r => r.Initials === member.Initials);
      if (rec) {
        attendanceDays = rec.Attendance_Days || rec.Status || '';
      }
    }

    // Normalize string
    const normalized = (attendanceDays || '').toString().trim();
    const normalizedLower = normalized.toLowerCase();

    // If attendance is just a status string (single token), apply to all days
    if (['wfh', 'office', 'away', 'off-sick', 'out-of-office'].includes(normalizedLower)) {
      return Array(5).fill(attendanceDays as 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office');
    }
    
    // If no attendance days specified, default to working from home
    if (!normalized) {
      return ['wfh', 'wfh', 'wfh', 'wfh', 'wfh'];
    }
    
    // Otherwise, parse a comma-separated list of weekdays
    const tokens = normalized
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean);

    return days.map((day) => {
      // Parse status from format like "Mon:office,Tue:wfh" or just office days like "Mon,Tue"
      const dayStatus = tokens.find(token => token.includes(':') && token.startsWith(day.slice(0, 3).toLowerCase()));
      if (dayStatus) {
        const [, status] = dayStatus.split(':');
        return status as 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office';
      }
      
      // Legacy format - if day is mentioned, assume office, otherwise wfh
      const isInOffice = tokens.includes(day.toLowerCase())
        || tokens.includes(day.slice(0, 3).toLowerCase());
      const status = isInOffice ? 'office' : 'wfh';
      return status;
    });
  };

  const getDayIcon = (status: 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office') => {
    switch (status) {
      case 'office': return 'helix-logo'; // Custom Helix logo for office
      case 'wfh': return 'Home';
      case 'away': return 'Vacation'; // Palm tree icon for away
      case 'off-sick': return 'Health';
      case 'out-of-office': return 'Suitcase';
      default: return 'Help';
    }
  };

  const getDayColor = (status: 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office') => {
    switch (status) {
      case 'office': return colours.missedBlue;  // In Office - Helix Dark Blue
      case 'wfh': return colours.green;       // WFH - Helix Green  
      case 'away': return colours.subtleGrey; // Away - Subtle Grey
      case 'off-sick': return colours.cta;  // Off Sick - CTA Red
      case 'out-of-office': return colours.orange; // Out-Of-Office - Orange
      default: return colours.grey;
    }
  };

  // Process team data
  const processedTeamData = useMemo(() => {
    return teamData.map(member => {
      const userInitials = userData?.displayName?.match(/\b\w/g)?.join('').toUpperCase() || 
                          userData?.mail?.substring(0, 2).toUpperCase() || 'UN';
                          
      const attendanceRecord = attendanceRecords.find(
        (rec) => rec.Initials === member.Initials
      );

      // Prefer Attendance_Days; fall back to backend Status or team member Status
      const attendanceDays = attendanceRecord?.Attendance_Days 
        || attendanceRecord?.Status 
        || (member as any).Status 
        || '';
      
      console.log('processedTeamData debug - ONE TIME ONLY:', {
        memberInitials: member.Initials,
        attendanceRecord,
        attendanceDays,
        attendanceRecordsCount: attendanceRecords.length,
        allAttendanceInitials: attendanceRecords.map(r => r.Initials),
        foundMatch: !!attendanceRecord
      });
      
      // Only log once by checking if this is the first member
      if (member.Initials === teamData[0]?.Initials) {
        console.log('FULL ATTENDANCE RECORDS:', attendanceRecords);
        console.log('FULL TEAM DATA:', teamData);
      }
      
      const isOnLeaveCurrentWeek = isOnLeaveForWeek(member.Initials, 0);
      const isOnLeaveNextWeek = isOnLeaveForWeek(member.Initials, 1);

      // Determine overall status for filtering purposes
      let status = 'unknown';
      if (isOnLeaveCurrentWeek) {
        status = 'out-of-office';
      } else if (attendanceDays.includes('Monday') || attendanceDays.includes('Tuesday') || 
                 attendanceDays.includes('Wednesday') || attendanceDays.includes('Thursday') || 
                 attendanceDays.includes('Friday')) {
        status = 'office';
      } else {
        status = 'home';
      }

      return {
        ...member,
        status,
        attendanceDays,
        isConfirmed: attendanceRecord?.Confirmed_At !== null,
        isUser: member.Initials === userInitials,
        isOnLeaveCurrentWeek,
        isOnLeaveNextWeek,
      };
    });
  }, [teamData, attendanceRecords, userData, annualLeaveRecords, futureLeaveRecords]);

  // Styles
  const containerStyle = (isDark: boolean) => mergeStyles({
    padding: '16px',
    background: isDark ? colours.dark.background : colours.light.background,
    color: isDark ? colours.dark.text : colours.light.text,
    borderRadius: '8px',
  });

  const weeklyCardStyle = (isDark: boolean, isUser: boolean) => mergeStyles({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '12px 16px',
    margin: '1px 0',
    background: isUser 
      ? (isDark ? `linear-gradient(135deg, ${colours.missedBlue}20 0%, ${colours.dark.cardBackground} 100%)` : `linear-gradient(135deg, ${colours.missedBlue}12 0%, ${colours.light.cardBackground} 100%)`)
      : (isDark ? colours.dark.cardBackground : colours.light.cardBackground),
    border: isUser 
      ? `3px solid ${colours.missedBlue}` 
      : `1px solid ${isDark ? colours.dark.border : colours.light.border}`,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    minHeight: '70px',
    position: 'relative',
    gap: '12px',
    boxShadow: isUser 
      ? (isDark ? `0 4px 16px rgba(13, 47, 96, 0.3)` : `0 4px 16px rgba(13, 47, 96, 0.2)`)
      : 'none',
    
    '&:hover': {
      background: isUser
        ? (isDark ? `linear-gradient(135deg, ${colours.missedBlue}35 0%, ${colours.dark.sectionBackground} 100%)` : `linear-gradient(135deg, ${colours.missedBlue}18 0%, ${colours.light.sectionBackground} 100%)`)
        : (isDark ? colours.dark.sectionBackground : colours.light.sectionBackground),
      transform: isUser ? 'translateY(-2px)' : 'none',
      boxShadow: isUser 
        ? (isDark ? `0 8px 24px rgba(13, 47, 96, 0.4)` : `0 8px 24px rgba(13, 47, 96, 0.25)`)
        : (isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)')
    },
    
    '&::before': isUser ? {
      content: '""',
      position: 'absolute',
      left: '-3px',
      top: '-3px',
      right: '-3px',
      bottom: '-3px',
      borderRadius: '8px',
      background: `linear-gradient(135deg, ${colours.missedBlue} 0%, ${colours.blue} 100%)`,
      zIndex: -1,
      opacity: 0.6
    } : {}
  });

  const nameStyle = (isDark: boolean, isUser: boolean) => mergeStyles({
    fontSize: '13px',
    fontWeight: isUser ? '700' : '500',
    color: isUser 
      ? colours.missedBlue 
      : (isDark ? colours.dark.text : colours.light.text),
    minWidth: '90px',
    maxWidth: '90px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textShadow: isUser ? '0 1px 2px rgba(13, 47, 96, 0.3)' : 'none'
  });

  const weekIconsStyle = mergeStyles({
    display: 'flex',
    gap: '3px',
    alignItems: 'center'
  });

  const dayIconStyle = (status: 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office') => mergeStyles({
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: getDayColor(status) + '20',
    border: `1px solid ${getDayColor(status)}`,
    fontSize: '9px',
    color: getDayColor(status),
    transition: 'all 0.15s ease'
  });

  const filterButtonStyle = (isActive: boolean) => mergeStyles({
    minWidth: '70px',
    height: '28px',
    fontSize: '12px',
    background: isActive ? colours.blue + '20' : 'transparent',
    border: `1px solid ${isActive ? colours.blue : (isDarkMode ? colours.dark.border : colours.light.border)}`,
    color: isActive ? colours.blue : (isDarkMode ? colours.dark.text : colours.light.text),
    
    '&:hover': {
      background: isActive ? colours.blue + '30' : (isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground)
    }
  });

  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setSelectedFilters(['all']);
    } else {
      const newFilters = selectedFilters.includes(filter)
        ? selectedFilters.filter(f => f !== filter && f !== 'all')
        : [...selectedFilters.filter(f => f !== 'all'), filter];
      
      setSelectedFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  // Get today's attendance status for a member
  const getTodayAttendance = (member: any): string => {
    const today = new Date();
    const dayIndex = today.getDay();
    
    // Convert Sunday (0) to Monday-based index (0-4 for Mon-Fri)
    const mondayBasedIndex = dayIndex === 0 ? -1 : dayIndex - 1;
    
    // Debug info
    console.log(`DEBUG: getTodayAttendance for ${member.Initials || member.First}:`, {
      today: today.toDateString(),
      dayIndex,
      mondayBasedIndex,
      isWeekend: mondayBasedIndex < 0 || mondayBasedIndex > 4
    });
    
    // Only show if it's a weekday (Monday-Friday)
    if (mondayBasedIndex < 0 || mondayBasedIndex > 4) {
      return member.status || 'home'; // Default for weekends
    }
    
    const currentWeekAttendance = getDailyAttendance(member, 0);
    const todayStatus = currentWeekAttendance[mondayBasedIndex] || member.status || 'home';
    
    console.log(`DEBUG: Today status for ${member.Initials || member.First}:`, {
      currentWeekAttendance,
      mondayBasedIndex,
      todayStatus
    });
    
    return todayStatus;
  };

  // Get tomorrow's attendance status for a member  
  const getTomorrowAttendance = (member: AttendanceRecord): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayIndex = tomorrow.getDay();
    
    // Convert Sunday (0) to Monday-based index (0-4 for Mon-Fri)
    const mondayBasedIndex = dayIndex === 0 ? -1 : dayIndex - 1;
    
    // Only show if it's a weekday (Monday-Friday)
    if (mondayBasedIndex < 0 || mondayBasedIndex > 4) {
      return member.status || 'home'; // Default for weekends
    }
    
    // Check if tomorrow is next week
    const today = new Date();
    const isNextWeek = tomorrow.getDate() < today.getDate() || 
                      (tomorrow.getDate() - today.getDate()) >= 7 ||
                      tomorrow.getMonth() !== today.getMonth();
    
    const weekOffset = isNextWeek ? 1 : 0;
    const weekAttendance = getDailyAttendance(member, weekOffset);
    const adjustedIndex = isNextWeek ? mondayBasedIndex : mondayBasedIndex;
    
    return weekAttendance[adjustedIndex] || member.status || 'home';
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (selectedFilters.includes('all') || selectedFilters.length === 0) {
      return processedTeamData;
    }

    return processedTeamData.filter(member => {
      const dailyAttendance = getDailyAttendance(member);
      
      // Day filters - show people who work on the selected days (any status)
      const dayFilters = selectedFilters.filter(f => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(f));
      if (dayFilters.length > 0) {
        const dayMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4 };
        const hasMatchingDay = dayFilters.some(day => {
          const dayIndex = dayMap[day as keyof typeof dayMap];
          // Show anyone who has any status on this day (not just office)
          return dayIndex >= 0 && dayIndex < dailyAttendance.length;
        });
        if (!hasMatchingDay) return false;
      }

      // Status filters - show people who have the selected status on ANY day
      const statusFilters = selectedFilters.filter(f => ['office-only', 'wfh-only', 'away-only', 'sick-only', 'ooo-only'].includes(f));
      if (statusFilters.length > 0) {
        const hasMatchingStatus = statusFilters.some(filter => {
          switch (filter) {
            case 'office-only':
              return dailyAttendance.some(day => day === 'office');
            case 'wfh-only':
              return dailyAttendance.some(day => day === 'wfh');
            case 'away-only':
              return dailyAttendance.some(day => day === 'out-of-office');
            case 'sick-only':
              return dailyAttendance.some(day => day === 'off-sick');
            case 'ooo-only':
              return dailyAttendance.some(day => day === 'out-of-office');
            default:
              return false;
          }
        });
        if (!hasMatchingStatus) return false;
      }

      return true;
    });
  }, [processedTeamData, selectedFilters]);

  return (
    <div className={containerStyle(isDarkMode)}>
      {/* Filter Controls */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '12px',
        background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
        border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
        borderRadius: '8px'
      }}>
        {/* View Mode Toggle */}
        <div style={{ 
          marginRight: '16px',
          paddingRight: '16px',
          borderRight: `1px solid ${isDarkMode ? '#4A5568' : '#E2E8F0'}`
        }}>
          <DefaultButton 
            text={viewMode === 'daily' ? 'Today' : 'Weekly'}
            iconProps={{ iconName: viewMode === 'daily' ? 'CalendarDay' : 'CalendarWeek' }}
            onClick={() => setViewMode(viewMode === 'daily' ? 'weekly' : 'daily')}
            styles={{ 
              root: {
                background: isDarkMode ? '#4299E1' : '#3182CE',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                ':hover': {
                  background: isDarkMode ? '#3182CE' : '#2C5AA0'
                }
              }
            }}
          />
        </div>
        
        <DefaultButton 
          text="All"
          onClick={() => toggleFilter('all')}
          styles={{ root: filterButtonStyle(selectedFilters.includes('all')) }}
        />

        {/* Day Filters Section */}
        <div style={{
          display: 'flex',
          gap: '2px',
          padding: '2px 4px',
          backgroundColor: isDarkMode ? 'rgba(74, 85, 104, 0.1)' : 'rgba(226, 232, 240, 0.15)',
          borderRadius: '4px',
          border: `1px solid ${isDarkMode ? 'rgba(74, 85, 104, 0.2)' : 'rgba(226, 232, 240, 0.3)'}`,
          marginLeft: '6px',
          marginRight: '6px'
        }}>
          <Text style={{ 
            fontSize: '10px', 
            fontWeight: '500',
            color: isDarkMode ? colours.dark.subText : colours.light.subText,
            alignSelf: 'center',
            marginRight: '2px',
            opacity: 0.7
          }}>
            Days:
          </Text>
          <DefaultButton 
            text="Mon"
            onClick={() => toggleFilter('monday')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('monday')) }}
          />
          
          <DefaultButton 
            text="Tue"
            onClick={() => toggleFilter('tuesday')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('tuesday')) }}
          />
          
          <DefaultButton 
            text="Wed"
            onClick={() => toggleFilter('wednesday')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('wednesday')) }}
          />
          
          <DefaultButton 
            text="Thu"
            onClick={() => toggleFilter('thursday')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('thursday')) }}
          />
          
          <DefaultButton 
            text="Fri"
            onClick={() => toggleFilter('friday')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('friday')) }}
          />
        </div>

        {/* Status Filters Section */}
        <div style={{
          display: 'flex',
          gap: '2px',
          padding: '2px 4px',
          backgroundColor: isDarkMode ? 'rgba(54, 144, 206, 0.05)' : 'rgba(54, 144, 206, 0.03)',
          borderRadius: '4px',
          border: `1px solid ${isDarkMode ? 'rgba(54, 144, 206, 0.15)' : 'rgba(54, 144, 206, 0.1)'}`,
        }}>
          <Text style={{ 
            fontSize: '10px', 
            fontWeight: '500',
            color: isDarkMode ? colours.dark.subText : colours.light.subText,
            alignSelf: 'center',
            marginRight: '2px',
            opacity: 0.7
          }}>
            Status:
          </Text>
          <DefaultButton 
            text="Office"
            onClick={() => toggleFilter('office-only')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('office-only')) }}
          />
          
          <DefaultButton 
            text="WFH"
            onClick={() => toggleFilter('wfh-only')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('wfh-only')) }}
          />
          
          <DefaultButton 
            text="Away"
            onClick={() => toggleFilter('away-only')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('away-only')) }}
          />
          
          <DefaultButton 
            text="Sick"
            onClick={() => toggleFilter('sick-only')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('sick-only')) }}
          />
          
          <DefaultButton 
            text="OOO"
            onClick={() => toggleFilter('ooo-only')}
            styles={{ root: filterButtonStyle(selectedFilters.includes('ooo-only')) }}
          />
        </div>
      </div>

      {/* Weekly Attendance Grid */}
      <div style={{ marginBottom: '12px' }}>
        {/* Team member grid with multiple columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '8px',
          maxWidth: '100%'
        }}>
          {viewMode === 'daily' ? (
            // Daily Summary View - Group by status
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {(() => {
                // Group people by today's status
                const statusGroups = filteredData.reduce((groups, member) => {
                  const todayStatus = getTodayAttendance(member);
                  if (!groups[todayStatus]) {
                    groups[todayStatus] = [];
                  }
                  groups[todayStatus].push(member);
                  return groups;
                }, {} as Record<string, typeof filteredData>);

                // Define status order and labels
                const statusOrder = ['wfh', 'office', 'away', 'off-sick', 'out-of-office'];
                const statusLabels = {
                  office: 'In Office',
                  wfh: 'Working From Home',
                  away: 'Away',
                  'off-sick': 'Off Sick',
                  'out-of-office': 'Out Of Office'
                };

                return statusOrder
                  .filter(status => statusGroups[status]?.length > 0)
                  .map(status => (
                    <div 
                      key={status}
                      style={{
                        background: isDarkMode ? '#2D3748' : '#FFFFFF',
                        border: `1px solid ${getDayColor(status as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office')}`,
                        borderRadius: '8px',
                        padding: '16px',
                        minWidth: '280px',
                        flex: '1'
                      }}
                    >
                      {/* Status Header */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: `1px solid ${isDarkMode ? '#4A5568' : '#E2E8F0'}`
                      }}>
                        <div 
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: `${getDayColor(status as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office')}20`, // Light fill - 20% opacity
                            border: `1px solid ${getDayColor(status as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office')}`, // Full opacity border
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <StatusIcon
                            status={status as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office'}
                            size="12px"
                            color={getDayColor(status as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office')}
                          />
                        </div>
                        <div>
                          <div style={{ 
                            fontWeight: '600', 
                            fontSize: '14px',
                            color: isDarkMode ? colours.dark.text : colours.light.text
                          }}>
                            {statusLabels[status as keyof typeof statusLabels]}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            color: isDarkMode ? colours.dark.subText : colours.light.subText
                          }}>
                            {statusGroups[status].length} {statusGroups[status].length === 1 ? 'person' : 'people'}
                          </div>
                        </div>
                      </div>

                      {/* People List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {statusGroups[status].map((member: any) => {
                          const tomorrowStatus = getTomorrowAttendance(member);
                          const tomorrowDifferent = tomorrowStatus !== status;
                          
                          return (
                            <div 
                              key={member.Initials}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: member.isUser 
                                  ? (isDarkMode ? 'rgba(74, 155, 79, 0.1)' : 'rgba(74, 155, 79, 0.05)')
                                  : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                              }}
                            >
                              <span style={{
                                fontSize: '13px',
                                fontWeight: member.isUser ? '700' : '400',
                                color: member.isUser ? colours.missedBlue : (isDarkMode ? colours.dark.text : colours.light.text)
                              }}>
                                {member.First || member.Initials}
                                {member.isUser && (
                                  <span style={{ 
                                    fontSize: '9px', 
                                    color: colours.missedBlue,
                                    marginLeft: '4px',
                                    fontWeight: '600',
                                    background: `${colours.missedBlue}15`,
                                    padding: '1px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    (you)
                                  </span>
                                )}
                              </span>
                              
                              {/* Tomorrow indicator - only show if different */}
                              {tomorrowDifferent && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                                  <span style={{ 
                                    fontSize: '8px', 
                                    color: isDarkMode ? colours.dark.subText : colours.light.subText
                                  }}>
                                    tomorrow:
                                  </span>
                                  <div 
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '2px',
                                      backgroundColor: getDayColor(tomorrowStatus as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office'),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title={`Tomorrow: ${tomorrowStatus}`}
                                  >
                                    <StatusIcon
                                      status={tomorrowStatus as 'office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office'}
                                      size="6px"
                                      color="white"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          ) : (
            // Weekly View - Multi-column grid
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '8px',
              maxWidth: '100%'
            }}>
              {filteredData
              .sort((a, b) => {
                // User first, then alphabetical by first name
                if (a.isUser && !b.isUser) return -1;
                if (!a.isUser && b.isUser) return 1;
                return (a.First || a.Initials).localeCompare(b.First || b.Initials);
              })
              .map(member => {
                // Weekly View - Full two weeks
                const currentWeekAttendance = getDailyAttendance(member, 0);
                const nextWeekAttendance = getDailyAttendance(member, 1);
                
                return (
                  <div 
                    key={member.Initials}
                    style={{
                      background: isDarkMode ? '#2D3748' : '#FFFFFF',
                      border: member.isUser 
                        ? (isDarkMode ? '1px solid #4A9B4F' : '1px solid #4A9B4F')
                        : (isDarkMode ? '1px solid #4A5568' : '1px solid #E2E8F0'),
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      minHeight: '36px'
                    }}
                  >
                    {/* Name - Fixed width for alignment */}
                    <div style={{
                      minWidth: '80px',
                      fontWeight: member.isUser ? '700' : '500',
                      color: member.isUser ? colours.missedBlue : (isDarkMode ? colours.dark.text : colours.light.text)
                    }}>
                      {member.First || member.Initials}
                      {member.isUser && (
                        <span style={{ 
                          fontSize: '9px', 
                          color: colours.missedBlue,
                          marginLeft: '4px',
                          fontWeight: '600',
                          background: `${colours.missedBlue}15`,
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}>
                          (you)
                        </span>
                      )}
                    </div>                    {/* Current Week Icons */}
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {currentWeekAttendance.map((dayStatus: any, index: any) => {
                        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index];
                        const isOnLeave = dayStatus === 'out-of-office';
                        const isClickable = member.isUser && onDayUpdate && !isOnLeave;
                        
                        return (
                          <div 
                            key={`current-${index}`}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              backgroundColor: `${getDayColor(dayStatus)}20`, // Light fill - 20% opacity
                              border: `1px solid ${getDayColor(dayStatus)}`, // Full opacity border
                              cursor: isClickable ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px'
                            }}
                            title={isOnLeave ? `${dayName}: On Annual Leave` : `${dayName}: ${dayStatus}`}
                            onClick={isClickable ? (e) => {
                              e.stopPropagation();
                              const statusCycle: ('office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office')[] = ['wfh', 'office', 'away', 'off-sick', 'out-of-office'];
                              const currentIndex = statusCycle.indexOf(dayStatus as any);
                              const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
                              onDayUpdate(member.Initials, dayName, nextStatus, 'current');
                            } : undefined}
                          >
                            <StatusIcon
                              status={dayStatus}
                              size="8px"
                              color={getDayColor(dayStatus)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Divider */}
                    <div style={{
                      width: '1px',
                      height: '20px',
                      backgroundColor: isDarkMode ? '#4A5568' : '#E2E8F0'
                    }} />

                    {/* Next Week Icons */}
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {nextWeekAttendance.map((dayStatus: any, index: any) => {
                        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index];
                        const isOnLeave = dayStatus === 'out-of-office';
                        const isClickable = member.isUser && onDayUpdate && !isOnLeave;
                        
                        return (
                          <div 
                            key={`next-${index}`}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              backgroundColor: `${getDayColor(dayStatus)}20`, // Light fill - 20% opacity
                              border: `1px solid ${getDayColor(dayStatus)}`, // Full opacity border
                              cursor: isClickable ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              opacity: 0.8 // Slightly faded to distinguish from current week
                            }}
                            title={`Next ${dayName}: ${dayStatus}`}
                            onClick={isClickable ? (e) => {
                              e.stopPropagation();
                              const statusCycle: ('office' | 'wfh' | 'away' | 'off-sick' | 'out-of-office')[] = ['wfh', 'office', 'away', 'off-sick', 'out-of-office'];
                              const currentIndex = statusCycle.indexOf(dayStatus as any);
                              const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
                              onDayUpdate(member.Initials, dayName, nextStatus, 'next');
                            } : undefined}
                          >
                            <StatusIcon
                              status={dayStatus}
                              size="8px"
                              color={getDayColor(dayStatus)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {filteredData.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: isDarkMode ? colours.dark.subText : colours.light.subText
        }}>
          <Icon iconName="Search" style={{ fontSize: '24px', marginBottom: '8px' }} />
          <Text>No team members match the selected filters</Text>
        </div>
      )}
    </div>
  );
};

export default WeeklyAttendanceView;