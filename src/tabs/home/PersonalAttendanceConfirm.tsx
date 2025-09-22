import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { DefaultButton, Icon } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import helixLogo from '../../assets/dark blue mark.svg';
import { PiTreePalmFill } from 'react-icons/pi';

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

interface PersonalAttendanceConfirmProps {
    isDarkMode: boolean;
    attendanceRecords: AttendanceRecord[];
    annualLeaveRecords: AnnualLeaveRecord[];
    futureLeaveRecords: AnnualLeaveRecord[];
    userData: any;
    onSave: (weekStart: string, days: string) => Promise<void>;
    onClose: () => void;
}

const PersonalAttendanceConfirm = forwardRef<
    { setWeek: (week: 'current' | 'next') => void; focusTable: () => void },
    PersonalAttendanceConfirmProps
>(({
    isDarkMode,
    attendanceRecords,
    annualLeaveRecords,
    futureLeaveRecords,
    userData,
    onSave,
    onClose,
}, ref) => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const getMondayOfCurrentWeek = (): Date => {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        return monday;
    };

    const formatDateLocal = (d: Date): string => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const currentWeekStart = formatDateLocal(getMondayOfCurrentWeek());
    const nextWeekMonday = new Date(getMondayOfCurrentWeek());
    nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);
    const nextWeekStart = formatDateLocal(nextWeekMonday);

    const userInitials = userData?.displayName?.match(/\b\w/g)?.join('').toUpperCase() || 
                        userData?.mail?.substring(0, 2).toUpperCase() || 
                        userData?.[0]?.Initials || '';
    console.log('🔍 userInitials:', userInitials);
    console.log('🔍 userData:', userData);

    const combinedLeaveRecords = useMemo(() => [...annualLeaveRecords, ...futureLeaveRecords], [annualLeaveRecords, futureLeaveRecords]);

    const initialState: Record<string, Record<string, string>> = useMemo(() => {
        console.log('🔍 Calculating initial state...');
        console.log('🔍 attendanceRecords:', attendanceRecords);
        console.log('🔍 userInitials in useMemo:', userInitials);
        const state: Record<string, Record<string, string>> = {
            [currentWeekStart]: {},
            [nextWeekStart]: {},
        };
        const dayMap: Record<string, string> = {
            Mon: 'Monday',
            Tue: 'Tuesday',
            Wed: 'Wednesday',
            Thu: 'Thursday',
            Fri: 'Friday',
        };
        const filteredRecords = attendanceRecords.filter((r) => r.Initials === userInitials);
        console.log('🔍 Filtered attendance records:', filteredRecords);
        filteredRecords.forEach((rec) => {
                if (rec.Attendance_Days) {
                    console.log('🔍 Processing record:', rec);
                    // Parse the attendance string - format: "Mon:office,Tue:home,Wed:out-of-office" etc
                    const dayStatuses = rec.Attendance_Days.split(',').map(d => d.trim());
                    console.log('🔍 Day statuses from record:', dayStatuses);
                    dayStatuses.forEach(dayStatus => {
                        const [dayAbbr, status] = dayStatus.includes(':') ? dayStatus.split(':') : [dayStatus, 'office'];
                        const dayName = dayMap[dayAbbr] || dayAbbr;
                        if (weekDays.includes(dayName)) {
                            state[rec.Week_Start][dayName] = status || 'wfh';
                            console.log('🔍 Set state for', rec.Week_Start, dayName, 'to', status);
                        }
                    });
                }
            });
        
        // Ensure both weeks have default values for all weekdays if no data exists
        [currentWeekStart, nextWeekStart].forEach(weekStart => {
            weekDays.forEach(day => {
                if (!state[weekStart][day]) {
                    state[weekStart][day] = 'wfh'; // Default to WFH if no data
                    console.log('🔍 Set default state for', weekStart, day, 'to wfh');
                }
            });
        });
        
        console.log('🔍 Initial state calculated:', state);
        return state;
    }, [attendanceRecords, userInitials, currentWeekStart, nextWeekStart]);

    const [localAttendance, setLocalAttendance] = useState<Record<string, Record<string, string>>>(initialState);
    console.log('🔍 LocalAttendance state:', localAttendance);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useImperativeHandle(ref, () => ({
        setWeek: () => { },
        focusTable: () => { },
    }));

    // Define the 5 statuses and their cycle order
    const statuses = ['wfh', 'office', 'away', 'off-sick', 'out-of-office'];
    
    // Status display configuration
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'office':
                return { 
                    icon: 'office', 
                    color: colours.missedBlue, 
                    label: 'In Office',
                    bgColor: colours.missedBlue + '20'
                };
            case 'wfh':
                return { 
                    icon: 'wfh', 
                    color: colours.green, 
                    label: 'WFH',
                    bgColor: colours.green + '20'
                };
            case 'away':
                return { 
                    icon: 'away', 
                    color: colours.subtleGrey, 
                    label: 'Away',
                    bgColor: colours.subtleGrey + '20'
                };
            case 'off-sick':
                return { 
                    icon: 'off-sick', 
                    color: colours.cta, 
                    label: 'Off Sick',
                    bgColor: colours.cta + '20'
                };
            case 'out-of-office':
                return { 
                    icon: 'out-of-office', 
                    color: colours.orange, 
                    label: 'Out-Of-Office',
                    bgColor: colours.orange + '20'
                };
            default:
                return { 
                    icon: 'Home', 
                    color: colours.green, 
                    label: 'WFH',
                    bgColor: colours.green + '20'
                };
        }
    };
    
    const toggleDay = (weekStart: string, day: string) => {
        console.log('🔍 toggleDay called with weekStart:', weekStart, 'day:', day);
        setLocalAttendance((prev) => {
            console.log('🔍 Previous localAttendance:', prev);
            const currentStatus = prev[weekStart]?.[day] || 'wfh';
            console.log('🔍 Current status:', currentStatus);
            const currentIndex = statuses.indexOf(currentStatus);
            const nextIndex = (currentIndex + 1) % statuses.length;
            const nextStatus = statuses[nextIndex];
            console.log('🔍 Next status:', nextStatus);
            
            const newState = {
                ...prev,
                [weekStart]: {
                    ...prev[weekStart],
                    [day]: nextStatus
                }
            };
            console.log('🔍 New localAttendance state:', newState);
            return newState;
        });
    };

    const handleSave = async () => {
        console.log('🔍 Save button clicked');
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            for (const weekStart of [currentWeekStart, nextWeekStart]) {
                const dayStatuses = localAttendance[weekStart] || {};
                console.log('🔍 Day statuses for', weekStart, ':', dayStatuses);
                const dayStrings = Object.entries(dayStatuses).map(([dayName, status]) => {
                    const dayMap: Record<string, string> = {
                        Monday: 'Mon',
                        Tuesday: 'Tue',
                        Wednesday: 'Wed',
                        Thursday: 'Thu',
                        Friday: 'Fri',
                    };
                    const dayAbbr = dayMap[dayName] || dayName;
                    return `${dayAbbr}:${status}`;
                });
                const days = dayStrings.join(',');
                console.log('🔍 Calling onSave with weekStart:', weekStart, 'days:', days);
                await onSave(weekStart, days);
            }
            console.log('🔍 Save completed successfully');
            setSaveSuccess(true);
            // Show brief success feedback before closing
            setTimeout(() => {
                onClose();
            }, 700);
        } catch (error) {
            console.error('❌ Error saving attendance:', error);
            const message = error instanceof Error ? error.message : 'Failed to save attendance';
            setSaveError(message);
        } finally {
            setSaving(false);
        }
    };

    const isOnLeave = (weekStart: string, dayIndex: number): boolean => {
        const weekStartDate = new Date(weekStart + 'T00:00:00');
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + dayIndex);
        const iso = formatDateLocal(date);

        return combinedLeaveRecords.some(
            (leave) =>
                leave.status === 'booked' &&
                leave.person.trim().toLowerCase() === userInitials.toLowerCase() &&
                iso >= leave.start_date &&
                iso <= leave.end_date
        );
    };

    const getWeekDateRange = (weekStart: string): string => {
        const start = new Date(weekStart + 'T00:00:00');
        const end = new Date(start);
        end.setDate(start.getDate() + 4); // Friday
        
        const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short' 
        });
        
        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    const renderWeek = (label: string, weekStart: string) => {
        return (
            <div key={weekStart} style={{
                background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
                border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
                }}>
                    <h3 style={{
                        margin: 0,
                        color: isDarkMode ? colours.dark.text : colours.light.text,
                        fontSize: '16px',
                        fontWeight: 600
                    }}>
                        {label}
                    </h3>
                    <span style={{
                        fontSize: '12px',
                        color: isDarkMode ? colours.dark.subText : colours.light.subText
                    }}>
                        {getWeekDateRange(weekStart)}
                    </span>
                </div>

                {/* Feedback messages */}
                {(saveError || saveSuccess) && (
                    <div style={{
                        marginBottom: '12px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${saveError ? colours.cta : colours.green}`,
                        background: saveError ? `${colours.cta}10` : `${colours.green}10`,
                        color: isDarkMode ? colours.dark.text : colours.light.text
                    }}>
                        {saveError ? (
                            <span>Could not save attendance. Please try again.</span>
                        ) : (
                            <span>Attendance saved.</span>
                        )}
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '12px'
                }}>
                    {weekDays.map((day, dayIndex) => {
                        const currentStatus = localAttendance[weekStart]?.[day] || 'home';
                        const onLeave = isOnLeave(weekStart, dayIndex);
                        
                        return (
                            <div
                                key={day}
                                onClick={onLeave ? undefined : () => toggleDay(weekStart, day)}
                                style={{
                                    padding: '16px 8px',
                                    borderRadius: '8px',
                                    border: `2px solid ${
                                        onLeave 
                                            ? colours.greyText 
                                            : getStatusConfig(currentStatus).color
                                    }`,
                                    backgroundColor: onLeave
                                        ? `${colours.greyText}20`
                                        : getStatusConfig(currentStatus).bgColor,
                                    cursor: onLeave ? 'not-allowed' : 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    opacity: onLeave ? 0.6 : 1
                                }}
                            >
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: isDarkMode ? colours.dark.text : colours.light.text,
                                    marginBottom: '8px'
                                }}>
                                    {day.substring(0, 3).toUpperCase()}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '24px'
                                }}>
                                    {onLeave ? (
                                        <Icon 
                                            iconName="Airplane" 
                                            style={{ 
                                                color: colours.greyText,
                                                fontSize: '16px'
                                            }} 
                                        />
                                    ) : (
                                        <StatusIcon
                                            status={currentStatus as 'wfh' | 'office' | 'away' | 'off-sick' | 'out-of-office'}
                                            size="16px"
                                            color={getStatusConfig(currentStatus).color}
                                        />
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: isDarkMode ? colours.dark.subText : colours.light.subText,
                                    marginTop: '4px'
                                }}>
                                    {onLeave ? 'Away' : getStatusConfig(currentStatus).label}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick select buttons */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setLocalAttendance(prev => ({ 
                            ...prev, 
                            [weekStart]: weekDays.reduce((acc, day) => ({ ...acc, [day]: 'wfh' }), {})
                        }))}
                        style={{
                            padding: '6px 12px',
                            border: `1px solid ${colours.green}`,
                            backgroundColor: `${colours.green}20`,
                            color: colours.green,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500
                        }}
                    >
                        All WFH
                    </button>
                    <button
                        onClick={() => setLocalAttendance(prev => ({ 
                            ...prev, 
                            [weekStart]: weekDays.reduce((acc, day) => ({ ...acc, [day]: 'office' }), {})
                        }))}
                        style={{
                            padding: '6px 12px',
                            border: `1px solid ${colours.missedBlue}`,
                            backgroundColor: `${colours.missedBlue}20`,
                            color: colours.missedBlue,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500
                        }}
                    >
                        All Office
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ 
            padding: '8px'
        }}>
            <div style={{
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <h2 style={{
                    margin: '0 0 8px 0',
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontSize: '18px',
                    fontWeight: 600
                }}>
                    Confirm Your Attendance
                </h2>
            </div>

            {renderWeek('This Week', currentWeekStart)}
            {renderWeek('Next Week', nextWeekStart)}

            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
            }}>
                <DefaultButton 
                    text="Cancel" 
                    onClick={onClose}
                    styles={{
                        root: {
                            border: `1px solid ${colours.greyText}`,
                            backgroundColor: 'transparent'
                        }
                    }}
                />
                <DefaultButton 
                    text={saving ? 'Saving...' : 'Save Attendance'} 
                    onClick={handleSave} 
                    disabled={saving}
                    primary
                    styles={{
                        root: {
                            backgroundColor: colours.missedBlue,
                            border: `1px solid ${colours.missedBlue}`
                        }
                    }}
                />
            </div>
        </div>
    );
});

export default PersonalAttendanceConfirm;