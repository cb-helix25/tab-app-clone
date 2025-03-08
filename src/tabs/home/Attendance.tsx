import React, { useMemo, useState, useEffect } from 'react';
import {
  mergeStyles,
  Text,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Icon,
  DefaultButton,
  IButtonStyles,
} from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import InAttendanceImg from '../../assets/in_attendance.png';
import WfhImg from '../../assets/wfh.png';
import OutImg from '../../assets/outv2.png';
import {
  sharedPrimaryButtonStyles,
  sharedDecisionButtonStyles,
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

const Attendance: React.FC<AttendanceProps> = ({
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
}) => {
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'next'>('current');
  const [localAttendance, setLocalAttendance] = useState<{
    [weekStart: string]: { [initials: string]: string };
  }>({});
  const [isSaving, setIsSaving] = useState(false);

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
      initialAttendance[rec.Week_Start][rec.Initials] = rec.Attendance_Days || '';
    });
    setLocalAttendance(initialAttendance);
  }, [attendanceRecords, teamData]);

  const hasUnsavedChanges = useMemo(() => {
    return [currentWeek, nextWeek].some((week) => {
      const persons = attendanceRecords.filter((rec) => rec.Week_Start === week.start);
      return persons.some((rec) => {
        const localDays = localAttendance[week.start]?.[rec.Initials] || '';
        return localDays !== (rec.Attendance_Days || '') && rec.Initials === userInitials;
      });
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
      const weekData = prev[weekStart] || {};
      const currentDays = weekData[personInitials] ? weekData[personInitials].split(',') : [];
      const updatedDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return {
        ...prev,
        [weekStart]: { ...weekData, [personInitials]: updatedDays.join(',') },
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
        if (localDays !== (existingRecord?.Attendance_Days || '')) {
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

  const AttendanceCell: React.FC<{ status: 'in' | 'wfh' | 'out'; highlight?: boolean; editable?: boolean }> = ({
    status,
    highlight = false,
    editable = false,
  }) => {
    let iconName = 'Home';
    if (status === 'in') iconName = 'Accept';
    else if (status === 'out') iconName = 'Airplane';
    const iconColor = highlight ? '#fff' : (isDarkMode ? colours.dark.grey : colours.light.grey);
    return (
      <Icon
        iconName={iconName}
        styles={{
          root: {
            fontSize: '20px',
            color: iconColor,
            cursor: editable ? 'pointer' : 'default',
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

  const currentWeekButtonStyles: IButtonStyles = {
    ...(sharedDecisionButtonStyles as object),
    root: {
      ...((sharedDecisionButtonStyles as any).root || {}),
      backgroundColor: selectedWeek === 'current' ? colours.highlight : '#ccc',
    },
  };

  const nextWeekButtonStyles: IButtonStyles = {
    ...(sharedDecisionButtonStyles as object),
    root: {
      ...((sharedDecisionButtonStyles as any).root || {}),
      backgroundColor: selectedWeek === 'next' ? colours.highlight : '#ccc',
    },
  };

  return (
    <CollapsibleSection title="Attendance">
      <div style={{ overflowX: 'auto' }}>
        {isLoadingAttendance || isLoadingAnnualLeave ? (
          <Spinner label="Loading attendance..." size={SpinnerSize.medium} />
        ) : attendanceError || annualLeaveError ? (
          <MessageBar messageBarType={MessageBarType.error}>{attendanceError || annualLeaveError}</MessageBar>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: 10 }}>
              <DefaultButton
                text={`Current Week (${currentWeek.start})`}
                styles={currentWeekButtonStyles}
                onClick={() => setSelectedWeek('current')}
              />
              <DefaultButton
                text={`Next Week (${nextWeek.start})`}
                styles={nextWeekButtonStyles}
                onClick={() => setSelectedWeek('next')}
              />
            </div>
            {hasUnsavedChanges && (
              <MessageBar messageBarType={MessageBarType.warning}>
                You have unsaved changes.
              </MessageBar>
            )}
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'separate',
                borderSpacing: '0',
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                animation: 'fadeIn 0.5s ease-in-out',
              }}
            >
              <thead>
                <tr>
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
                {weekDays.map((day, index) => {
                  const weekKey = selectedWeek === 'current' ? currentWeek : nextWeek;
                  const dayDate = new Date(weekKey.start);
                  dayDate.setDate(dayDate.getDate() + index);
                  const cellDateStr = dayDate.toISOString().split('T')[0];
                  const isCurrentDay = cellDateStr === todayStr && selectedWeek === 'current';

                  return (
                    <tr key={day} style={isCurrentDay ? { backgroundColor: '#f0f8ff' } : {}}>
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

                        return (
                          <td
                            key={person.initials}
                            style={{
                              border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                              padding: '8px',
                              textAlign: 'center',
                              backgroundColor: cellBg,
                              width: '100px',
                            }}
                            onClick={() => handleCellClick(person.initials, day, cellDateStr)}
                          >
                            <AttendanceCell
                              status={status}
                              highlight={isCurrentDay}
                              editable={person.initials === userInitials}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
};

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7) + 1;
}

export default Attendance;