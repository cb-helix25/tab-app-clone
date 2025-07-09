import React, {
// invisible change 2
    useMemo,
    forwardRef,
    useImperativeHandle,
    useState,
    useRef,
} from 'react';
import { Icon, TooltipHost, mergeStyles, DefaultButton } from '@fluentui/react';
import { sharedDefaultButtonStyles } from '../../app/styles/ButtonStyles';
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

const snakeContainer = mergeStyles({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
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
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const londonNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
        const afterFiveThirty =
            londonNow.getHours() > 17 || (londonNow.getHours() === 17 && londonNow.getMinutes() >= 30);
        const nextDay = new Date(londonNow);
        if (afterFiveThirty) nextDay.setDate(londonNow.getDate() + 1);

        const targetDayLabel = weekDays[nextDay.getDay()];
        const targetDayStr = nextDay.toISOString().split('T')[0];

        const [panelOpen, setPanelOpen] = useState(false);
        const attendanceRef = useRef<{ focusTable: () => void; setWeek: (week: 'current' | 'next') => void }>(null);

        const getMondayOfCurrentWeek = (): Date => {
            const now = new Date();
            const day = now.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            const monday = new Date(now);
            monday.setDate(now.getDate() + diff);
            return monday;
        };

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const currentWeekStart = formatDate(getMondayOfCurrentWeek());
        const nextWeekStart = formatDate(new Date(getMondayOfCurrentWeek().setDate(getMondayOfCurrentWeek().getDate() + 7)));
        const useNextWeek =
            (londonNow.getDay() === 5 && afterFiveThirty) ||
            londonNow.getDay() === 6 ||
            londonNow.getDay() === 0;
        const weekStartToUse = useNextWeek ? nextWeekStart : currentWeekStart;

        const isConfirmedForWeek = (weekStart: string) =>
            attendanceRecords.some(
                (rec) =>
                    rec.Initials === (userData?.[0]?.Initials || '') &&
                    rec.Week_Start === weekStart &&
                    rec.Confirmed_At !== null
            );

        const currentConfirmed = isConfirmedForWeek(currentWeekStart);
        const nextConfirmed = isConfirmedForWeek(nextWeekStart);

        const openConfirmationPanel = () => {
            setPanelOpen(true);
            setTimeout(() => attendanceRef.current?.setWeek('current'), 0);
        };

        useImperativeHandle(ref, () => ({
            focusTable: () => {
                setPanelOpen(true);
                setTimeout(() => attendanceRef.current?.focusTable(), 0);
            },
            setWeek: (week: 'current' | 'next') => {
                setPanelOpen(true);
                setTimeout(() => attendanceRef.current?.setWeek(week), 0);
            },
            confirmRelevantWeek: openConfirmationPanel,
        }));

        const combinedLeaveRecords = useMemo(
            () => [...annualLeaveRecords, ...futureLeaveRecords],
            [annualLeaveRecords, futureLeaveRecords]
        );

        const getMemberWeek = (initials: string): string => {
            const records = attendanceRecords.filter(
                (rec) => rec.Initials === initials && rec.Week_Start === weekStartToUse
            );
            return (
                records
                    .map((rec) => rec.Attendance_Days || '')
                    .filter(Boolean)
                    .join(',') || 'None'
            );
        };

        const getStatus = (
            personAttendance: string,
            initials: string
        ): 'office' | 'home' | 'away' => {
            const isOnLeave = combinedLeaveRecords.some(
                (leave) =>
                    leave.status === 'booked' &&
                    leave.person.trim().toLowerCase() === initials.trim().toLowerCase() &&
                    targetDayStr >= leave.start_date &&
                    targetDayStr <= leave.end_date
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
            return attendedDays.includes(targetDayLabel) ? 'office' : 'home';
        };

        const groups = useMemo(() => {
            const group = { office: [] as any[], home: [] as any[], away: [] as any[] };
            teamData.forEach((teamMember) => {
                const records = attendanceRecords.filter(
                    (rec) =>
                        rec.Initials === teamMember.Initials &&
                        rec.Week_Start === weekStartToUse
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
        }, [attendanceRecords, teamData, getStatus, weekStartToUse, targetDayLabel, targetDayStr]);

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
        ) => {
            const perRow = 6;
            const rows = [] as any[];
            for (let i = 0; i < members.length; i += perRow) {
                rows.push(members.slice(i, i + perRow));
            }
            return (
                <div className={snakeGroup(isDarkMode)}>
                    <Icon iconName={icon} styles={{ root: { fontSize: 20, marginRight: 4 } }} />
                    <div className={snakeContainer}>
                        {rows.map((row, idx) => (
                            <div
                                key={idx}
                                style={{ display: 'flex', flexDirection: idx % 2 ? 'row-reverse' : 'row' }}
                            >
                                {row.map((m: any) => renderAvatar(m, status))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

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
                                        {renderGroup(groups.office, 'office', 'CityNext')}
                                    {renderGroup(groups.home, 'home', 'Home')}
                                    {renderGroup(groups.away, 'away', 'Airplane')}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: colours.greyText }}>
                                        Showing: {targetDayLabel}
                                    </div>
                                    {!currentConfirmed && (
                                        <div style={{ marginTop: '8px' }}>
                                            <DefaultButton text="Confirm Attendance" onClick={openConfirmationPanel} styles={sharedDefaultButtonStyles} />
                                        </div>
                                    )}
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
