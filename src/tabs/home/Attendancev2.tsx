import React, {
// invisible change 2
    useMemo,
    forwardRef,
    useImperativeHandle,
    useState,
    useRef,
} from 'react';
import { Icon, mergeStyles, DefaultButton } from '@fluentui/react';
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

const snakeItemBackground = (status: 'office' | 'home' | 'away') => {
    switch (status) {
        case 'office':
            return 'rgba(16,124,16,0.2)';
        case 'away':
            return 'rgba(214,85,65,0.2)';
        default:
            return 'rgba(54,144,206,0.2)';
    }
};

const snakeGroup = mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
});

const snakeRow = (index: number) =>
    mergeStyles({
        display: 'flex',
        flexDirection: index % 2 ? 'row-reverse' : 'row',
        gap: '4px',
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

        const weekLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const weekStartDate = new Date(weekStartToUse + 'T00:00:00');

        const getStatusForDay = (
            attendance: string,
            initials: string,
            dayLabel: string,
            dayStr: string
        ): 'office' | 'home' | 'away' => {
            const isOnLeave = combinedLeaveRecords.some(
                (leave) =>
                    leave.status === 'booked' &&
                    leave.person.trim().toLowerCase() === initials.trim().toLowerCase() &&
                    dayStr >= leave.start_date &&
                    dayStr <= leave.end_date
            );
            if (isOnLeave) return 'away';
            const dayMap: Record<string, string> = {
                Mon: 'Monday',
                Tue: 'Tuesday',
                Wed: 'Wednesday',
                Thu: 'Thursday',
                Fri: 'Friday',
            };
            const attendedDays = attendance
                ? attendance
                    .split(',')
                    .map((s) => dayMap[s.trim()] || s.trim())
                : [];
            return attendedDays.includes(dayLabel) ? 'office' : 'home';
        };

        const AvatarWithHover: React.FC<{ member: any; status: 'office' | 'home' | 'away' }> = ({ member, status }) => {
            const [show, setShow] = useState(false);
            const attendance = getMemberWeek(member.Initials);
            const days = weekLabels.map((label, idx) => {
                const d = new Date(weekStartDate);
                d.setDate(weekStartDate.getDate() + idx);
                const ds = d.toISOString().split('T')[0];
                const st = getStatusForDay(attendance, member.Initials, label, ds);
                const icon = st === 'office' ? 'CityNext' : st === 'home' ? 'Home' : 'Airplane';
                return (
                    <div key={label} className={avatarStyle} style={{ background: snakeItemBackground(st) }}>
                        <Icon iconName={icon} />
                    </div>
                );
            });
            return (
                <div
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                    style={{ position: 'relative' }}
                >
                    <div
                        className={avatarStyle}
                        style={{ background: snakeItemBackground(status) }}
                        title={member.Nickname || member.First}
                    >
                        {member.Initials.toUpperCase()}
                    </div>
                    <div
                        className={mergeStyles({
                            position: 'absolute',
                            left: 0,
                            top: '36px',
                            display: 'flex',
                            gap: '4px',
                            backgroundColor: isDarkMode
                                ? colours.dark.sectionBackground
                                : colours.light.sectionBackground,
                            border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                            padding: '4px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'max-width 0.3s ease, opacity 0.3s ease',
                            overflow: 'hidden',
                            maxWidth: show ? '500px' : '0px',
                            opacity: show ? 1 : 0,
                            zIndex: 10,
                        })}
                    >
                        {days}
                    </div>
                </div>
            );
        };

        const renderSnake = () => {
            const items: { type: 'icon' | 'member'; status: 'office' | 'home' | 'away'; icon?: string; member?: any }[] = [];
            items.push({ type: 'icon', status: 'office', icon: 'CityNext' });
            groups.office.forEach((m) => items.push({ type: 'member', status: 'office', member: m }));
            items.push({ type: 'icon', status: 'home', icon: 'Home' });
            groups.home.forEach((m) => items.push({ type: 'member', status: 'home', member: m }));
            items.push({ type: 'icon', status: 'away', icon: 'Airplane' });
            groups.away.forEach((m) => items.push({ type: 'member', status: 'away', member: m }));

            const perRow = 6;
            const rows: typeof items[] = [];
            for (let i = 0; i < items.length; i += perRow) {
                rows.push(items.slice(i, i + perRow));
            }

            return (
                <div className={snakeGroup}>
                    {rows.map((row, idx) => (
                        <div key={idx} className={snakeRow(idx)}>
                            {row.map((it, i) =>
                                it.type === 'icon' ? (
                                    <div key={i} className={avatarStyle} style={{ background: snakeItemBackground(it.status) }}>
                                        <Icon iconName={it.icon!} />
                                    </div>
                                ) : (
                                    <AvatarWithHover key={it.member.Initials} {...{ member: it.member, status: it.status }} />
                                )
                            )}
                        </div>
                    ))}
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
                            <div className={groupContainer}>{renderSnake()}</div>
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
