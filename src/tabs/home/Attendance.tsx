import React, { useMemo, useState, useEffect, useRef, forwardRef, useImperativeHandle, RefAttributes } from 'react';
import {
  mergeStyles,
  Text,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Icon,
  DefaultButton,
} from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import InAttendanceImg from '../../assets/in_attendance.png';
import WfhImg from '../../assets/wfh.png';
import OutImg from '../../assets/outv2.png';
import {
  sharedPrimaryButtonStyles,
} from '../../app/styles/ButtonStyles';

interface AttendanceProps {
  isDarkMode: boolean;
  isLoadingAttendance: boolean;
  isLoadingAnnualLeave: boolean;
  attendanceError: string | null;
  annualLeaveError: string | null;
  attendanceRecords: AttendanceRecord[];
  teamData: any[];
  annualLeaveRecords: AnnualLeaveRecord[];
  futureLeaveRecords: AnnualLeaveRecord[];
  userData: any;
  onAttendanceUpdated?: (updatedRecords: AttendanceRecord[]) => void;
}

interface AnnualLeaveRecord {
  person: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  id: string;
  rejection_notes?: string;
  approvers?: string[];
}

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
}

interface AttendancePerson {
  name: string;
  initials: string;
  nickname: string;
  attendance: string;
  confirmed: boolean;
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      style={{
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={toggleCollapse}
        style={{
          background: `linear-gradient(to right, ${colours.grey}, white)`,
          color: '#333333',
          padding: '16px 12px',
          minHeight: '48px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '16px',
        }}
      >
        <span style={{ fontWeight: 600 }}>{title}</span>
        <Icon
          iconName="ChevronDown"
          styles={{
            root: {
              fontSize: '16px',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            },
          }}
        />
      </div>
      {!collapsed && (
        <div
          style={{
            padding: '10px 15px',
            backgroundColor: colours.light.sectionBackground,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const Attendance: React.FC<AttendanceProps & RefAttributes<{ focusTable: () => void; setWeek: (week: 'current' | 'next') => void }>> = forwardRef(({
  isDarkMode,
  isLoadingAttendance,
  isLoadingAnnualLeave,
  attendanceError,
  annualLeaveError,
  attendanceRecords,
  teamData,
  annualLeaveRecords,
  futureLeaveRecords,
  userData,
  onAttendanceUpdated,
}, ref) => {
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'next'>('current');
  const [localAttendance, setLocalAttendance] = useState<{
    [weekStart: string]: { [initials: string]: string };
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(selectedWeek === 'next');
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userInitials = userData?.[0]?.Initials || 'LZ';

  const combinedLeaveRecords = useMemo(() => [...annualLeaveRecords, ...futureLeaveRecords], [
    annualLeaveRecords,
    futureLeaveRecords,
  ]);

  const getMondayOfCurrentWeek = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday;
  };

  const getWeekKey = (date: Date): { start: string; end: string } => {
    const monday = new Date(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  };

  const currentWeekMonday = getMondayOfCurrentWeek();
  const nextWeekMonday = new Date(currentWeekMonday);
  nextWeekMonday.setDate(currentWeekMonday.getDate() + 7);

  const currentWeek = getWeekKey(currentWeekMonday);
  const nextWeek = getWeekKey(nextWeekMonday);
  const todayStr = new Date().toISOString().split('T')[0];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const attendancePersons = useMemo(() => {
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) return [];
    const weekKey = selectedWeek === 'current' ? currentWeek : nextWeek;
    return teamData
      .map((teamMember) => {
        const records = attendanceRecords.filter(
          (rec) => rec.Initials === teamMember.Initials && rec.Week_Start === weekKey.start
        );
        const attendanceDays = records
          .map((rec) => rec.Attendance_Days || '')
          .filter(Boolean)
          .join(',');
        const confirmed = records.some((rec) => rec.Confirmed_At !== null);
        return {
          name: teamMember.First,
          initials: teamMember.Initials,
          nickname: teamMember.Nickname || teamMember.First,
          attendance: attendanceDays,
          confirmed,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [attendanceRecords, teamData, selectedWeek]);

  useEffect(() => {
    const initialAttendance: { [weekStart: string]: { [initials: string]: string } } = {
      [currentWeek.start]: {},
      [nextWeek.start]: {},
    };
    teamData.forEach((teamMember) => {
      initialAttendance[currentWeek.start][teamMember.Initials] = '';
      initialAttendance[nextWeek.start][teamMember.Initials] = '';
    });
    attendanceRecords.forEach((rec) => {
      if (!initialAttendance[rec.Week_Start]) initialAttendance[rec.Week_Start] = {};
      initialAttendance[rec.Week_Start][rec.Initials] = rec.Attendance_Days?.trim() || '';
    });
    setLocalAttendance(initialAttendance);
    console.log('Initial localAttendance:', initialAttendance);
  }, [attendanceRecords, teamData]);

  useEffect(() => {
    setIsTableExpanded(selectedWeek === 'next');
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  }, [selectedWeek]);

  // Updated unsaved changes logic to include cases where no record exists
  const hasUnsavedChanges = useMemo(() => {
    return [currentWeek, nextWeek].some((week) => {
      const record = attendanceRecords.find(
        (rec) => rec.Initials === userInitials && rec.Week_Start === week.start
      );
      const recordedDays = record ? record.Attendance_Days || '' : null;
      const localDays = localAttendance[week.start]?.[userInitials] || '';
      // If no record exists, consider it as an unsaved change.
      if (recordedDays === null) {
        return true;
      }
      return localDays !== recordedDays;
    });
  }, [localAttendance, attendanceRecords, userInitials]);

  const getCellStatus = (
    personAttendance: string,
    personInitials: string,
    day: string,
    cellDateStr: string
  ): 'in' | 'wfh' | 'out' => {
    const isOnLeave = combinedLeaveRecords.some(
      (leave) =>
        leave.status === 'booked' &&
        leave.person.trim().toLowerCase() === personInitials.trim().toLowerCase() &&
        cellDateStr >= leave.start_date &&
        cellDateStr <= leave.end_date
    );
    if (isOnLeave) return 'out';
    const attendedDays = personAttendance
      ? personAttendance.split(',').map((s: string) => s.trim())
      : [];
    return attendedDays.includes(day) ? 'in' : 'wfh';
  };

  const handleCellClick = (personInitials: string, day: string, cellDateStr: string) => {
    if (personInitials !== userInitials) return;
    if (getCellStatus(localAttendance[selectedWeek === 'current' ? currentWeek.start : nextWeek.start]?.[personInitials] || '', personInitials, day, cellDateStr) === 'out') return;

    const weekStart = selectedWeek === 'current' ? currentWeek.start : nextWeek.start;
    setLocalAttendance((prev) => {
      const weekData = { ...prev[weekStart] };
      const currentDays = weekData[personInitials] ? weekData[personInitials].split(',').map((d) => d.trim()) : [];
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      weekData[personInitials] = updatedDays.join(',');
      console.log(`Clicked ${day} for ${personInitials}: ${weekData[personInitials]}`);
      return {
        ...prev,
        [weekStart]: weekData,
      };
    });
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    const payloads = [currentWeek, nextWeek]
    .map((week) => {
      const localDays = localAttendance[week.start]?.[userInitials] || '';
      const existingRecord = attendanceRecords.find(
        (rec) => rec.Initials === userInitials && rec.Week_Start === week.start
      );
      // Generate payload if no record exists OR the local value differs from the recorded value.
      if (!existingRecord || localDays !== (existingRecord?.Attendance_Days || '')) {
        return {
          firstName: teamData.find((t) => t.Initials === userInitials)?.First || 'Unknown',
          initials: userInitials,
          weekStart: week.start,
          attendanceDays: localDays,
        };
      }
      return null;
    })
    .filter(Boolean) as { firstName: string; initials: string; weekStart: string; attendanceDays: string }[];

    if (payloads.length === 0) {
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_INSERT_ATTENDANCE_PATH}?code=${process.env.REACT_APP_INSERT_ATTENDANCE_CODE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloads),
        }
      );
      if (!response.ok) throw new Error(`Failed to save attendance: ${response.status}`);
      const updatedRecords = await response.json();
      if (onAttendanceUpdated) {
        const newRecords = updatedRecords.map((result: any) => ({
          Attendance_ID: result.entryId,
          Entry_ID: result.entryId,
          First_Name: payloads.find((p) => p.weekStart === result.weekStart)?.firstName || '',
          Initials: userInitials,
          Level: teamData.find((t) => t.Initials === userInitials)?.Level || '',
          Week_Start: result.weekStart,
          Week_End: new Date(new Date(result.weekStart).setDate(new Date(result.weekStart).getDate() + 6)).toISOString().split('T')[0],
          ISO_Week: getISOWeek(new Date(result.weekStart)),
          Attendance_Days: result.attendanceDays,
          Confirmed_At: new Date().toISOString(),
        }));
        onAttendanceUpdated(newRecords);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const getShortDayLabel = (date: Date): string =>
    date.toLocaleDateString('en-GB', { weekday: 'narrow' }).toUpperCase();

  const AttendanceCell: React.FC<{
    status: 'in' | 'wfh' | 'out';
    highlight?: boolean;
    editable?: boolean;
    proximity?: number;
  }> = ({ status, highlight = false, editable = false, proximity = 0 }) => {
    let iconName = 'Home';
    if (status === 'in') iconName = 'Accept';
    else if (status === 'out') iconName = 'Airplane';
    const baseColor = highlight ? '#ffffff' : isDarkMode ? colours.dark.grey : colours.light.grey;
    const hoverColor = highlight ? '#e0e0e0' : isDarkMode ? '#e0e0e0' : '#666666';
    const rBase = parseInt(baseColor.slice(1, 3), 16);
    const gBase = parseInt(baseColor.slice(3, 5), 16);
    const bBase = parseInt(baseColor.slice(5, 7), 16);
    const rHover = parseInt(hoverColor.slice(1, 3), 16);
    const gHover = parseInt(hoverColor.slice(3, 5), 16);
    const bHover = parseInt(hoverColor.slice(5, 7), 16);
    const r = Math.round(rBase + (rHover - rBase) * proximity);
    const g = Math.round(gBase + (gHover - gBase) * proximity);
    const b = Math.round(bBase + (bHover - bBase) * proximity);
    const interpolatedColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return (
      <Icon
        iconName={iconName}
        styles={{
          root: {
            fontSize: '20px',
            color: interpolatedColor,
            cursor: editable ? 'pointer' : 'default',
            transition: 'color 0.1s ease-out',
          },
        }}
      />
    );
  };

  const AttendancePersonaHeader: React.FC<{ person: AttendancePerson }> = ({ person }) => {
    const weekKey = selectedWeek === 'current' ? currentWeek : nextWeek;
    const diffDays = Math.floor(
      (new Date().getTime() - new Date(weekKey.start).getTime()) / (1000 * 3600 * 24)
    );
    const todayWeekday = diffDays >= 0 && diffDays < 5 ? weekDays[diffDays] : 'Monday';
    const currentStatus = getCellStatus(person.attendance, person.initials, todayWeekday, todayStr);

    let gradient = '';
    if (currentStatus === 'in') {
      gradient = `linear-gradient(135deg, ${colours.blue}, ${colours.darkBlue})`;
    } else if (currentStatus === 'wfh') {
      gradient = `linear-gradient(135deg, ${colours.highlight}, ${colours.darkBlue})`;
    } else {
      gradient = `linear-gradient(135deg, ${colours.grey}, ${colours.darkBlue})`;
    }

    const avatarStyle: React.CSSProperties = {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: 600,
      fontSize: '10px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={avatarStyle}>
          {person.initials.toUpperCase()}
        </div>
      </div>
    );
  };

  const inHighlight = 'rgba(16,124,16,0.15)';
  const wfhHighlight = 'rgba(54,144,206,0.15)';
  const outHighlight = 'rgba(214,85,65,0.15)';

  const toggleStyle = mergeStyles({
    display: 'flex',
    gap: '16px',
    marginBottom: '10px',
    fontSize: '14px',
  });

  const toggleOptionStyle = (isSelected: boolean) =>
    mergeStyles({
      padding: '4px 8px',
      cursor: 'pointer',
      color: isSelected
        ? isDarkMode
          ? colours.dark.highlight
          : colours.highlight
        : isDarkMode
        ? colours.dark.grey
        : colours.light.grey,
      borderBottom: isSelected ? `2px solid ${colours.highlight}` : 'none',
      transition: 'color 0.3s, border-bottom 0.3s',
      ':hover': {
        color: isDarkMode ? colours.dark.highlight : colours.highlight,
      },
    });

  const tableContainerStyle = mergeStyles({
    position: 'relative',
    overflow: 'hidden',
    transition: 'height 0.4s ease-out',
    height: isTableExpanded ? `${48 + 40 * 5 + 2}px` : `${48 + 40 + 2}px`,
  });

  const tableStyle = mergeStyles({
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: '0px',
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    borderRadius: '8px',
    overflow: 'visible',
  });

  const headerRowStyle = mergeStyles({
    position: 'sticky',
    top: 0,
    zIndex: 20,
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    height: '48px',
  });

  const rowStyle = (isCurrentDay: boolean, index: number, todayIndex: number, isExpanded: boolean, isNextWeek: boolean) =>
    mergeStyles({
      display: 'table-row',
      backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
      transform: isCurrentDay || isNextWeek
        ? 'translateY(0)'
        : isExpanded
        ? 'translateY(0)'
        : index < todayIndex
        ? 'translateY(-100%)'
        : 'translateY(100%)',
      opacity: isCurrentDay || isExpanded || isNextWeek ? 1 : 0,
      transition: 'transform 0.4s ease-out, opacity 0.2s ease-out',
      animation:
        isNextWeek && index !== 0
          ? `slideDown 0.4s ease-out ${(index - 1) * 0.1}s forwards`
          : isExpanded && !isCurrentDay && !isNextWeek
          ? index < todayIndex
            ? `slideUp 0.4s ease-out ${(todayIndex - index - 1) * 0.1}s forwards`
            : `slideDown 0.4s ease-out ${(index - todayIndex - 1) * 0.1}s forwards`
          : 'none',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      height: '40px',
    });

  const cellStyle = mergeStyles({
    border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    padding: '8px',
    textAlign: 'center',
    width: '100px',
    position: 'relative',
  });

  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes slideUp {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideDown {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => void document.head.removeChild(styleSheet);
  }, []);

  const todayIndex = useMemo(() => {
    const weekKey = selectedWeek === 'current' ? currentWeek : nextWeek;
    const diffDays = Math.floor(
      (new Date().getTime() - new Date(weekKey.start).getTime()) / (1000 * 3600 * 24)
    );
    return diffDays >= 0 && diffDays < 5 ? diffDays : 0;
  }, [selectedWeek, currentWeek, nextWeek]);

  const orderedWeekDays = useMemo(() => {
    const days = [...weekDays];
    if (selectedWeek === 'current') {
      const currentDay = days.splice(todayIndex, 1)[0];
      return [currentDay, ...days.slice(0, todayIndex), ...days.slice(todayIndex)];
    }
    return days;
  }, [todayIndex, selectedWeek]);

  const handleMouseMove = (e: React.MouseEvent<HTMLTableElement>) => {
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseEnter = () => {
    if (selectedWeek === 'current') {
      setIsTableExpanded(true);
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
        collapseTimeoutRef.current = null;
      }
    }
  };

  const handleMouseLeave = () => {
    if (selectedWeek === 'current' && isTableExpanded) {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
      collapseTimeoutRef.current = setTimeout(() => {
        setIsTableExpanded(false);
        setMousePosition(null);
      }, 1000);
    } else {
      setMousePosition(null);
    }
  };

  const getCellProximity = (day: string, person: string) => {
    if (!mousePosition || !tableRef.current) return 0;

    const dayIndex = orderedWeekDays.indexOf(day);
    const personIndex = attendancePersons.findIndex((p) => p.initials === person);
    const cellWidth = 100;
    const cellHeight = 40;
    const headerHeight = 48;

    const cellCenterX = (personIndex + 1) * cellWidth + cellWidth / 2;
    const cellCenterY = headerHeight + dayIndex * cellHeight + cellHeight / 2;

    const distance = Math.sqrt(
      Math.pow(mousePosition.x - cellCenterX, 2) +
      Math.pow(mousePosition.y - cellCenterY, 2)
    );

    const maxDistance = 150;
    const proximity = Math.max(0, 1 - distance / maxDistance);
    return proximity;
  };

  useImperativeHandle(ref, () => ({
    focusTable: () => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth' });
        if (!isTableExpanded) {
          setIsTableExpanded(true);
        }
      }
    },
    setWeek: (week: 'current' | 'next') => {
      setSelectedWeek(week);
      setIsTableExpanded(true);
    },
  }));

  return (
    <CollapsibleSection title="Attendance">
      <div style={{ overflowX: 'auto' }}>
        {isLoadingAttendance || isLoadingAnnualLeave ? (
          <Spinner label="Loading attendance..." size={SpinnerSize.medium} />
        ) : attendanceError || annualLeaveError ? (
          <MessageBar messageBarType={MessageBarType.error}>{attendanceError || annualLeaveError}</MessageBar>
        ) : (
          <>
            <div className={toggleStyle}>
              <span
                className={toggleOptionStyle(selectedWeek === 'current')}
                onClick={() => setSelectedWeek('current')}
              >
                This Week
              </span>
              <span
                className={toggleOptionStyle(selectedWeek === 'next')}
                onClick={() => setSelectedWeek('next')}
              >
                Next Week
              </span>
            </div>
            {hasUnsavedChanges && (
              <MessageBar messageBarType={MessageBarType.warning}>
                You have unsaved changes.
              </MessageBar>
            )}
            <div
              className={tableContainerStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <table
                className={tableStyle}
                ref={tableRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <thead>
                  <tr className={headerRowStyle}>
                    <th style={{ border: '1px solid transparent', padding: '8px', width: '100px' }}></th>
                    {attendancePersons.map((person) => (
                      <th
                        key={person.initials}
                        style={{
                          border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                          padding: '8px',
                          textAlign: 'center',
                          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
                          width: '100px',
                        }}
                      >
                        <AttendancePersonaHeader person={person} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedWeekDays.map((day, index) => {
                    const weekKey = selectedWeek === 'current' ? currentWeek : nextWeek;
                    const originalIndex = weekDays.indexOf(day);
                    const dayDate = new Date(weekKey.start);
                    dayDate.setDate(dayDate.getDate() + originalIndex);
                    const cellDateStr = dayDate.toISOString().split('T')[0];
                    const isCurrentDay = selectedWeek === 'current' && originalIndex === todayIndex;

                    return (
                      <tr
                        key={day}
                        className={rowStyle(isCurrentDay, originalIndex, todayIndex, isTableExpanded, selectedWeek === 'next')}
                      >
                        <td
                          style={{
                            border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                            padding: '8px',
                            fontWeight: 'bold',
                            backgroundColor: colours.reporting.tableHeaderBackground,
                            width: '100px',
                            fontSize: '14px',
                          }}
                        >
                          {getShortDayLabel(dayDate)}
                        </td>
                        {attendancePersons.map((person) => {
                          const weekStart = selectedWeek === 'current' ? currentWeek.start : nextWeek.start;
                          const localDays = localAttendance[weekStart]?.[person.initials] || person.attendance;
                          const status = getCellStatus(localDays, person.initials, day, cellDateStr);
                          const cellBg = isCurrentDay
                            ? status === 'in'
                              ? inHighlight
                              : status === 'wfh'
                              ? wfhHighlight
                              : outHighlight
                            : isDarkMode
                            ? colours.dark.sectionBackground
                            : colours.light.sectionBackground;
                          const proximity = getCellProximity(day, person.initials);

                          return (
                            <td
                              key={person.initials}
                              className={cellStyle}
                              style={{ backgroundColor: cellBg }}
                              onClick={() => handleCellClick(person.initials, day, cellDateStr)}
                            >
                              <AttendanceCell
                                status={status}
                                highlight={isCurrentDay}
                                editable={person.initials === userInitials}
                                proximity={proximity}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {userInitials && (
              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <DefaultButton
                  text={isSaving ? 'Saving...' : 'Save All Changes'}
                  styles={sharedPrimaryButtonStyles}
                  onClick={saveAttendance}
                  disabled={isSaving || !hasUnsavedChanges}
                />
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  );
});

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7) + 1;
}

export default Attendance;
