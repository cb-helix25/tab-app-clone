// src/tabs/home/Home.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useRef, // ADDED
} from 'react';
import {
  mergeStyles,
  Text,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  IconButton,
  Stack,
  DetailsList,
  IColumn,
  DetailsListLayoutMode,
  Persona,
  PersonaSize,
  PersonaPresence,
  DefaultButton,
  Icon,
  Toggle,
  keyframes,
} from '@fluentui/react';
import { colours } from '../../app/styles/colours';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import MetricCard from './MetricCard';
import GreyHelixMark from '../../assets/grey helix mark.png';
import InAttendanceImg from '../../assets/in_attendance.png';
import WfhImg from '../../assets/wfh.png';
import OutImg from '../../assets/outv2.png';
import '../../app/styles/VerticalLabelPanel.css';
import { useTheme } from '../../app/functionality/ThemeContext';
import '../../app/styles/MetricCard.css';
import { dashboardTokens, cardTokens, cardStyles } from '../instructions/componentTokens';
import { componentTokens } from '../../app/styles/componentTokens';

import Tasking from '../../CustomForms/Tasking';
import TelephoneAttendance from '../../CustomForms/TelephoneAttendance';

import FormCard from '../forms/FormCard';
import ResourceCard from '../resources/ResourceCard';

import { FormItem, Matter, Transaction, TeamData, OutstandingClientBalance, BoardroomBooking, SoundproofPodBooking, SpaceBooking, FutureBookingsResponse, InstructionData } from '../../app/functionality/types';

import { Resource } from '../resources/Resources';

import FormDetails from '../forms/FormDetails';
import ResourceDetails from '../resources/ResourceDetails';

import HomePanel from './HomePanel';
import { Context as TeamsContextType } from '@microsoft/teams-js';

import BespokePanel from '../../app/functionality/BespokePanel';

import CreateTimeEntryForm from '../../CustomForms/CreateTimeEntryForm';
import AnnualLeaveForm from '../../CustomForms/AnnualLeaveForm';

// NEW: Import placeholders for approvals & bookings
import AnnualLeaveApprovals from '../../CustomForms/AnnualLeaveApprovals';
import AnnualLeaveBookings from '../../CustomForms/AnnualLeaveBookings';

import ActionSection from './ActionSection';
import { sharedDefaultButtonStyles } from '../../app/styles/ButtonStyles';

// NEW: Import the updated QuickActionsCard component
import QuickActionsCard from './QuickActionsCard';

import OutstandingBalancesList from '../transactions/OutstandingBalancesList';

import BookSpaceForm from '../../CustomForms/BookSpaceForm';

import Attendance from './Attendance'; // Import the Attendance component

import TransactionCard from '../transactions/TransactionCard';
import TransactionApprovalPopup from '../transactions/TransactionApprovalPopup';

import OutstandingBalanceCard from '../transactions/OutstandingBalanceCard'; // Adjust the path if needed



initializeIcons();

//////////////////////
// Interfaces
//////////////////////

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
  hearing_confirmation?: string; // "yes" or "no"
  hearing_details?: string;      // Additional details when hearing_confirmation is "no"
}

interface HomeProps {
  context: TeamsContextType | null;
  userData: any;
  enquiries: any[] | null;
  onAllMattersFetched?: (matters: Matter[]) => void;
  onOutstandingBalancesFetched?: (data: any) => void;
  onPOID6YearsFetched?: (data: any[]) => void;
  onTransactionsFetched?: (transactions: Transaction[]) => void;
  onBoardroomBookingsFetched?: (data: BoardroomBooking[]) => void;
  onSoundproofBookingsFetched?: (data: SoundproofPodBooking[]) => void;
  teamData?: TeamData[] | null;
}

interface QuickLink {
  title: string;
  icon: string;
}

interface Person {
  id: string;
  name: string;
  initials: string;
  presence: PersonaPresence;
  nickname?: string;
}

interface CollapsibleSectionProps {
  title: string;
  metrics: { title: string }[];
  children: React.ReactNode;
}

interface MetricItem {
  title: string;
  isTimeMoney?: boolean;
  isMoneyOnly?: boolean;
  money?: number;
  hours?: number;
  prevMoney?: number;
  prevHours?: number;
  count?: number;
  prevCount?: number;
  showDial?: boolean;
  dialTarget?: number;
  dialValue?: number;
  dialSuffix?: string;
}

export interface TeamMember {
  First: string;
  Initials: string;
  "Entra ID": string;
  Nickname: string;
}

interface MatterBalance {
  id: number;
  ClientName: string;
  total_outstanding_balance: number;
  associated_matter_ids: number[];
}

//////////////////////
// Collapsible Section
//////////////////////

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, metrics, children }) => {
  // Start expanded by default
  const [collapsed, setCollapsed] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const toggleCollapse = () => setCollapsed(!collapsed);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, collapsed]);

  // Build the metric labels string (only used when collapsed)
  const metricLabels = metrics.length > 0 ? metrics.map(m => m.title).join(' | ') : '';

  return (
    <div
      style={{
        marginBottom: '20px',
        boxShadow: (cardStyles.root as React.CSSProperties).boxShadow,
        borderRadius: (cardStyles.root as React.CSSProperties).borderRadius,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={toggleCollapse}
        style={{
          backgroundColor: collapsed
            ? componentTokens.stepHeader.base.backgroundColor
            : componentTokens.stepHeader.active.backgroundColor,
          color: collapsed
            ? componentTokens.stepHeader.base.textColor
            : componentTokens.stepHeader.active.textColor,
          padding: '8px 12px',
          minHeight: '36px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '16px',
          borderRadius: componentTokens.stepHeader.base.borderRadius,
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {title}
          {collapsed && metricLabels && (
            <span style={{ marginLeft: '10px', fontWeight: 400 }}>
              {metricLabels}
            </span>
          )}
        </span>
        <Icon
          iconName="ChevronDown"
          styles={{
            root: {
              fontSize: '16px',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            }
          }}
        />
      </div>
      <div
        ref={contentRef}
        style={{
          padding: componentTokens.summaryPane.base.padding,
          backgroundColor: colours.light.sectionBackground,
          boxShadow: componentTokens.summaryPane.base.boxShadow,
          borderRadius: componentTokens.summaryPane.base.borderRadius,
          maxHeight: collapsed ? 0 : contentHeight,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
};


//////////////////////
// Quick Actions Order
//////////////////////

const quickActionOrder: Record<string, number> = {
  'Confirm Attendance': 1,
  'Review Instructions': 2,
  'Create a Task': 3,
  'Request CollabSpace': 4,
  'Save Telephone Note': 5,
  'Save Attendance Note': 6,
  'Request ID': 7,
  'Open a Matter': 8,
  'Request Annual Leave': 9,
};

//////////////////////
// Quick Actions
//////////////////////

const quickActions: QuickLink[] = [
  { title: 'Confirm Attendance', icon: 'Accept' },
  { title: 'Create a Task', icon: 'Checklist' },
  { title: 'Save Telephone Note', icon: 'Comment' },
  { title: 'Request Annual Leave', icon: 'Calendar' },
  { title: 'Book Space', icon: 'Room' },
];

//////////////////////
// Styles
//////////////////////

const containerStyle = (isDarkMode: boolean) =>
  mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    padding: '16px',
    minHeight: '100vh',
    boxSizing: 'border-box',
  });

const headerStyle = mergeStyles({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  width: '100%',
  padding: '10px 0',
  gap: '16px',
});

const greetingStyle = (isDarkMode: boolean) =>
  mergeStyles({
    fontWeight: '600',
    fontSize: '32px',
    whiteSpace: 'nowrap',
    color: isDarkMode ? colours.dark.text : colours.light.text,
  });

const reviewMessageStyle = (isDarkMode: boolean) =>
  mergeStyles({
    fontWeight: '600',
    fontSize: '18px',
    color: isDarkMode ? colours.cta : colours.cta,
    display: 'flex',
    alignItems: 'center',
  });

const mainContentStyle = mergeStyles({
  display: 'flex',
  flexDirection: 'column',
});

const quickLinksStyle = (isDarkMode: boolean) =>
  mergeStyles({
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
    padding: '10px',
    transition: 'background-color 0.3s, box-shadow 0.3s',
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    overflowX: 'auto',
    alignItems: 'center',
    marginBottom: '16px',
  });

const tableAnimationStyle = mergeStyles({
  animation: 'fadeIn 0.5s ease-in-out',
});

const calculateAnimationDelay = (row: number, col: number) => (row + col) * 0.1;

const versionStyle = mergeStyles({
  textAlign: 'center',
  fontSize: '14px',
  color: '#888',
  marginTop: '40px',
});

const subLabelStyle = (isDarkMode: boolean) =>
  mergeStyles({
    fontWeight: '600',
    fontSize: '16px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
  });

const favouritesGridStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '16px',
  '@media (min-width: 1000px)': { gridTemplateColumns: 'repeat(5, 1fr)' },
});

const peopleGridStyle = mergeStyles({
  display: 'grid',
  paddingLeft: '80px',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '16px',
  alignItems: 'center',
  width: '100%',
});

const sectionContainerStyle = (isDarkMode: boolean) =>
  mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    padding: '16px',
    borderRadius: '12px',
    boxShadow: isDarkMode
      ? `0 4px 12px ${colours.dark.border}`
      : `0 4px 12px ${colours.light.border}`,
    position: 'relative',
    width: '100%',
  });

const fadeInAnimationStyle = mergeStyles({
  animation: 'fadeIn 0.5s ease-in-out',
});

//////////////////////
// TabLabel Component
//////////////////////
const TabLabel: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div
      className={mergeStyles({
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '50px',
        backgroundColor: colours.grey,
        zIndex: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <span style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
};

//////////////////////
// Utility: Flatten & Transform Context
//////////////////////

const flattenObject = (obj: any, prefix = ''): { key: string; value: any }[] => {
  let result: { key: string; value: any }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v))
      result = result.concat(flattenObject(v, newKey));
    else result.push({ key: newKey, value: v });
  }
  return result;
};

const transformContext = (contextObj: any): { key: string; value: string }[] => {
  if (!contextObj || typeof contextObj !== 'object') {
    console.warn('Invalid context object:', contextObj);
    return [];
  }
  const flattened = flattenObject(contextObj);
  return flattened.map(({ key, value }) => ({
    key,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }));
};

const createColumnsFunction = (isDarkMode: boolean): IColumn[] => [
  {
    key: 'key',
    name: 'Key',
    fieldName: 'key',
    minWidth: 150,
    maxWidth: 200,
    isResizable: true,
    styles: { root: { color: isDarkMode ? colours.dark.text : colours.light.text } },
  },
  {
    key: 'value',
    name: 'Value',
    fieldName: 'value',
    minWidth: 300,
    maxWidth: 600,
    isResizable: true,
    styles: { root: { color: isDarkMode ? colours.dark.text : colours.light.text } },
  },
];

//////////////////////
// PersonBubble Component
//////////////////////

interface PersonBubbleProps {
  person: Person;
  isDarkMode: boolean;
  animationDelay?: number;
  avatarUrlOverride?: string;
}

const PersonBubble: React.FC<PersonBubbleProps> = ({
  person,
  isDarkMode,
  animationDelay,
  avatarUrlOverride,
}) => {
  const bubbleStyle = mergeStyles({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    opacity: 0,
    transform: 'translateY(20px)',
    animation: `fadeInUp 0.3s ease forwards`,
    animationDelay: animationDelay ? `${animationDelay}s` : '0s',
  });

  const textBubbleStyle = mergeStyles({
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: colours.grey,
    borderRadius: '12px',
    padding: '0 10px 0 50px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 3,
    whiteSpace: 'nowrap',
  });

  const textStyle = mergeStyles({ color: isDarkMode ? colours.dark.text : colours.light.text });

  let imageUrl = WfhImg;
  let presence = PersonaPresence.none;

  if (person.presence === PersonaPresence.online) {
    imageUrl = InAttendanceImg;
    presence = PersonaPresence.online;
  } else if (person.presence === PersonaPresence.busy) {
    imageUrl = OutImg;
    presence = PersonaPresence.busy;
  }

  return (
    <div className={bubbleStyle}>
      <div style={{ position: 'relative', zIndex: 4 }}>
        <Persona
          text=""
          imageUrl={avatarUrlOverride || imageUrl}
          size={PersonaSize.size24}
          presence={presence}
          hidePersonaDetails
          styles={{
            root: {
              zIndex: 4,
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '50%',
            },
          }}
        />
        <div className={textBubbleStyle}>
          <Text className={textStyle}>{person.nickname || person.name}</Text>
        </div>
      </div>
    </div>
  );
};

const getISOWeek = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7) + 1;
};

//////////////////////
// Caching Variables (module-level)
//////////////////////

// Helper to convert "dd/mm/yyyy" to "yyyy-mm-dd"
const convertToISO = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

interface AttendanceData {
  attendance: any[]; // Replace 'any[]' with a specific type if you know the structure
  team: any[];      // Replace 'any[]' with TeamMember[] or similar if known
}

let cachedAttendance: AttendanceData | null = null;
let cachedAttendanceError: string | null = null;
let cachedPOID6Years: any[] | null = null;

let cachedAnnualLeave: AnnualLeaveRecord[] | null = null;
let cachedAnnualLeaveError: string | null = null;

let cachedFutureLeaveRecords: AnnualLeaveRecord[] | null = null; // ADDED

let cachedWipClio: any | null = null;
let cachedWipClioError: string | null = null;
let cachedRecovered: number | null = null;
let cachedRecoveredError: string | null = null;

let cachedAllMatters: Matter[] | null = null;
let cachedAllMattersError: string | null = null;

let cachedOutstandingBalances: any | null = null;

// At the top of Home.tsx, along with your other caching variables:
let cachedTransactions: Transaction[] | null = null;

//////////////////////
// Helper: Ensure "LZ" is in Approvers
//////////////////////

const ensureLZInApprovers = (approvers: string[] = []): string[] => {
  return approvers.includes('LZ') ? approvers : [...approvers, 'LZ'];
};

//////////////////////
// CognitoForm Component
//////////////////////

const CognitoForm: React.FC<{ dataKey: string; dataForm: string }> = ({ dataKey, dataForm }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://www.cognitoforms.com/f/seamless.js';
      script.setAttribute('data-key', dataKey);
      script.setAttribute('data-form', dataForm);
      script.async = true;
      containerRef.current.appendChild(script);
      return () => {
        if (containerRef.current) containerRef.current.innerHTML = '';
      };
    }
  }, [dataKey, dataForm]);
  return <div ref={containerRef} />;
};

//////////////////////
// Home Component
//////////////////////

const Home: React.FC<HomeProps> = ({ context, userData, enquiries, onAllMattersFetched, onOutstandingBalancesFetched, onPOID6YearsFetched, onTransactionsFetched, teamData, onBoardroomBookingsFetched, onSoundproofBookingsFetched }) => {
  const { isDarkMode } = useTheme();

  // Transform teamData into our lite TeamMember type
  const transformedTeamData = useMemo<TeamMember[]>(() => {
    const data: TeamData[] = teamData ?? [];
    return data
      .filter((member) => member.status === 'active')
      .map((member: TeamData) => ({
        First: member.First ?? '',
        Initials: member.Initials ?? '',
        "Entra ID": member["Entra ID"] ?? '',
        Nickname: member.Nickname ?? member.First ?? '',
      }));
  }, [teamData]);

  const renderContextsPanelContent = () => (
    <Stack tokens={dashboardTokens} styles={cardStyles}>
      <Stack tokens={cardTokens}>
        <Text variant="xLarge" styles={{ root: { fontWeight: '600' } }}>
          Teams Context
        </Text>
        <DetailsList
          items={transformContext(context)}
          columns={createColumnsFunction(isDarkMode)}
          setKey="teamsSet"
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible={false}
          styles={{
            root: {
              selectors: {
                '.ms-DetailsRow': { padding: '8px 0', borderBottom: 'none' },
                '.ms-DetailsHeader': { display: 'none' },
              },
            },
          }}
        />
      </Stack>
      <Stack tokens={cardTokens}>
        <Text variant="xLarge" styles={{ root: { fontWeight: '600' } }}>
          SQL Context
        </Text>
        <DetailsList
          items={transformContext(userData)}
          columns={createColumnsFunction(isDarkMode)}
          setKey="sqlSet"
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible={false}
          styles={{
            root: {
              selectors: {
                '.ms-DetailsRow': { padding: '8px 0', borderBottom: 'none' },
                '.ms-DetailsHeader': { display: 'none' },
              },
            },
          }}
        />
      </Stack>
    </Stack>
  );

  // Inside the Home component, add state (near other state declarations)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionPopupOpen, setIsTransactionPopupOpen] = useState<boolean>(false);

  // Replace the placeholder handler
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionPopupOpen(true);
  };
  
  const handleTransactionSubmit = (
    values: { transferRequested: boolean; customAmount?: number; transferCustom?: boolean },
    updatedTransaction: Transaction
  ) => {
    // Update the transactions state with the updated transaction
    setTransactions((prevTransactions) =>
      prevTransactions.map((tx) =>
        tx.transaction_id === updatedTransaction.transaction_id ? updatedTransaction : tx
      )
    );
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((tx) =>
        tx.transaction_id === updatedTransaction.transaction_id ? updatedTransaction : tx
      )
    );
  };

  // ADDED: Store user initials so they don't reset on remount
  const storedUserInitials = useRef<string | null>(null); // ADDED
  const attendanceRef = useRef<{ focusTable: () => void; setWeek: (week: 'current' | 'next') => void }>(null); // Add this line

  // State declarations...
  const [greeting, setGreeting] = useState<string>('');
  const [typedGreeting, setTypedGreeting] = useState<string>('');
  const [enquiriesToday, setEnquiriesToday] = useState<number>(0);
  const [enquiriesWeekToDate, setEnquiriesWeekToDate] = useState<number>(0);
  const [enquiriesMonthToDate, setEnquiriesMonthToDate] = useState<number>(0);
  const [todaysTasks, setTodaysTasks] = useState<number>(10);
  const [tasksDueThisWeek, setTasksDueThisWeek] = useState<number>(20);
  const [completedThisWeek, setCompletedThisWeek] = useState<number>(15);
  const [recordedTime, setRecordedTime] = useState<{ hours: number; money: number }>({
    hours: 120,
    money: 1000,
  });
  const [prevEnquiriesToday, setPrevEnquiriesToday] = useState<number>(8);
  const [prevEnquiriesWeekToDate, setPrevEnquiriesWeekToDate] = useState<number>(18);
  const [prevEnquiriesMonthToDate, setPrevEnquiriesMonthToDate] = useState<number>(950);
  const [prevTodaysTasks, setPrevTodaysTasks] = useState<number>(12);
  const [prevTasksDueThisWeek, setPrevTasksDueThisWeek] = useState<number>(18);
  const [prevCompletedThisWeek, setPrevCompletedThisWeek] = useState<number>(17);
  const [prevRecordedTime, setPrevRecordedTime] = useState<{ hours: number; money: number }>({
    hours: 110,
    money: 900,
  });
  const [isContextsExpanded, setIsContextsExpanded] = useState<boolean>(false);
  const [formsFavorites, setFormsFavorites] = useState<FormItem[]>([]);
  const [resourcesFavorites, setResourcesFavorites] = useState<Resource[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isBespokePanelOpen, setIsBespokePanelOpen] = useState<boolean>(false);
  const [bespokePanelContent, setBespokePanelContent] = useState<ReactNode>(null);
  const [bespokePanelTitle, setBespokePanelTitle] = useState<string>('');
  const [isContextPanelOpen, setIsContextPanelOpen] = useState<boolean>(false);
  const [bankHolidays, setBankHolidays] = useState<Set<string>>(new Set());

  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [annualLeaveRecords, setAnnualLeaveRecords] = useState<AnnualLeaveRecord[]>([]);
  const [annualLeaveError, setAnnualLeaveError] = useState<string | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(false);
  const [isLoadingAnnualLeave, setIsLoadingAnnualLeave] = useState<boolean>(false);
  const [wipClioData, setWipClioData] = useState<any | null>(null);
  const [wipClioError, setWipClioError] = useState<string | null>(null);
  const [recoveredData, setRecoveredData] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recoveredError, setRecoveredError] = useState<string | null>(null);
  const [isLoadingWipClio, setIsLoadingWipClio] = useState<boolean>(false);
  const [isLoadingRecovered, setIsLoadingRecovered] = useState<boolean>(false);
  const [futureLeaveRecords, setFutureLeaveRecords] = useState<AnnualLeaveRecord[]>([]);
  const [annualLeaveTotals, setAnnualLeaveTotals] = useState<any>(null);
  const [isActionsLoading, setIsActionsLoading] = useState<boolean>(true);

  const [allMatters, setAllMatters] = useState<Matter[] | null>(null);
  const [allMattersError, setAllMattersError] = useState<string | null>(null);
  const [isLoadingAllMatters, setIsLoadingAllMatters] = useState<boolean>(false);

  const [timeMetricsCollapsed, setTimeMetricsCollapsed] = useState(false);
  const [conversionMetricsCollapsed, setConversionMetricsCollapsed] = useState(false);

  const [poid6Years, setPoid6Years] = useState<any[] | null>(null);
  const [isLoadingPOID6Years, setIsLoadingPOID6Years] = useState<boolean>(false);
  const [poid6YearsError, setPoid6YearsError] = useState<string | null>(null);

  const immediateActionsReady = !isLoadingAttendance && !isLoadingAnnualLeave && !isActionsLoading;

  const [annualLeaveAllData, setAnnualLeaveAllData] = useState<any[]>([]);

  const [attendanceTeam, setAttendanceTeam] = useState<any[]>([]);

  const [outstandingBalancesData, setOutstandingBalancesData] = useState<any | null>(null);

  const [futureBookings, setFutureBookings] = useState<FutureBookingsResponse>({
    boardroomBookings: [],
    soundproofBookings: []
  });

  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);

  const getCurrentWeekKey = (): string => {
    const monday = getMondayOfCurrentWeek();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    const mondayStr = monday.toLocaleDateString('en-GB', options);
    const sundayStr = sunday.toLocaleDateString('en-GB', options);
    const mondayName = monday.toLocaleDateString('en-GB', { weekday: 'long' });
    const sundayName = sunday.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${mondayName}, ${mondayStr} - ${sundayName}, ${sundayStr}`;
  };

  const getMondayOfCurrentWeek = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday;
  };
  
  // Add these functions immediately after:
  const generateWeekKey = (monday: Date): string => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-GB', options);
    const sundayStr = sunday.toLocaleDateString('en-GB', options);
    const mondayName = monday.toLocaleDateString('en-GB', { weekday: 'long' });
    const sundayName = sunday.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${mondayName}, ${mondayStr} - ${sundayName}, ${sundayStr}`;
  };
  
  const getNextWeekKey = (): string => {
    const currentMonday = getMondayOfCurrentWeek();
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + 7);
    return generateWeekKey(nextMonday);
  };

  // Add the following function to update the approval state:
const handleApprovalUpdate = (updatedRequestId: string, newStatus: string) => {
  // Remove the updated approval from annualLeaveRecords.
  setAnnualLeaveRecords((prevRecords) =>
    prevRecords.filter(record => record.id !== updatedRequestId)
  );

  // Also remove it from the full set of leave data if applicable.
  setAnnualLeaveAllData((prevAllData) =>
    prevAllData.filter(record => record.id !== updatedRequestId)
  );

  // You may also add any notifications or logging here.
  console.log(`Approval with ID ${updatedRequestId} has been marked as ${newStatus}.`);
};

  // ADDED: userInitials logic - store in ref so it doesn't reset on re-render.
  const rawUserInitials = userData?.[0]?.Initials || '';
  useEffect(() => {
    if (rawUserInitials) {
      storedUserInitials.current = rawUserInitials;
    }
  }, [rawUserInitials]);
  // Now anywhere we used userInitials, we can do:
  const userInitials = storedUserInitials.current || rawUserInitials;

  useEffect(() => {
    const fetchBankHolidays = async () => {
      try {
        const response = await fetch('https://www.gov.uk/bank-holidays.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch bank holidays: ${response.status}`);
        }
        const data = await response.json();
        const currentYear = new Date().getFullYear();
        const englandAndWalesEvents = data['england-and-wales'].events || [];
        const holidaysThisYear = englandAndWalesEvents
          .filter((event: { date: string }) => new Date(event.date).getFullYear() === currentYear)
          .map((event: { date: string }) => event.date);
        setBankHolidays(new Set(holidaysThisYear));
      } catch (error) {
        console.error('Error fetching bank holidays:', error);
      }
    };
    fetchBankHolidays();
  }, []);

  useEffect(() => {
    const storedFormsFavorites = localStorage.getItem('formsFavorites');
    const storedResourcesFavorites = localStorage.getItem('resourcesFavorites');
    if (storedFormsFavorites) {
      setFormsFavorites(JSON.parse(storedFormsFavorites));
    }
    if (storedResourcesFavorites) {
      setResourcesFavorites(JSON.parse(storedResourcesFavorites));
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'formsFavorites' && event.newValue) {
        setFormsFavorites(JSON.parse(event.newValue));
      }
      if (event.key === 'resourcesFavorites' && event.newValue) {
        setResourcesFavorites(JSON.parse(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (
      userData &&
      Array.isArray(userData) &&
      userData.length > 0 &&
      (userData[0].First || userData[0].First_Name)
    ) {
      const firstName = userData[0].First || userData[0].First_Name || 'User';
      setCurrentUserName(firstName);
      const email = userData[0].Email || '';
      setCurrentUserEmail(email);
      const currentHour = new Date().getHours();
      let timeOfDay = 'Hello';
      if (currentHour < 12) {
        timeOfDay = 'Good Morning';
      } else if (currentHour < 18) {
        timeOfDay = 'Good Afternoon';
      } else {
        timeOfDay = 'Good Evening';
      }
      setGreeting(`${timeOfDay}, ${firstName}.`);
    } else {
      setGreeting('Hello, User.');
    }
  }, [userData]);

  useEffect(() => {
    if (enquiries && currentUserEmail) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const todayCount = enquiries.filter((enquiry: any) => {
        if (!enquiry.Touchpoint_Date) return false;
        const enquiryDate = new Date(enquiry.Touchpoint_Date);
        return (
          enquiryDate.toDateString() === today.toDateString() &&
          enquiry.Point_of_Contact === currentUserEmail
        );
      }).length;
      const weekToDateCount = enquiries.filter((enquiry: any) => {
        if (!enquiry.Touchpoint_Date) return false;
        const enquiryDate = new Date(enquiry.Touchpoint_Date);
        return (
          enquiryDate >= startOfWeek &&
          enquiryDate <= today &&
          enquiry.Point_of_Contact === currentUserEmail
        );
      }).length;
      const monthToDateCount = enquiries.filter((enquiry: any) => {
        if (!enquiry.Touchpoint_Date) return false;
        const enquiryDate = new Date(enquiry.Touchpoint_Date);
        return (
          enquiryDate >= startOfMonth &&
          enquiryDate <= today &&
          enquiry.Point_of_Contact === currentUserEmail
        );
      }).length;
      setEnquiriesToday(todayCount);
      setEnquiriesWeekToDate(weekToDateCount);
      setEnquiriesMonthToDate(monthToDateCount);
    }
  }, [enquiries, currentUserEmail]);

  useEffect(() => {
    let currentIndex = 0;
    setTypedGreeting('');
    const typingInterval = setInterval(() => {
      if (currentIndex < greeting.length) {
        setTypedGreeting((prev) => prev + greeting[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 25);
    return () => clearInterval(typingInterval);
  }, [greeting]);

  useEffect(() => {
    // Always restore from cache on mount if available
    if (cachedAttendance) {
      setAttendanceRecords(cachedAttendance.attendance); // Use .attendance here
      setAttendanceTeam(cachedAttendance.team || []);    // Safe now with proper type
    }
    if (cachedAttendanceError) {
      setAttendanceError(cachedAttendanceError);
    }
    if (cachedAnnualLeave) {
      setAnnualLeaveRecords(cachedAnnualLeave);
    }
    if (cachedFutureLeaveRecords) {
      setFutureLeaveRecords(cachedFutureLeaveRecords);
    }
    if (cachedAnnualLeaveError) {
      setAnnualLeaveError(cachedAnnualLeaveError);
    }
    // Set loading states to false if we have cached data
    if (cachedAttendance || cachedAttendanceError) {
      setIsLoadingAttendance(false);
    }
    if (cachedAnnualLeave || cachedAnnualLeaveError) {
      setIsLoadingAnnualLeave(false);
      setIsActionsLoading(false);
    }
  
    // Only fetch if no cached data exists
    if (!cachedAttendance && !cachedAttendanceError) {
      const fetchData = async () => {
        try {
          setIsLoadingAttendance(true);
          const attendanceResponse = await fetch(
            `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_ATTENDANCE_PATH}?code=${process.env.REACT_APP_GET_ATTENDANCE_CODE}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          );
          if (!attendanceResponse.ok)
            throw new Error(`Failed to fetch attendance: ${attendanceResponse.status}`);
          const attendanceData = await attendanceResponse.json();
          cachedAttendance = attendanceData; // Store the full object, not just .attendance
          setAttendanceRecords(attendanceData.attendance);
          setAttendanceTeam(attendanceData.team); // store the "lite" team separately
        } catch (error: any) {
          console.error('Error fetching attendance:', error);
          cachedAttendanceError = error.message || 'Unknown error occurred.';
          setAttendanceError(error.message || 'Unknown error occurred.');
          setAttendanceRecords([]);
          setAttendanceTeam([]);
        } finally {
          setIsLoadingAttendance(false);
        }
  
        try {
          setIsLoadingAnnualLeave(true);
          const annualLeaveResponse = await fetch(
            `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_ANNUAL_LEAVE_PATH}?code=${process.env.REACT_APP_GET_ANNUAL_LEAVE_CODE}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initials: userData[0]?.Initials || '' }),
            }
          );
          if (!annualLeaveResponse.ok)
            throw new Error(`Failed to fetch annual leave: ${annualLeaveResponse.status}`);
          const annualLeaveData = await annualLeaveResponse.json();
          if (annualLeaveData && Array.isArray(annualLeaveData.annual_leave)) {
            const mappedAnnualLeave: AnnualLeaveRecord[] = annualLeaveData.annual_leave.map(
              (rec: any) => ({
                person: rec.person,
                start_date: rec.start_date,
                end_date: rec.end_date,
                reason: rec.reason,
                status: rec.status,
                id: rec.request_id ? String(rec.request_id) : rec.id || `temp-${rec.start_date}-${rec.end_date}`,
                rejection_notes: rec.rejection_notes || undefined,
                approvers: ensureLZInApprovers(rec.approvers),
                hearing_confirmation: rec.hearing_confirmation,
                hearing_details: rec.hearing_details || undefined,
              })
            );
            cachedAnnualLeave = mappedAnnualLeave;
            setAnnualLeaveRecords(mappedAnnualLeave);
  
            if (Array.isArray(annualLeaveData.future_leave)) {
              const mappedFutureLeave: AnnualLeaveRecord[] = annualLeaveData.future_leave.map(
                (rec: any) => ({
                  person: rec.person,
                  start_date: rec.start_date,
                  end_date: rec.end_date,
                  reason: rec.reason,
                  status: rec.status,
                  id: rec.request_id ? String(rec.request_id) : rec.id || `temp-${rec.start_date}-${rec.end_date}`,
                  rejection_notes: rec.rejection_notes || undefined,
                  approvers: ensureLZInApprovers(rec.approvers),
                  hearing_confirmation: rec.hearing_confirmation,
                  hearing_details: rec.hearing_details || undefined,
                })
              );
              cachedFutureLeaveRecords = mappedFutureLeave;
              setFutureLeaveRecords(mappedFutureLeave);
            }
  
            if (annualLeaveData.user_details && annualLeaveData.user_details.totals) {
              setAnnualLeaveTotals(annualLeaveData.user_details.totals);
            }
            if (annualLeaveData.all_data) {
              setAnnualLeaveAllData(annualLeaveData.all_data);
            }
          } else {
            throw new Error('Invalid annual leave data format.');
          }
        } catch (error: any) {
          console.error('Error fetching annual leave:', error);
          cachedAnnualLeaveError = error.message || 'Unknown error occurred.';
          setAnnualLeaveError(error.message || 'Unknown error occurred.');
          setAnnualLeaveRecords([]);
        } finally {
          setIsLoadingAnnualLeave(false);
          setIsActionsLoading(false);
        }
      };
      fetchData();
    }
  }, [userData]);

  useEffect(() => {
    if (cachedWipClio || cachedWipClioError || cachedRecovered || cachedRecoveredError) {
      setWipClioData(cachedWipClio);
      setWipClioError(cachedWipClioError);
      setRecoveredData(cachedRecovered);
      setRecoveredError(cachedRecoveredError);
      setIsLoadingWipClio(false);
      setIsLoadingRecovered(false);
    } else {
      const fetchWipClioAndRecovered = async () => {
        try {
          setIsLoadingWipClio(true);
          setIsLoadingRecovered(true);
          const clioIDForWip = parseInt(userData[0]['Clio ID'], 10);
          const clioIDForRecovered =
            userData?.[0]?.["Full Name"]?.trim() === "Lukasz Zemanek"
              ? 142961
              : clioIDForWip;
          const [wipResponse, recoveredResponse] = await Promise.all([
            fetch(
              `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_WIP_CLIO_PATH}?code=${process.env.REACT_APP_GET_WIP_CLIO_CODE}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ClioID: clioIDForWip }),
              }
            ),
            fetch(
              `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_RECOVERED_PATH}?code=${process.env.REACT_APP_GET_RECOVERED_CODE}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ClioID: clioIDForRecovered }),
              }
            ),
          ]);
          if (!wipResponse.ok)
            throw new Error(`Failed to fetch WIP Clio: ${wipResponse.status}`);
          const wipData = await wipResponse.json();
          cachedWipClio = wipData;
          setWipClioData(wipData);
          if (!recoveredResponse.ok)
            throw new Error(`Failed to fetch Recovered: ${recoveredResponse.status}`);
          const recoveredData = await recoveredResponse.json();
          cachedRecovered = recoveredData.totalPaymentAllocated;
          setRecoveredData(recoveredData.totalPaymentAllocated);
        } catch (error: any) {
          console.error('Error fetching WIP Clio or Recovered:', error);
          if (error.message.includes('WIP Clio')) {
            cachedWipClioError = error.message || 'Unknown error occurred.';
            setWipClioError(error.message || 'Unknown error occurred.');
            setWipClioData(null);
          } else {
            cachedRecoveredError = error.message || 'Unknown error occurred.';
            setRecoveredError(error.message || 'Unknown error occurred.');
            setRecoveredData(null);
          }
        } finally {
          setIsLoadingWipClio(false);
          setIsLoadingRecovered(false);
        }
      };
      fetchWipClioAndRecovered();
    }
  }, [userData]);  

  useEffect(() => {
    if (cachedAllMatters || cachedAllMattersError) {
      setAllMatters(cachedAllMatters || []);
      setAllMattersError(cachedAllMattersError);
      setIsLoadingAllMatters(false);
    } else {
      const fetchAllMattersData = async () => {
        try {
          setIsLoadingAllMatters(true);
          const response = await fetch(
            `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_ALL_MATTERS_PATH}?code=${process.env.REACT_APP_GET_ALL_MATTERS_CODE}`,
            { method: 'GET' }
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch all matters: ${response.status}`);
          }
          const rawData = await response.json();
          const mapData = (items: any[]): Matter[] => {
            return items.map((item) => ({
              DisplayNumber: item['Display Number'] || '',
              OpenDate: item['Open Date'] || '',
              MonthYear: item['MonthYear'] || '',
              YearMonthNumeric: item['YearMonthNumeric'] || 0,
              ClientID: item['Client ID'] || '',
              ClientName: item['Client Name'] || '',
              ClientPhone: item['Client Phone'] || '',
              ClientEmail: item['Client Email'] || '',
              Status: item['Status'] || '',
              UniqueID: item['Unique ID'] || '',
              Description: item['Description'] || '',
              PracticeArea: item['Practice Area'] || '',
              Source: item['Source'] || '',
              Referrer: item['Referrer'] || '',
              ResponsibleSolicitor: item['Responsible Solicitor'] || '',
              OriginatingSolicitor: item['Originating Solicitor'] || '',
              SupervisingPartner: item['Supervising Partner'] || '',
              Opponent: item['Opponent'] || '',
              OpponentSolicitor: item['Opponent Solicitor'] || '',
              CloseDate: item['Close Date'] || '',
              ApproxValue: item['Approx. Value'] || '',
              mod_stamp: item['mod_stamp'] || '',
              method_of_contact: item['method_of_contact'] || '',
              CCL_date: item['CCL_date'] || null,
              Rating: item['Rating'] as 'Good' | 'Neutral' | 'Poor' | undefined,
            }));
          };

          let mappedMatters: Matter[] = [];
          if (Array.isArray(rawData)) {
            mappedMatters = mapData(rawData);
          } else {
            if (Array.isArray(rawData.matters)) {
              mappedMatters = mapData(rawData.matters);
            } else {
              console.warn('Unexpected data format for getAllMatters:', rawData);
            }
          }

          cachedAllMatters = mappedMatters;
          setAllMatters(mappedMatters);
          if (onAllMattersFetched) {
            onAllMattersFetched(mappedMatters);
          }
        } catch (error: any) {
          console.error('Error fetching all matters:', error);
          cachedAllMattersError = error.message;
          setAllMattersError(error.message);
          setAllMatters([]);
        } finally {
          setIsLoadingAllMatters(false);
        }
      };
      fetchAllMattersData();
    }
  }, [onAllMattersFetched]);

  // NEW: useEffect for fetching POID6Years data
  useEffect(() => {
    if (cachedPOID6Years) {
      setPoid6Years(cachedPOID6Years);
      setIsLoadingPOID6Years(false);
      // Call the callback to pass data back to App
      if (onPOID6YearsFetched) {
        onPOID6YearsFetched(cachedPOID6Years);
      }
    } else {
      const fetchPOID6Years = async () => {
        try {
          setIsLoadingPOID6Years(true);
          const response = await fetch(
            `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_POID_6YEARS_PATH}?code=${process.env.REACT_APP_GET_POID_6YEARS_CODE}`,
            { method: 'GET' }
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch POID6Years: ${response.status}`);
          }
          const data = await response.json();
          cachedPOID6Years = data;
          setPoid6Years(data);
          // Here we call the callback to pass the data back to App
          if (onPOID6YearsFetched) {
            onPOID6YearsFetched(data);
          }
        } catch (error: any) {
          console.error('Error fetching POID6Years:', error);
          setPoid6YearsError(error.message || 'Unknown error occurred.');
        } finally {
          setIsLoadingPOID6Years(false);
        }
      };
      fetchPOID6Years();
    }
  }, []);  

  useEffect(() => {
    async function fetchSpaceBookings() {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_FUTURE_BOOKINGS_PATH}?code=${process.env.REACT_APP_GET_FUTURE_BOOKINGS_CODE}`
        );
        if (!response.ok) {
          throw new Error(`Error fetching space bookings: ${response.status}`);
        }
        const data = await response.json();
        // Separate bookings by space type
        const boardroomBookings = data.boardroomBookings || [];
        const soundproofBookings = data.soundproofBookings || [];
        // Update the futureBookings state
        setFutureBookings({ boardroomBookings, soundproofBookings });
        // Optionally, call your callbacks too
        if (typeof onBoardroomBookingsFetched === "function") {
          onBoardroomBookingsFetched(boardroomBookings);
        }
        if (typeof onSoundproofBookingsFetched === "function") {
          onSoundproofBookingsFetched(soundproofBookings);
        }
      } catch (error) {
        console.error("Error fetching space bookings:", error);
      }
    }
    fetchSpaceBookings();
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      // Use cached data if available
      if (cachedTransactions) {
        console.log("Using cached transactions:", cachedTransactions);
        setTransactions(cachedTransactions); // Update local state
        if (onTransactionsFetched) {
          onTransactionsFetched(cachedTransactions);
        }
        return;
      }
      try {
        const response = await fetch(
          `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_GET_TRANSACTIONS_PATH}?code=${process.env.REACT_APP_GET_TRANSACTIONS_CODE}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        const data = await response.json();
        // Cache the data for future use
        cachedTransactions = data;
        setTransactions(data); // Update local state with fetched transactions
        if (onTransactionsFetched) {
          onTransactionsFetched(data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    }
    fetchTransactions();
  }, []); // Runs only once on component mount  
  

  useEffect(() => {
    // 1. Try loading from localStorage
    const storedData = localStorage.getItem('outstandingBalancesData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log("Loaded outstanding balances from localStorage:", parsedData);
      if (onOutstandingBalancesFetched) {
        onOutstandingBalancesFetched(parsedData);
      }
      setOutstandingBalancesData(parsedData);
    }
  
    async function fetchOutstandingBalances() {
      const code = process.env.REACT_APP_GET_OUTSTANDING_CLIENT_BALANCES_CODE;
      const path = process.env.REACT_APP_GET_OUTSTANDING_CLIENT_BALANCES_PATH;
      const baseUrl = process.env.REACT_APP_PROXY_BASE_URL;
      if (!code || !path || !baseUrl) {
        console.error("Missing env variables for outstanding client balances");
        return null;
      }
      const url = `${baseUrl}/${path}?code=${code}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error fetching outstanding client balances:", errorText);
          return null;
        }
        return await response.json();
      } catch (err) {
        console.error("Error fetching outstanding client balances:", err);
        return null;
      }
    }
  
    async function loadOutstandingBalances() {
      // Optional: Use in-memory cache if available
      if (cachedOutstandingBalances) {
        console.log("Using cached outstanding balances:", cachedOutstandingBalances);
        if (onOutstandingBalancesFetched) {
          onOutstandingBalancesFetched(cachedOutstandingBalances);
        }
        setOutstandingBalancesData(cachedOutstandingBalances);
        // Note: We do NOT return here so that we still fetch fresh data.
      }
    
      try {
        const data = await fetchOutstandingBalances();
        if (data) {
          cachedOutstandingBalances = data; // Cache in-memory for subsequent calls
          console.log("Fetched outstanding balances:", data);
          localStorage.setItem('outstandingBalancesData', JSON.stringify(data));
          if (onOutstandingBalancesFetched) {
            onOutstandingBalancesFetched(data);
          }
          setOutstandingBalancesData(data);
        }
      } catch (error) {
        console.error("Error in loadOutstandingBalances:", error);
      }
    }
    
    loadOutstandingBalances();
  }, []);  

  const columns = useMemo(() => createColumnsFunction(isDarkMode), [isDarkMode]);

// --- Updated Confirm Attendance snippet ---

// 1. Grab user’s initials from userData (Now done via rawUserInitials + storedUserInitials above)
const matchingTeamMember = attendanceTeam.find(
  (member: any) => (member.Initials || '').toLowerCase() === userInitials.toLowerCase()
);

const attendanceName = matchingTeamMember ? matchingTeamMember.First : '';

const currentUserRecord = attendanceRecords.find(
  (record: any) => (record.name || '').toLowerCase() === attendanceName.toLowerCase()
);

//////////////////////////////
// Updated Confirmation Check
//////////////////////////////
const now = new Date();
const isThursdayAfterMidday = now.getDay() === 4 && now.getHours() >= 12;
const currentWeekKey = getCurrentWeekKey();
const nextWeekKey = getNextWeekKey();

const transformedAttendanceRecords = useMemo(() => {
  if (!cachedAttendance && !attendanceRecords.length) return [];
  const rawRecords = cachedAttendance?.attendance || attendanceRecords; // Fix here
  return rawRecords
    .map((record: any) => {
      const weekKeys = record.weeks ? Object.keys(record.weeks) : [];
      return weekKeys.map((weekKey) => {
        const rawStart = weekKey.split(' - ')[0].split(', ')[1];
        const rawEnd = weekKey.split(' - ')[1].split(', ')[1];
        const isoStart = convertToISO(rawStart);
        const isoEnd = convertToISO(rawEnd);
        return {
          Attendance_ID: 0,
          Entry_ID: 0,
          First_Name: record.name || '',
          Initials: transformedTeamData.find((t) => t.First.toLowerCase() === record.name.toLowerCase())?.Initials || '',
          Level: '',
          Week_Start: isoStart,
          Week_End: isoEnd,
          ISO_Week: getISOWeek(new Date(isoStart)),
          Attendance_Days: record.weeks[weekKey].attendance || '',
          Confirmed_At: record.weeks[weekKey].confirmed ? new Date().toISOString() : null,
        };
      });
    })
    .flat();
}, [attendanceRecords, transformedTeamData]);

const handleAttendanceUpdated = (updatedRecords: AttendanceRecord[]) => {
  setAttendanceRecords((prevRecords) => {
    const newRecords = [...prevRecords];
    updatedRecords.forEach((updated) => {
      const weekKey = generateWeekKey(new Date(updated.Week_Start));
      const index = newRecords.findIndex(
        (rec: any) => rec.name === updated.First_Name && rec.weeks && rec.weeks[weekKey]
      );
      if (index !== -1) {
        // Update existing record
        newRecords[index].weeks[weekKey] = {
          attendance: updated.Attendance_Days,
          confirmed: !!updated.Confirmed_At,
        };
      } else {
        // Add new record or update with new week
        const existingPersonIndex = newRecords.findIndex(
          (rec: any) => rec.name === updated.First_Name
        );
        if (existingPersonIndex !== -1) {
          newRecords[existingPersonIndex].weeks = {
            ...newRecords[existingPersonIndex].weeks,
            [weekKey]: {
              attendance: updated.Attendance_Days,
              confirmed: !!updated.Confirmed_At,
            },
          };
        } else {
          newRecords.push({
            name: updated.First_Name,
            weeks: {
              [weekKey]: {
                attendance: updated.Attendance_Days,
                confirmed: !!updated.Confirmed_At,
              },
            },
          });
        }
      }
    });
    // Update cache correctly
    cachedAttendance = {
      attendance: newRecords,
      team: cachedAttendance?.team || attendanceTeam, // Preserve team data
    };
    return newRecords;
  });
};

// Decide which week we consider "the relevant week"
const relevantWeekKey = isThursdayAfterMidday ? nextWeekKey : currentWeekKey;

// Does the user have an object at all for that week?
const currentUserConfirmed = !!currentUserRecord?.weeks?.[relevantWeekKey];

const officeAttendanceButtonText = currentUserConfirmed
  ? 'Update Attendance'
  : 'Confirm Attendance';

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  const columnsForPeople = 3;

  const isPersonOutToday = (person: Person): boolean => {
    const todayStr = new Date().toISOString().split('T')[0];
    return annualLeaveRecords.some((leave) => {
      if (leave.status !== 'booked') return false;
      if (leave.person.trim().toLowerCase() !== person.initials.trim().toLowerCase()) return false;
      return todayStr >= leave.start_date && todayStr <= leave.end_date;
    });
  };

  const allPeople = useMemo(() => {
    if (!attendanceTeam || attendanceTeam.length === 0) return [];
  
    return attendanceTeam
      .sort((a: any, b: any) => a.First.localeCompare(b.First))
      .map((t: any) => {
        const att = attendanceRecords.find(
          (record: any) => record.name.toLowerCase() === t.First.toLowerCase()
        );
        const attending = att ? att.attendingToday : false;
  
        return {
          id: t.Initials,
          name: t.First,
          initials: t.Initials,
          presence: attending ? PersonaPresence.online : PersonaPresence.none,
          nickname: t.Nickname || t.First,
        };
      });
  }, [attendanceTeam, attendanceRecords]);

  const normalizeName = (name: string): string => {
    let normalized = name.trim().toLowerCase();
    if (normalized === "bianca odonnell") {
      normalized = "bianca o'donnell";
    }
    if (normalized === "samuel packwood") {
      normalized = "sam packwood";
    }
    return normalized;
  };
  
  const userResponsibleName =
  userData?.[0]?.["Full Name"]?.trim() === "Lukasz Zemanek" ? "Alex Cook" : userData?.[0]?.["Full Name"] || "";
  
  const userMatterIDs = useMemo(() => {
    if (!allMatters || allMatters.length === 0) return [];
    return allMatters
      .filter((matter) => 
        normalizeName(matter.ResponsibleSolicitor) === normalizeName(userResponsibleName)
      )
      .map((matter) => Number(matter.UniqueID));
  }, [allMatters, userResponsibleName]);

  const myOutstandingBalances = useMemo(() => {
    if (!outstandingBalancesData?.data || userMatterIDs.length === 0) return [];
    return outstandingBalancesData.data.filter((bal: any) =>
      bal.associated_matter_ids.some((id: number) => userMatterIDs.includes(Number(id)))
    );
  }, [outstandingBalancesData, userMatterIDs]);

  const [isOutstandingPanelOpen, setIsOutstandingPanelOpen] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(true); // Changed default to true

    // Create a derived variable mapping the raw outstanding balances data into MatterBalance[]
    const outstandingBalancesList = useMemo<OutstandingClientBalance[]>(() => {
      if (outstandingBalancesData && outstandingBalancesData.data) {
        return outstandingBalancesData.data.map((record: any) => ({
          id: record.id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          associated_matter_ids: record.associated_matter_ids,
          contact: record.contact,
          total_outstanding_balance: record.total_outstanding_balance,
          last_payment_date: record.last_payment_date,
          last_shared_date: record.last_shared_date,
          newest_issued_bill_due_date: record.newest_issued_bill_due_date,
          pending_payments_total: record.pending_payments_total,
          reminders_enabled: record.reminders_enabled,
          currency: record.currency,
          outstanding_bills: record.outstanding_bills,
        }));
      }
      return [];
    }, [outstandingBalancesData]);

// Create a filtered list for the Outstanding Balances panel.
const filteredBalancesForPanel = useMemo<OutstandingClientBalance[]>(() => {
  if (!outstandingBalancesData || !outstandingBalancesData.data) {
    return [];
  }
  const allBalances: OutstandingClientBalance[] = outstandingBalancesData.data.map((record: any) => ({
    id: record.id,
    created_at: record.created_at,
    updated_at: record.updated_at,
    associated_matter_ids: record.associated_matter_ids,
    contact: record.contact,
    total_outstanding_balance: record.total_outstanding_balance,
    last_payment_date: record.last_payment_date,
    last_shared_date: record.last_shared_date,
    newest_issued_bill_due_date: record.newest_issued_bill_due_date,
    pending_payments_total: record.pending_payments_total,
    reminders_enabled: record.reminders_enabled,
    currency: record.currency,
    outstanding_bills: record.outstanding_bills,
  }));
  if (showOnlyMine && userMatterIDs.length > 0) {
    return allBalances.filter((balance) =>
      balance.associated_matter_ids.some((id: number) => userMatterIDs.includes(id))
    );
  }
  return allBalances;
}, [outstandingBalancesData, showOnlyMine, userMatterIDs]);

    const outstandingTotal = useMemo(() => {
      if (!outstandingBalancesData || !outstandingBalancesData.data || userMatterIDs.length === 0) {
        return null; // Indicates data is not ready
      }
      const matchingBalances = outstandingBalancesData.data.filter((balanceRecord: any) =>
        balanceRecord.associated_matter_ids.some((id: any) => userMatterIDs.includes(Number(id)))
      );
      
      return matchingBalances.reduce((sum: number, record: any) => sum + (record.total_outstanding_balance || 0), 0);      
    }, [outstandingBalancesData, userMatterIDs]);

    useEffect(() => {
      if (userMatterIDs.length && outstandingBalancesData) {
        console.log("After update - User Matter IDs:", userMatterIDs);
        console.log("After update - Outstanding Balances Data:", outstandingBalancesData);
      }
    }, [userMatterIDs, outstandingBalancesData]);

  const metricsData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
  
    // Define user details only once
    const userFirstName = userData?.[0]?.First?.trim().toLowerCase() || '';
    const userLastName = userData?.[0]?.Last?.trim().toLowerCase() || '';
    const userFullName =
      userData?.[0]?.FullName?.trim().toLowerCase() || `${userFirstName} ${userLastName}`;
    const userInitials = userData?.[0]?.Initials?.trim().toLowerCase() || '';
  
    // Helper function to normalize names
    const normalizeName = (name: string): string => {
      let normalized = name.trim().toLowerCase();
      if (normalized === "bianca odonnell") {
        normalized = "bianca o'donnell";
      }
      if (normalized === "samuel packwood") {
        normalized = "sam packwood";
      }
      return normalized;
    };
  
    // Calculate matters opened count with updated name matching logic
    const mattersOpenedCount = allMatters
      ? allMatters.filter((m) => {
          const openDate = new Date(m.OpenDate);
          let solicitorName = m.OriginatingSolicitor || '';
          solicitorName = normalizeName(solicitorName);
  
          return (
            openDate.getMonth() === currentMonth &&
            openDate.getFullYear() === currentYear &&
            (
              solicitorName === userFullName || // Exact full name match
              solicitorName === `${userFirstName} ${userLastName}` || // First + Last match
              solicitorName.includes(userFirstName) || // Contains first name
              solicitorName.includes(userLastName) || // Contains last name
              solicitorName === userInitials // Match on initials
            )
          );
        }).length
      : 0;  

      if (!wipClioData) {
        return [
          { title: 'Time Today', isTimeMoney: true, money: 0, hours: 0, prevMoney: 0, prevHours: 0, showDial: true, dialTarget: 6 },
          { title: 'Av. Time This Week', isTimeMoney: true, money: 0, hours: 0, prevMoney: 0, prevHours: 0, showDial: true, dialTarget: 6 },
          { title: 'Time This Week', isTimeMoney: true, money: 0, hours: 0, prevMoney: 0, prevHours: 0, showDial: true, dialTarget: 30 },
          { title: 'Fees Recovered This Month', isMoneyOnly: true, money: 0, prevMoney: 0 },
          { title: 'Outstanding Office Balances', isMoneyOnly: true, money: null, prevMoney: 0 },
          { title: 'Enquiries Today', isTimeMoney: false, count: enquiriesToday, prevCount: prevEnquiriesToday },
          { title: 'Enquiries This Week', isTimeMoney: false, count: enquiriesWeekToDate, prevCount: prevEnquiriesWeekToDate },
          { title: 'Enquiries This Month', isTimeMoney: false, count: enquiriesMonthToDate, prevCount: prevEnquiriesMonthToDate },
          { title: 'Matters Opened', isTimeMoney: false, count: mattersOpenedCount, prevCount: 0 },
        ];
      }
      
    const currentWeekData = wipClioData.current_week?.daily_data[formattedToday];
    const lastWeekDate = new Date(today);
    lastWeekDate.setDate(today.getDate() - 7);
    const formattedLastWeekDate = lastWeekDate.toISOString().split('T')[0];
    const lastWeekData = wipClioData.last_week?.daily_data[formattedLastWeekDate];

    let totalTimeThisWeek = 0;
    if (wipClioData.current_week && wipClioData.current_week.daily_data) {
      Object.values(wipClioData.current_week.daily_data).forEach((dayData: any) => {
        totalTimeThisWeek += dayData.total_hours || 0;
      });
    }

    const getWorkWeekDays = (): Date[] => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const days: Date[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
      }
      return days;
    };
    const workWeekDays = getWorkWeekDays();
    let leaveDays = 0;
    workWeekDays.forEach((day) => {
      const dayString = day.toISOString().split('T')[0];
      if (
        annualLeaveRecords.some(
          (rec) =>
            rec.status === 'booked' &&
            rec.person.toLowerCase() === userInitials.toLowerCase() &&
            dayString >= rec.start_date &&
            dayString <= rec.end_date
        )
      ) {
        leaveDays++;
      }
    });
    const adjustedTarget = (5 - leaveDays) * 6;

    return [
      {
        title: 'Time Today',
        isTimeMoney: true,
        money: currentWeekData ? currentWeekData.total_amount : 0,
        hours: currentWeekData ? currentWeekData.total_hours : 0,
        prevMoney: lastWeekData ? lastWeekData.total_amount : 0,
        prevHours: lastWeekData ? lastWeekData.total_hours : 0,
        showDial: true,
        dialTarget: 6,
      },
      {
        title: 'Av. Time This Week',
        isTimeMoney: true,
        money: wipClioData.current_week.daily_average_amount,
        hours: wipClioData.current_week.daily_average_hours,
        prevMoney: wipClioData.last_week.daily_average_amount,
        prevHours: wipClioData.last_week.daily_average_hours,
        showDial: true,
        dialTarget: 6,
      },
      {
        title: 'Time This Week',
        isTimeMoney: true,
        money: 0,
        hours: totalTimeThisWeek,
        prevMoney: 0,
        prevHours: 0,
        showDial: true,
        dialTarget: adjustedTarget,
      },
      {
        title: 'Fees Recovered This Month',
        isMoneyOnly: true,
        money: recoveredData ? recoveredData : 0,
        prevMoney: 0,
      },
      {
        title: 'Outstanding Office Balances',
        isMoneyOnly: true,
        money: outstandingTotal,
        prevMoney: 0,
      },
      {
        title: 'Enquiries Today',
        isTimeMoney: false,
        count: enquiriesToday,
        prevCount: prevEnquiriesToday,
      },
      {
        title: 'Enquiries This Week',
        isTimeMoney: false,
        count: enquiriesWeekToDate,
        prevCount: prevEnquiriesWeekToDate,
      },
      {
        title: 'Enquiries This Month',
        isTimeMoney: false,
        count: enquiriesMonthToDate,
        prevCount: prevEnquiriesMonthToDate,
      },
      {
        title: 'Matters Opened',
        isTimeMoney: false,
        count: mattersOpenedCount,
        prevCount: 0,
      },
    ];    
  }, [
    wipClioData,
    recoveredData,
    formattedToday,
    enquiriesToday,
    prevEnquiriesToday,
    enquiriesWeekToDate,
    prevEnquiriesWeekToDate,
    enquiriesMonthToDate,
    prevEnquiriesMonthToDate,
    today,
    annualLeaveRecords,
    userData,
    allMatters,
    userInitials, // ADDED so we recalc if userInitials changes
    outstandingBalancesData, // ADDED
    userMatterIDs,           // ADDED
  ]);
  const timeMetrics = metricsData.slice(0, 5);
  const enquiryMetrics = metricsData.slice(5);

  // Combine annualLeaveRecords and futureLeaveRecords for approval filtering
  const combinedLeaveRecords = useMemo(() => {
    return [...annualLeaveRecords, ...futureLeaveRecords];
  }, [annualLeaveRecords, futureLeaveRecords]);

  const APPROVERS = ['AC', 'JW', 'LZ', 'KW'];
  // MODIFIED: using userInitials from the ref
  const isApprover = APPROVERS.includes(userInitials);

  const approvalsNeeded = useMemo(
    () =>
      isApprover
        ? combinedLeaveRecords.filter(
            (x) => x.status === 'requested' && x.approvers?.includes(userInitials)
          )
        : [],
    [combinedLeaveRecords, isApprover, userInitials]
  );

  // Merge annualLeaveRecords and futureLeaveRecords for bookings
  const bookingsNeeded = useMemo(
    () =>
      [...annualLeaveRecords, ...futureLeaveRecords].filter(
        (x) =>
          (x.status === 'approved' || x.status === 'rejected') &&
          x.person.toLowerCase() === userInitials.toLowerCase()
      ),
    [annualLeaveRecords, futureLeaveRecords, userInitials]
  );

  useEffect(() => {
    console.log('Approvals Needed:', approvalsNeeded);
  }, [approvalsNeeded]);

  // Quick action button styles
  const approveButtonStyles = {
    root: {
      backgroundColor: '#FFD700 !important', // Yellow background
      border: 'none !important',
      height: '40px !important',
      fontWeight: '600',
      borderRadius: '4px !important',
      padding: '6px 12px !important',
      animation: `yellowPulse 2s infinite !important`, // Use yellowPulse animation
      transition: 'box-shadow 0.3s, transform 0.3s, background 0.3s ease !important',
      whiteSpace: 'nowrap',
      width: 'auto',
      color: '#ffffff !important',
    },
  };

  const bookButtonStyles = {
    root: {
      backgroundColor: '#28a745 !important', // Green background
      border: 'none !important',
      height: '40px !important',
      fontWeight: '600',
      borderRadius: '4px !important',
      padding: '6px 12px !important',
      animation: `greenPulse 2s infinite !important`, // Use greenPulse animation
      transition: 'box-shadow 0.3s, transform 0.3s, background 0.3s ease !important',
      whiteSpace: 'nowrap',
      width: 'auto',
      color: '#ffffff !important',
    },
  };

  // Leave action handlers
  const handleApproveLeaveClick = () => {
    if (approvalsNeeded.length > 0) {
      setBespokePanelContent(
        <AnnualLeaveApprovals
          approvals={approvalsNeeded.map((item) => ({
            id: item.id,
            person: item.person,
            start_date: item.start_date,
            end_date: item.end_date,
            reason: item.reason,
            status: item.status,
            hearing_confirmation: item.hearing_confirmation,
            hearing_details: item.hearing_details,
          }))}
          futureLeave={futureLeaveRecords.map((item) => ({
            id: item.id,
            person: item.person,
            start_date: item.start_date,
            end_date: item.end_date,
            reason: item.reason,
            status: item.status,
            hearing_confirmation: item.hearing_confirmation,
            hearing_details: item.hearing_details,
          }))}
          onClose={() => setIsBespokePanelOpen(false)}
          team={(teamData ?? []) as any}
          totals={annualLeaveTotals}
          allLeaveEntries={annualLeaveAllData}
          onApprovalUpdate={handleApprovalUpdate}  // Pass the callback here
        />
      );
      setBespokePanelTitle('Approve Annual Leave');
      setIsBespokePanelOpen(true);
    }
  };

  const handleBookLeaveClick = () => {
    if (bookingsNeeded.length > 0) {
      setBespokePanelContent(
        <AnnualLeaveBookings
          bookings={bookingsNeeded.map((item) => ({
            id: item.id,
            person: item.person,
            start_date: item.start_date,
            end_date: item.end_date,
            status: item.status,
            rejection_notes: item.rejection_notes,
          }))}
          onClose={() => setIsBespokePanelOpen(false)}
          team={transformedTeamData}
        />
      );
      setBespokePanelTitle('Book Requested Leave');
      setIsBespokePanelOpen(true);
    }
  };

  const immediateALActions = useMemo(() => {
    const actions: { title: string; onClick: () => void; icon?: string; styles?: any }[] = [];
    if (isApprover && approvalsNeeded.length > 0) {
      actions.push({
        title: 'Approve Annual Leave',
        onClick: handleApproveLeaveClick,
        icon: 'Warning',
        styles: approveButtonStyles,
      });
    }
    if (bookingsNeeded.length > 0) {
      actions.push({
        title: 'Book Requested Leave',
        onClick: handleBookLeaveClick,
        icon: 'Accept',
        styles: bookButtonStyles,
      });
    }
    return actions;
  }, [isApprover, approvalsNeeded, bookingsNeeded, approveButtonStyles, bookButtonStyles]);

  // Build immediate actions list
  let immediateActionsList: { title: string; onClick: () => void; icon?: string }[] = [];
  if (!isLoadingAttendance && !currentUserConfirmed) {
    immediateActionsList.push({
      title: 'Confirm Attendance',
      icon: 'Cancel',
      onClick: () => handleActionClick({ title: 'Confirm Attendance', icon: 'Accept' }),
    });
  }
  if (instructionData.length > 0) {
    immediateActionsList.push({
      title: 'Review Instructions',
      icon: 'OpenFile',
      onClick: () => handleActionClick({ title: 'Review Instructions', icon: 'OpenFile' }),
    });
  }
  immediateActionsList = immediateActionsList.concat(immediateALActions);
  // Sort immediate actions by the predefined order.
  immediateActionsList.sort(
    (a, b) => (quickActionOrder[a.title] || 99) - (quickActionOrder[b.title] || 99)
  );

  function handleActionClick(action: { title: string; icon: string }) {
    let content: React.ReactNode = <div>No form available.</div>;
    const titleText = action.title;
  
    switch (titleText) {
      case "Confirm Attendance":
      case "Update Attendance":
        if (attendanceRef.current) {
          const now = new Date();
          const isThursdayAfterMidday = now.getDay() === 4 && now.getHours() >= 12;
          // Set the week based on whether it's Thursday after midday
          attendanceRef.current.setWeek(isThursdayAfterMidday ? 'next' : 'current');
          attendanceRef.current.focusTable();
        }
        return; // Exit early, no panel needed
      case 'Create a Task':
        content = <Tasking />;
        break;
      case 'Request CollabSpace':
        content = <CognitoForm dataKey="QzaAr_2Q7kesClKq8g229g" dataForm="44" />;
        break;
      case 'Save Telephone Note':
        content = <TelephoneAttendance />;
        break;
      case 'Save Attendance Note':
        content = <CognitoForm dataKey="QzaAr_2Q7kesClKq8g229g" dataForm="38" />;
        break;
      case 'Request ID':
        content = <CognitoForm dataKey="QzaAr_2Q7kesClKq8g229g" dataForm="60" />;
        break;
      case 'Open a Matter':
        content = <CognitoForm dataKey="QzaAr_2Q7kesClKq8g229g" dataForm="9" />;
        break;
      case 'Request Annual Leave':
        content = (
          <AnnualLeaveForm
            futureLeave={futureLeaveRecords}
            team={transformedTeamData}
            userData={userData}
            totals={annualLeaveTotals}
            bankHolidays={bankHolidays}
            allLeaveRecords={annualLeaveAllData} // Added this prop
          />
        );
        break;
      case 'Review Instructions':
        content = (
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '20px' }}>
            {JSON.stringify(instructionData, null, 2)}
          </pre>
        );
          break;
      case 'Book Space':
        content = (
          <BookSpaceForm
            feeEarner={userData[0].Initials}
            onCancel={() => setIsBespokePanelOpen(false)}
            futureBookings={futureBookings}
          />
        );
        break;
      default:
        content = <div>No form available.</div>;
        break;
    }
  
    setBespokePanelContent(content);
    setBespokePanelTitle(titleText);
    setIsBespokePanelOpen(true);
  }

  let normalQuickActions = quickActions
  .filter((action) => {
    if (action.title === 'Confirm Attendance') {
      return currentUserConfirmed;
    }
    // Always show "Request Annual Leave"
    if (action.title === 'Request Annual Leave') {
      return true;
    }
    return true;
  })
  .map((action) => {
    if (action.title === 'Confirm Attendance') {
      return { ...action, title: 'Update Attendance' };
    }
    return action;
  });
  // Sort normal actions by order.
  normalQuickActions.sort(
    (a, b) => (quickActionOrder[a.title] || 99) - (quickActionOrder[b.title] || 99)
  );

  // Returns a narrow weekday (e.g. "M" for Monday, "T" for Tuesday)
  const getShortDayLabel = (date: Date): string =>
    date.toLocaleDateString('en-GB', { weekday: 'narrow' });

  // Optionally, if you want to include the date as well (e.g. "M 10")
  const getShortDayAndDateLabel = (date: Date): string => {
    const shortDay = getShortDayLabel(date);
    const dayOfMonth = date.getDate();
    return `${shortDay} ${dayOfMonth}`;
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const currentWeekMonday = getMondayOfCurrentWeek();
  const todayStr = new Date().toISOString().split('T')[0];

  // Example usage in attendancePersons:
  const attendancePersons = useMemo(() => {
    return transformedTeamData
      .map((member) => {
        const record = attendanceRecords.find(
          (rec: any) => rec.name.toLowerCase() === member.First.toLowerCase()
        );
        return {
          name: member.First,
          initials: member.Initials,
          nickname: member.Nickname,
          attendance:
            record && record.weeks && record.weeks[currentWeekKey]
              ? record.weeks[currentWeekKey].attendance
              : '',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [transformedTeamData, attendanceRecords, currentWeekKey]);

  const getCellStatus = (
    personAttendance: string,
    personInitials: string,
    day: string,
    cellDateStr: string
  ): 'in' | 'wfh' | 'out' => {
    if (
      combinedLeaveRecords.some(
        (leave) =>
          leave.status === 'booked' &&
          leave.person.trim().toLowerCase() === personInitials.trim().toLowerCase() &&
          cellDateStr >= leave.start_date &&
          cellDateStr <= leave.end_date
      )
    ) {
      return 'out';
    }
    const attendedDays = personAttendance ? personAttendance.split(',').map((s: string) => s.trim()) : [];
    if (attendedDays.includes(day)) {
      return 'in';
    }
    return 'wfh';
  };

  const AttendanceCell: React.FC<{ status: 'in' | 'wfh' | 'out'; highlight?: boolean }> = ({
    status,
    highlight = false,
  }) => {
    let iconName = 'Home';
    if (status === 'in') {
      iconName = 'Accept';
    } else if (status === 'out') {
      iconName = 'Airplane';
    }
    // Use the grey colour from the colours file; if not highlighted, use colours.dark.grey (or colours.light.grey)
    const iconColor = highlight ? '#fff' : (isDarkMode ? colours.dark.grey : colours.light.grey);
    return (
      <Icon
        iconName={iconName}
        styles={{ root: { fontSize: '20px', color: iconColor } }}
      />
    );
  };

  const AttendancePersonaHeader: React.FC<{ person: { name: string; initials: string; nickname: string; attendance: string } }> = ({ person }) => {
    // Determine today's weekday (default to Monday if out of range)
    const todayDate = new Date();
    const diffDays = Math.floor((todayDate.getTime() - currentWeekMonday.getTime()) / (1000 * 3600 * 24));
    const todayWeekday = diffDays >= 0 && diffDays < weekDays.length ? weekDays[diffDays] : 'Monday';
  
    // Determine status
    const currentStatus = getCellStatus(person.attendance, person.initials, todayWeekday, todayStr);
  
    // Define gradient based on status
    let gradient = '';
    if (currentStatus === 'in') {
      gradient = `linear-gradient(135deg, ${colours.blue}, ${colours.darkBlue})`;
    } else if (currentStatus === 'wfh') {
      gradient = `linear-gradient(135deg, ${colours.highlight}, ${colours.darkBlue})`;
    } else {
      // For away/out
      gradient = `linear-gradient(135deg, ${colours.grey}, ${colours.darkBlue})`;
    }
  
    // Custom avatar styles with smaller font size
    const avatarStyle: React.CSSProperties = {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: 600,
      fontSize: '12px',
    };
  
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={avatarStyle}>
          {person.initials.toUpperCase()}
        </div>
      </div>
    );
  };  

// Define the fadeIn keyframes
const fadeInKeyframes = keyframes({
  from: { opacity: 0, transform: 'translateY(5px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

// Define a style that uses the keyframes
const noActionsClass = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  animation: `${fadeInKeyframes} 0.3s ease-out`,
});

// Extract mattersOpenedCount and compute conversion rate with two decimals
const mattersOpenedCount = enquiryMetrics[3]?.count ?? 0;
const conversionRate = enquiriesMonthToDate
  ? Number(((mattersOpenedCount / enquiriesMonthToDate) * 100).toFixed(2))
  : 0;
  
  const inHighlight = 'rgba(16,124,16,0.15)'; // subtle green tint
  const wfhHighlight = 'rgba(54,144,206,0.15)'; // subtle blue tint
  const outHighlight = 'rgba(214,85,65,0.15)'; // subtle red tint

  return (
    <Stack tokens={dashboardTokens} className={containerStyle(isDarkMode)}>
      {/* Header: Greeting only */}
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="start"
        className={headerStyle}
      >
        <Stack verticalAlign="start" tokens={{ childrenGap: 8 }}>
          <Text className={greetingStyle(isDarkMode)}>{typedGreeting}</Text>
          {!isActionsLoading && (approvalsNeeded.length > 0 || bookingsNeeded.length > 0) && (
            <Text className={`${reviewMessageStyle(isDarkMode)} ${fadeInAnimationStyle}`}>
              You have items to review
              <Icon
                iconName="ChevronDown"
                aria-hidden="true"
                styles={{
                  root: {
                    marginLeft: '8px',
                    color: isDarkMode ? colours.cta : colours.cta,
                  },
                }}
              />
            </Text>
          )}
        </Stack>
      </Stack>

      {/* Quick Actions Bar */}
      <div
        className={quickLinksStyle(isDarkMode)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          // Removed: transform: 'scale(1.2)', transformOrigin: 'top left',
        }}
      >
        {/* LEFT SLOT: Immediate Actions (spinner, or "No immediate actions", or the list) */}
        <div style={{ display: 'flex', gap: '10px', minHeight: '40px' }}>
          {!immediateActionsReady ? (
            // Just a spinner (no label) while loading
            <Spinner size={SpinnerSize.small} />
          ) : immediateActionsList.length === 0 ? (
            // If there are no immediate actions: fadeIn + green check
            <div className={noActionsClass}>
              <Icon
                iconName="CompletedSolid"
                styles={{ root: { fontSize: '16px', color: colours.green } }}
              />
              <Text>No immediate actions</Text>
            </div>
          ) : (
            // Otherwise, render the immediate actions
            immediateActionsList.map((action, index) => (
              <QuickActionsCard
                key={action.title}
                title={action.title}
                icon={action.icon || ''}
                isDarkMode={isDarkMode}
                onClick={action.onClick}
                iconColor={colours.highlight}
                style={{
                  '--card-index': index,
                  fontSize: '16px',
                  padding: '0 16px',
                  minWidth: '120px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                } as React.CSSProperties}
              />
            ))
          )}
        </div>

        {/* RIGHT SLOT: Normal Quick Actions (always shown) */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {normalQuickActions.map((action, index) => (
            <QuickActionsCard
              key={action.title}
              title={action.title === 'Confirm Attendance' ? 'Update Attendance' : action.title}
              icon={action.icon}
              isDarkMode={isDarkMode}
              onClick={() => handleActionClick(action)}
              iconColor={colours.highlight}
              // Same per-button sizing:
              style={{
                '--card-index': index,
                fontSize: '16px',
                padding: '0 16px',
                minWidth: '120px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              } as React.CSSProperties}
              {...(action.title === 'Confirm Attendance' ? { confirmed: currentUserConfirmed } : {})}
            />
          ))}
        </div>
      </div>

      {/* Transactions Requiring Action */}
      <ActionSection
        transactions={transactions}
        userInitials={userInitials}
        isDarkMode={isDarkMode}
        onTransactionClick={handleTransactionClick}
        matters={allMatters || []}
        updateTransaction={updateTransaction}
        outstandingBalances={myOutstandingBalances} // pass the pre-filtered data
      />

      {/* Metrics Section Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}
      >
        {/* Time Metrics Section */}
        <CollapsibleSection title="Time Metrics" metrics={timeMetrics.map(m => ({ title: m.title }))}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
            {/* Group for the three time-related metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                flex: 1
              }}
            >
              {timeMetrics.slice(0, 3).map((metric, index) => (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  {...(metric.isMoneyOnly
                    ? { money: metric.money, prevMoney: metric.prevMoney, isMoneyOnly: metric.isMoneyOnly }
                    : metric.isTimeMoney
                    ? {
                        money: metric.money,
                        hours: metric.hours,
                        prevMoney: metric.prevMoney,
                        prevHours: metric.prevHours,
                        isTimeMoney: metric.isTimeMoney,
                        showDial: metric.showDial,
                        dialTarget: metric.dialTarget,
                      }
                    : { count: metric.count, prevCount: metric.prevCount })}
                  isDarkMode={isDarkMode}
                  animationDelay={index * 0.1}
                />
              ))}
            </div>

            {/* Vertical spacer: a subtle vertical divider */}
            <div style={{ borderLeft: '1px solid #ccc', margin: '0 10px' }} />

            {/* Group for the recovered fees and outstanding balances metrics */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
              }}
            >
              {timeMetrics.slice(3).map((metric, index) => {
                if (metric.title === 'Outstanding Office Balances') {
                  return (
                    <div
                      key={metric.title}
                      onClick={() => setIsOutstandingPanelOpen(true)}
                      style={{ cursor: 'pointer' }}
                    >
                      <MetricCard
                        title={metric.title}
                        {...(metric.isMoneyOnly
                          ? { money: metric.money, prevMoney: metric.prevMoney, isMoneyOnly: metric.isMoneyOnly }
                          : metric.isTimeMoney
                          ? {
                              money: metric.money,
                              hours: metric.hours,
                              prevMoney: metric.prevMoney,
                              prevHours: metric.prevHours,
                              isTimeMoney: metric.isTimeMoney,
                              showDial: metric.showDial,
                              dialTarget: metric.dialTarget,
                            }
                          : { count: metric.count, prevCount: metric.prevCount })}
                        isDarkMode={isDarkMode}
                        animationDelay={index * 0.1}
                      />
                    </div>
                  );
                }
                return (
                  <MetricCard
                    key={metric.title}
                    title={metric.title}
                    {...(metric.isMoneyOnly
                      ? { money: metric.money, prevMoney: metric.prevMoney, isMoneyOnly: metric.isMoneyOnly }
                      : metric.isTimeMoney
                      ? {
                          money: metric.money,
                          hours: metric.hours,
                          prevMoney: metric.prevMoney,
                          prevHours: metric.prevHours,
                          isTimeMoney: metric.isTimeMoney,
                          showDial: metric.showDial,
                          dialTarget: metric.dialTarget,
                        }
                      : { count: metric.count, prevCount: metric.prevCount })}
                    isDarkMode={isDarkMode}
                    animationDelay={index * 0.1}
                  />
                );
              })}
            </div>

          </div>
        </CollapsibleSection>


        {/* Conversion Metrics Section */}
        <CollapsibleSection title="Conversion Metrics" metrics={enquiryMetrics.map(m => ({ title: m.title }))}>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Group for the three enquiry-related metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                flex: 1,
              }}
            >
              {enquiryMetrics.slice(0, 3).map((metric, index) => (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  {...(metric.isMoneyOnly
                    ? { money: metric.money, prevMoney: metric.prevMoney, isMoneyOnly: metric.isMoneyOnly }
                    : metric.isTimeMoney
                    ? {
                        money: metric.money,
                        hours: metric.hours,
                        prevMoney: metric.prevMoney,
                        prevHours: metric.prevHours,
                        isTimeMoney: metric.isTimeMoney,
                      }
                    : { count: metric.count, prevCount: metric.prevCount })}
                  isDarkMode={isDarkMode}
                  animationDelay={index * 0.1}
                />
              ))}
            </div>

            {/* Vertical spacer */}
            <div style={{ borderLeft: '1px solid #ccc', margin: '0 10px' }} />

            {/* Group for the Matters Opened and Conversion Rate metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                flex: 1,
              }}
            >
              {/* Matters Opened metric without dial (basic count) */}
              <MetricCard
                key={enquiryMetrics[3].title}
                title={enquiryMetrics[3].title}
                {...(enquiryMetrics[3].isMoneyOnly
                  ? { money: enquiryMetrics[3].money, prevMoney: enquiryMetrics[3].prevMoney, isMoneyOnly: enquiryMetrics[3].isMoneyOnly }
                  : enquiryMetrics[3].isTimeMoney
                  ? {
                      money: enquiryMetrics[3].money,
                      hours: enquiryMetrics[3].hours,
                      prevMoney: enquiryMetrics[3].prevMoney,
                      prevHours: enquiryMetrics[3].prevHours,
                      isTimeMoney: enquiryMetrics[3].isTimeMoney,
                    }
                  : { count: enquiryMetrics[3].count, prevCount: enquiryMetrics[3].prevCount })}
                isDarkMode={isDarkMode}
                animationDelay={0}
                // No dial props passed so this card just shows the count
              />

              {/* Conversion Rate metric with dial (percentage, no £) */}
              <MetricCard
                key="Conversion Rate"
                title="Conversion Rate"
                {...{
                  count: conversionRate,
                  prevCount: 0,
                }}
                isDarkMode={isDarkMode}
                animationDelay={0.1}
                showDial={true}
                dialTarget={100}
                dialValue={conversionRate}
                dialSuffix="%"  // Displays the percentage symbol
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>


      {/* Favourites Section */}
      {(formsFavorites.length > 0 || resourcesFavorites.length > 0) && (
        <div
          className={mergeStyles({
            backgroundColor: isDarkMode
              ? colours.dark.sectionBackground
              : colours.light.sectionBackground,
            padding: '16px',
            borderRadius: '12px',
            boxShadow: isDarkMode
              ? `0 4px 12px ${colours.dark.border}`
              : `0 4px 12px ${colours.light.border}`,
            transition: 'background-color 0.3s, box-shadow 0.3s',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          })}
        >
          <Text
            className={mergeStyles({
              fontWeight: '700',
              fontSize: '20px',
              color: isDarkMode ? colours.dark.text : colours.light.text,
            })}
          >
            Favourites
          </Text>
          {formsFavorites.length > 0 && (
            <div>
              <div className={favouritesGridStyle}>
                {formsFavorites.map((form: FormItem, index: number) => (
                  <FormCard
                    key={`form-${form.title}`}
                    link={form}
                    isFavorite
                    onCopy={(url: string, title: string) => {
                      navigator.clipboard
                        .writeText(url)
                        .then(() => console.log(`Copied '${title}' to clipboard.`))
                        .catch((err) => console.error('Failed to copy: ', err));
                    }}
                    onSelect={() => setSelectedForm(form)}
                    onToggleFavorite={() => {
                      const updatedFavorites = formsFavorites.filter(
                        (fav) => fav.title !== form.title
                      );
                      setFormsFavorites(updatedFavorites);
                      localStorage.setItem(
                        'formsFavorites',
                        JSON.stringify(updatedFavorites)
                      );
                    }}
                    onGoTo={() => window.open(form.url, '_blank')}
                    animationDelay={index * 0.1}
                    description={form.description}
                  />
                ))}
              </div>
            </div>
          )}
          {resourcesFavorites.length > 0 && (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <Text className={subLabelStyle(isDarkMode)}>Resources</Text>
              </div>
              <div className={favouritesGridStyle}>
                {resourcesFavorites.map((resource: Resource, index: number) => (
                  <ResourceCard
                    key={`resource-${resource.title}`}
                    resource={resource}
                    isFavorite
                    onCopy={(url: string, title: string) => {
                      navigator.clipboard
                        .writeText(url)
                        .then(() => console.log(`Copied '${title}' to clipboard.`))
                        .catch((err) => console.error('Failed to copy: ', err));
                    }}
                    onToggleFavorite={() => {
                      const updatedFavorites = resourcesFavorites.filter(
                        (fav) => fav.title !== resource.title
                      );
                      setResourcesFavorites(updatedFavorites);
                      localStorage.setItem(
                        'resourcesFavorites',
                        JSON.stringify(updatedFavorites)
                      );
                    }}
                    onGoTo={() => window.open(resource.url, '_blank')}
                    onSelect={() => setSelectedResource(resource)}
                    animationDelay={index * 0.1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Attendance
        ref={attendanceRef}
        isDarkMode={isDarkMode}
        isLoadingAttendance={isLoadingAttendance}
        isLoadingAnnualLeave={isLoadingAnnualLeave}
        attendanceError={attendanceError}
        annualLeaveError={annualLeaveError}
        attendanceRecords={transformedAttendanceRecords}
        teamData={transformedTeamData}
        annualLeaveRecords={annualLeaveRecords}
        futureLeaveRecords={futureLeaveRecords}
        userData={userData}
        onAttendanceUpdated={handleAttendanceUpdated}
      />

      {/* Contexts Panel */}
      <BespokePanel
        isOpen={isContextPanelOpen}
        onClose={() => setIsContextPanelOpen(false)}
        title="Context Details"
        width="1000px"
      >
        {renderContextsPanelContent()}
      </BespokePanel>

      <BespokePanel
        isOpen={isOutstandingPanelOpen}
        onClose={() => setIsOutstandingPanelOpen(false)}
        title="Outstanding Balances Details"
        width="1000px"
      >
        {/* Toggle between "Everyone" and "Only Mine" */}
        <Toggle
          label="Show Only My Matters"
          checked={showOnlyMine}
          onChange={(ev, checked) => setShowOnlyMine(!!checked)}
          styles={{ root: { marginBottom: '10px' } }}
        />
        <OutstandingBalancesList 
          balances={filteredBalancesForPanel} 
          matters={allMatters ?? []} 
        />
      </BespokePanel>

      {/* Bespoke Panel for other actions */}
      <BespokePanel
        isOpen={isBespokePanelOpen}
        onClose={() => setIsBespokePanelOpen(false)}
        title={bespokePanelTitle}
        width="1000px"
      >
        {bespokePanelContent}
      </BespokePanel>

      {/* Transaction Approval Popup */}
      <BespokePanel
        isOpen={isTransactionPopupOpen}
        onClose={() => setIsTransactionPopupOpen(false)}
        title="Approve Transaction"
        width="1000px"
      >
        {selectedTransaction && (
          <TransactionApprovalPopup
            transaction={selectedTransaction}
            matters={allMatters || []}
            onSubmit={handleTransactionSubmit}
            onCancel={() => setIsTransactionPopupOpen(false)}
            userInitials={userInitials} // Add userInitials prop
          />
        )}
      </BespokePanel>

      {/* Selected Form Details */}
      {selectedForm && (
        <FormDetails
          isOpen={true}
          onClose={() => setSelectedForm(null)}
          link={selectedForm}
          isDarkMode={isDarkMode}
          userData={userData}
          matters={allMatters || []}
        />
      )}

      {/* Selected Resource Details */}
      {selectedResource && (
        <ResourceDetails resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}

      <div
        className={mergeStyles({
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '40px',
        })}
      >
        <Text className={versionStyle}>Version 1.1</Text>
        <IconButton
          iconProps={{ iconName: 'Info' }}
          title="Show context details"
          ariaLabel="Show context details"
          styles={{ root: { marginLeft: 8 }, icon: { fontSize: '16px' } }}
          onClick={() => setIsContextPanelOpen(true)}
        />
      </div>

    </Stack>
  );
};

export default Home;