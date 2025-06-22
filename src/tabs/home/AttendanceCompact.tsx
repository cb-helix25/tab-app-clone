import React, {
    useMemo,
    forwardRef,
    useImperativeHandle,
    useState,
    useRef,
} from 'react';
import { Icon, TooltipHost, mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { cardStyles } from '../instructions/componentTokens';
import { componentTokens } from '../../app/styles/componentTokens';
import AttendanceFull from './Attendance';
import BespokePanel from '../../app/functionality/BespokePanel';

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

// Lightweight collapsible section reused from Attendance.tsx
const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const toggleCollapse = () => setCollapsed(!collapsed);

    return (
        <div
            style={{
                marginBottom: '20px',
                boxShadow: (cardStyles.root as React.CSSProperties).boxShadow,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: (cardStyles.root as React.CSSProperties).borderRadius,
                borderBottomRightRadius: (cardStyles.root as React.CSSProperties).borderRadius,
                overflow: 'hidden',
            }}
        >
            <div
                onClick={toggleCollapse}
                style={{
                    backgroundColor: colours.darkBlue,
                    color: '#ffffff',
                    border: `1px solid ${colours.light.border}`,
                    padding: '6px 10px',
                    minHeight: '30px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '16px',
                    borderRadius: componentTokens.stepHeader.base.borderRadius,
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
            <div
                style={{
                    padding: componentTokens.summaryPane.base.padding,
                    backgroundColor: colours.light.sectionBackground,
                    boxShadow: componentTokens.summaryPane.base.boxShadow,
                    borderBottomLeftRadius: (cardStyles.root as React.CSSProperties).borderRadius,
                    borderBottomRightRadius: (cardStyles.root as React.CSSProperties).borderRadius,
                    maxHeight: collapsed ? 0 : '2000px',
                    opacity: collapsed ? 0 : 1,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease',
                }}
            >
                {children}
            </div>
        </div>
    );
};

const avatarStyle = mergeStyles({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '10px',
    color: '#ffffff',
});

const groupContainer = mergeStyles({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    alignItems: 'flex-start',
});

const snakeGroup = (isDark: boolean) =>
    mergeStyles({
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
        minHeight: '40px',
        padding: '4px 8px',
        borderRadius: '20px',
        border: `1px solid ${isDark ? colours.dark.border : colours.light.border}`,
        backgroundColor: isDark ? 'rgba(54,144,206,0.2)' : colours.highlightBlue,
    });

const AttendanceCompact = forwardRef<
    { focusTable: () => void; setWeek: (week: 'current' | 'next') => void },
    AttendanceProps
>(
    (
        {
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
        },
        ref
    ) => {
        const today = new Date();
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayLabel = weekDays[today.getDay()];
        const todayStr = today.toISOString().split('T')[0];

        const nextDayLabel = weekDays[(today.getDay() + 1) % 7];
        const [panelOpen, setPanelOpen] = useState(false);
        const attendanceRef = useRef<{ focusTable: () => void; setWeek: (week: 'current' | 'next') => void }>(null);

        useImperativeHandle(ref, () => ({
            focusTable: () => {
                setPanelOpen(true);
                setTimeout(() => attendanceRef.current?.focusTable(), 0);
            },
            setWeek: (week: 'current' | 'next') => {
                setPanelOpen(true);
                setTimeout(() => attendanceRef.current?.setWeek(week), 0);
            },
        }));

        const combinedLeaveRecords = useMemo(
            () => [...annualLeaveRecords, ...futureLeaveRecords],
            [annualLeaveRecords, futureLeaveRecords]
        );

        const getMemberWeek = (initials: string): string => {
            const records = attendanceRecords.filter(
                (rec) => rec.Initials === initials
            );
            return records
                .map((rec) => rec.Attendance_Days || '')
                .filter(Boolean)
                .join(',') || 'None';
        };

        const getStatus = (
            personAttendance: string,
            initials: string
        ): 'office' | 'home' | 'away' => {
            const isOnLeave = combinedLeaveRecords.some(
                (leave) =>
                    leave.status === 'booked' &&
                    leave.person.trim().toLowerCase() === initials.trim().toLowerCase() &&
                    todayStr >= leave.start_date &&
                    todayStr <= leave.end_date
            );
            if (isOnLeave) return 'away';
            const dayMap: Record<string, string> = {
                Mon: 'Monday',
                Tue: 'Tuesday',
                Wed: 'Wednesday',
                Thu: 'Thursday',
                Fri: 'Friday',
            };
            const attendedDays = personAttendance
                ? personAttendance
                    .split(',')
                    .map((s) => dayMap[s.trim()] || s.trim())
                : [];
            return attendedDays.includes(todayLabel) ? 'office' : 'home';
        };

        const groups = useMemo(() => {
            const group = { office: [] as any[], home: [] as any[], away: [] as any[] };
            teamData.forEach((teamMember) => {
                const records = attendanceRecords.filter(
                    (rec) => rec.Initials === teamMember.Initials
                );
                const attendanceDays = records
                    .map((rec) => rec.Attendance_Days || '')
                    .filter(Boolean)
                    .join(',');
                const status = getStatus(attendanceDays, teamMember.Initials);
                if (status === 'office') group.office.push(teamMember);
                else if (status === 'home') group.home.push(teamMember);
                else group.away.push(teamMember);
            });
            return group;
        }, [attendanceRecords, teamData, getStatus]);

        const renderAvatar = (member: any, status: 'office' | 'home' | 'away') => {
            let background = colours.grey;
            if (status === 'office') background = colours.blue;
            else if (status === 'home') background = colours.highlight;
            else background = colours.greyText;
            const week = getMemberWeek(member.Initials);
            return (
                <TooltipHost content={week}>
                    <div
                        key={member.Initials}
                        className={avatarStyle}
                        style={{ background }}
                        title={member.Nickname || member.First}
                    >
                        {member.Initials.toUpperCase()}
                    </div>
                </TooltipHost>
            );
        };

        const renderGroup = (
            members: any[],
            status: 'office' | 'home' | 'away',
            icon: string
        ) => (
            <div className={snakeGroup(isDarkMode)}>
                <Icon iconName={icon} styles={{ root: { fontSize: 20, marginRight: 4 } }} />
                {members.map((m) => renderAvatar(m, status))}
            </div>
        );

        return (
            <>
            <CollapsibleSection title="Attendance">
                {isLoadingAttendance ? (
                    <div>Loading...</div>
                ) : attendanceError || annualLeaveError ? (
                    <div>{attendanceError || annualLeaveError}</div>
                ) : (
                            <>
                                <div className={groupContainer}>
                                    {renderGroup(groups.office, 'office', 'Building')}
                                    {renderGroup(groups.home, 'home', 'Home')}
                                    {renderGroup(groups.away, 'away', 'Airplane')}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: colours.greyText }}>
                                    Next: {nextDayLabel}
                                </div>
                            </>
                )}
            </CollapsibleSection>
            <BespokePanel
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            title="Confirm Attendance"
        >
            <AttendanceFull
                ref={attendanceRef}
                isDarkMode={isDarkMode}
                isLoadingAttendance={isLoadingAttendance}
                isLoadingAnnualLeave={isLoadingAnnualLeave}
                attendanceError={attendanceError}
                annualLeaveError={annualLeaveError}
                attendanceRecords={attendanceRecords}
                teamData={teamData}
                annualLeaveRecords={annualLeaveRecords}
                futureLeaveRecords={futureLeaveRecords}
                userData={userData}
                onAttendanceUpdated={onAttendanceUpdated}
            />
        </BespokePanel>
        </>
        );
    });

export default AttendanceCompact;
