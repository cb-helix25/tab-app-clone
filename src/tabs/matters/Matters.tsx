import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Stack,
  Text,
  mergeStyles,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  IconButton,
  Pivot,
  PivotItem,
  Link as FluentLink,
} from '@fluentui/react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  LabelList,
} from 'recharts';
import { parseISO, startOfMonth, format, isValid } from 'date-fns';
import { Matter, UserData, TeamData, POID, Transaction } from '../../app/functionality/types';
import MatterCard from './MatterCard';
import MatterOverview from './MatterOverview';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';
import MattersCombinedMenu from './MattersCombinedMenu';
import AreaCountCard from '../enquiries/AreaCountCard';
import ScoreCard from '../enquiries/ScoreCard';
import NewMatters from './NewMatters';
import MatterTransactions from './MatterTransactions';
import Documents from './documents/Documents';



// ----------------------------------------------
// callGetMatterOverview helper function
// ----------------------------------------------
async function callGetMatterOverview(matterId: number) {
  const code = process.env.REACT_APP_GET_MATTER_OVERVIEW_CODE;
  const path = process.env.REACT_APP_GET_MATTER_OVERVIEW_PATH;
  const baseUrl = process.env.REACT_APP_PROXY_BASE_URL; // Ensure this is set in your env
  if (!code || !path || !baseUrl) {
    console.error('Missing required environment variables for getMatterOverview');
    return null;
  }
  const url = `${baseUrl}/${path}?code=${code}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matterId: matterId }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error calling getMatterOverview:', errorText);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('Error calling getMatterOverview:', err);
    return null;
  }
}

// ----------------------------------------------
// callGetComplianceData helper function (new)
// ----------------------------------------------
async function callGetComplianceData(matterId: string, clientId: string): Promise<any> {
  const code = process.env.REACT_APP_GET_COMPLIANCE_DATA_CODE;
  const path = process.env.REACT_APP_GET_COMPLIANCE_DATA_PATH;
  const baseUrl = process.env.REACT_APP_PROXY_BASE_URL; // Ensure this is set in your env
  if (!code || !path || !baseUrl) {
    console.error('Missing required environment variables for getComplianceData');
    return null;
  }
  const url = `${baseUrl}/${path}?code=${code}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matterId, clientId }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error calling getComplianceData:', errorText);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('Error calling getComplianceData:', err);
    return null;
  }
}

// ----------------------------------------------
// callGetMatterSpecificActivities helper function (new)
// ----------------------------------------------
async function callGetMatterSpecificActivities(matterId: string): Promise<any> {
  const code = process.env.REACT_APP_GET_MATTER_SPECIFIC_ACTIVITIES_CODE;
  const path = process.env.REACT_APP_GET_MATTER_SPECIFIC_ACTIVITIES_PATH;
  const baseUrl = process.env.REACT_APP_PROXY_BASE_URL; // Ensure this is set in your env
  if (!code || !path || !baseUrl) {
    console.error('Missing required environment variables for getMatterSpecificActivities');
    return null;
  }
  const url = `${baseUrl}/${path}?code=${code}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matterId }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error calling getMatterSpecificActivities:', errorText);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error('Error calling getMatterSpecificActivities:', err);
    return null;
  }
}

// ----------------------------------------------
// Helper function(s)
// ----------------------------------------------
function groupPracticeArea(practiceArea: string): "Commercial" | "Construction" | "Employment" | "Property" | "Miscellaneous" {
  const p = practiceArea.trim().toLowerCase();
  const commercialGroup = [
    'commercial',
    'director rights & dispute advice',
    'shareholder rights & dispute advice',
    'civil/commercial fraud advice',
    'partnership advice',
    'business contract dispute',
    'unpaid loan recovery',
    'contentious probate',
    'statutory demand - Drafting',
    'Statutory Demand - Advising',
    'winding up petition advice',
    'bankruptcy petition advice',
    'injunction advice',
    'intellectual property',
    'professional negligence',
    'unpaid invoice/debt dispute',
    'commercial contract - drafting',
    'company restoration',
    'small claim advice',
    'trust advice',
    'terms and conditions - drafting',
  ];
  if (commercialGroup.includes(p)) return 'Commercial';

  const constructionGroup = [
    'final account recovery',
    'retention recovery advice',
    'adjudication advice & dispute',
    'construction contract advice',
    'interim payment recovery',
    'contract dispute',
  ];
  if (constructionGroup.includes(p)) return 'Construction';

  const propertyGroup = [
    'landlord & tenant - commercial dispute',
    'landlord & tenant - residential dispute',
    'boundary and nuisance advice',
    'boundary & nuisance advice',
    'trust of land (tolata) advice',
    'service charge recovery & dispute advice',
    'breach of lease advice',
    'terminal dilapidations advice',
    'investment sale and ownership - advice',
    'trespass',
    'right of way',
  ];
  if (propertyGroup.includes(p)) return 'Property';

  const employmentGroup = [
    'employment contract - drafting',
    'employment retainer instruction',
    'settlement agreement - drafting',
    'settlement agreement - advising',
    'handbook - drafting',
    'policy - drafting',
    'redundancy - advising',
    'sick leave - advising',
    'disciplinary - advising',
    'restrictive covenant advice',
    'post termination dispute',
    'employment tribunal claim - advising',
  ];
  if (employmentGroup.includes(p)) return 'Employment';

  // Fallback to "Miscellaneous" if no match
  return 'Miscellaneous';
}



function getGroupColor(group: string): string {
  switch (group) {
    case 'Commercial':
      return '#0078d4';
    case 'Construction':
      return '#ff8c00';
    case 'Property':
      return '#107c10';
    case 'Employment':
      return '#ffb900';
    case 'Miscellaneous':
    default:
      return '#d13438';
  }
}

function getGroupIcon(group: string): string {
  switch (group) {
    case 'Commercial':
      return 'KnowledgeArticle';
    case 'Construction':
      return 'ConstructionCone';
    case 'Property':
      return 'CityNext';
    case 'Employment':
      return 'People';
    case 'Miscellaneous':
    default:
      return 'Help';
  }
}

// 1) Define two detail styles near the top (just like you do for the main page)
const outerDetailContainerStyle = (isDarkMode: boolean) =>
  mergeStyles({
    width: '100%',
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    fontFamily: 'Raleway, sans-serif',
  });

const innerDetailCardStyle = (isDarkMode: boolean) =>
  mergeStyles({
    padding: '30px',
    borderRadius: '12px',
    boxShadow: isDarkMode
      ? '0 4px 16px rgba(0,0,0,0.6)'
      : '0 4px 16px rgba(0,0,0,0.1)',
    backgroundColor: isDarkMode
      ? colours.dark.sectionBackground
      : colours.light.sectionBackground,
  });

const nameCorrections: { [fullName: string]: string } = {
  'Bianca ODonnell': "Bianca O'Donnell",
  'Samuel Packwood': 'Sam Packwood',
  'Luke Zemanek': 'Lukasz Zemanek',
};

const leftTeam: string[] = ['Candice Quarcoo', 'Luara Locateli', 'Tristan Makin'];

const containerStyle = (isDarkMode: boolean) =>
  mergeStyles({
    padding: '20px',
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    minHeight: '100vh',
    fontFamily: 'Raleway, sans-serif',
  });

const mainContentStyle = (isDarkMode: boolean) =>
  mergeStyles({
    flex: 1,
    paddingBottom: '40px',
  });

const overviewCardStyle = mergeStyles({
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  padding: '30px',
  marginBottom: '20px',
});

const chartContainerStyle = mergeStyles({
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  padding: '20px',
  marginTop: '20px',
  height: '500px',
});

const dateSliderContainerStyle = mergeStyles({
  marginBottom: '20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', fontFamily: 'Raleway, sans-serif' }}>
      {payload.map((entry: any, index: number) => (
        <div
          key={`legend-item-${index}`}
          style={{ display: 'flex', alignItems: 'center', marginRight: 20 }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: getGroupColor(entry.value),
              marginRight: 8,
            }}
          />
          <span style={{ color: getGroupColor(entry.value), fontWeight: 500 }}>
            {entry.value.charAt(0).toUpperCase() + entry.value.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
  dataKey: string;
  isDarkMode: boolean;
}
const CustomLabel: React.FC<CustomLabelProps> = ({
  x,
  y,
  width,
  height,
  value,
  dataKey,
  isDarkMode,
}) => {
  const numX = typeof x === 'number' ? x : Number(x);
  const numY = typeof y === 'number' ? y : Number(y);
  const numWidth = typeof width === 'number' ? width : Number(width);
  const numHeight = typeof height === 'number' ? height : Number(height);
  const numValue = typeof value === 'number' ? value : Number(value);
  if ([numX, numY, numWidth, numHeight, numValue].some((n) => isNaN(n))) return null;
  return (
    <text
      x={numX + numWidth / 2}
      y={numY + numHeight / 2 - 5}
      textAnchor="middle"
      fill={getGroupColor(dataKey)}
      fontSize={12}
      fontFamily="Raleway, sans-serif"
    >
      {numValue}
    </text>
  );
};

// ---------------------------------------------------
// (A) Types
// ---------------------------------------------------
interface MonthlyData {
  month: string;
  [key: string]: string | number;
}

interface MattersProps {
  matters: Matter[];
  fetchMatters: (fullName: string) => Promise<Matter[]>;
  isLoading: boolean;
  error: string | null;
  userData: any;
  teamData?: TeamData[] | null;
  outstandingBalances?: any;
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>
  transactions?: Transaction[]; // NEW: allow transactions to be passed
}

// ---------------------------------------------------
// Matters component
// ---------------------------------------------------
const Matters: React.FC<MattersProps> = ({
  matters,
  isLoading,
  error,
  userData,
  fetchMatters,
  teamData,
  outstandingBalances,
  poidData,
  setPoidData,
  transactions, // NEW: include transactions here
}) => {
  const { isDarkMode } = useTheme();

  // ---------- Filter States ----------
  const [activeGroupedArea, setActiveGroupedArea] = useState<string | null>(null);
  const [activePracticeAreas, setActivePracticeAreas] = useState<string[]>([]);
  const [activeState, setActiveState] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchActive, setSearchActive] = useState<boolean>(false);
  const [activeFeeEarner, setActiveFeeEarner] = useState<string | null>(null);
  const [feeEarnerType, setFeeEarnerType] = useState<'Originating' | 'Responsible' | null>(null);

  // Inside your Matters component
  const [showNewMatterPage, setShowNewMatterPage] = useState<boolean>(false);

  const handleNewMatter = () => {
    // Instead of logging to console, switch to the NewMatters component
    setShowNewMatterPage(true);
  };

  // (A) The base matter from SQL
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);

  const allowedUsers = ['Lukasz', 'Alex'];
  const userFirstName = userData && userData.length > 0 ? userData[0].First.trim() : '';

  // (B) The structured extra data from getMatterOverview
  const [matterOverview, setMatterOverview] = useState<any>(null);

  // (C) The raw JSON string (for debugging display in a MessageBar)
  const [overviewResponse, setOverviewResponse] = useState<string>('');

  // NEW: State to hold compliance data
  const [complianceData, setComplianceData] = useState<any>(null);

  // NEW: State to hold matter-specific activities data
  const [matterSpecificActivities, setMatterSpecificActivities] = useState<any>(null);

  // ---------- Infinite Scroll ----------
  const [itemsToShow, setItemsToShow] = useState<number>(20);
  const loader = useRef<HTMLDivElement | null>(null);

  // ---------- Date Slider Setup ----------
  const sortedMatters = useMemo(() => {
    return [...matters].sort((a, b) => {
      const dateA = parseISO(a.OpenDate || '');
      const dateB = parseISO(b.OpenDate || '');
      return dateA.getTime() - dateB.getTime();
    });
  }, [matters]);

  const minDate = new Date('2022-01-01');
  const mattersAfterMinDate = useMemo(() => {
    return sortedMatters.filter((m) => {
      const d = parseISO(m.OpenDate || '');
      return isValid(d) && d >= minDate;
    });
  }, [sortedMatters, minDate]);

  const validDates = useMemo(() => {
    return mattersAfterMinDate
      .map((m) => m.OpenDate)
      .filter((d): d is string => typeof d === 'string' && isValid(parseISO(d)))
      .map((d) => parseISO(d));
  }, [mattersAfterMinDate]);

  const [currentSliderStart, setCurrentSliderStart] = useState<number>(0);
  const [currentSliderEnd, setCurrentSliderEnd] = useState<number>(0);

  useEffect(() => {
    if (validDates.length > 0) {
      setCurrentSliderStart(0);
      setCurrentSliderEnd(validDates.length - 1);
    }
  }, [validDates.length]);

  const mattersInDateRange = useMemo(() => {
    return mattersAfterMinDate.slice(currentSliderStart, currentSliderEnd + 1);
  }, [mattersAfterMinDate, currentSliderStart, currentSliderEnd]);

  // ---------- Filtering (applied on top of the date range) ----------
  const filteredMatters = useMemo(() => {
    let final = mattersInDateRange;
    if (activeGroupedArea) {
      final = final.filter(
        (m) =>
          groupPracticeArea(m.PracticeArea).toLowerCase() === activeGroupedArea.toLowerCase()
      );
    }
    if (activePracticeAreas.length > 0) {
      final = final.filter((m) => activePracticeAreas.includes(m.PracticeArea));
    }
    if (activeState === 'Mine' && userData?.length) {
      const fullName = `${userData[0].First} ${userData[0].Last}`.trim();
      final = final.filter((m) => m.OriginatingSolicitor === fullName);
    }
    if (activeFeeEarner) {
      if (feeEarnerType === 'Originating') {
        final = final.filter(
          (m) => m.OriginatingSolicitor.toLowerCase() === activeFeeEarner.toLowerCase()
        );
      } else if (feeEarnerType === 'Responsible') {
        final = final.filter(
          (m) =>
            m.ResponsibleSolicitor &&
            m.ResponsibleSolicitor.toLowerCase() === activeFeeEarner.toLowerCase()
        );
      }
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      final = final.filter(
        (m) =>
          m.ClientName.toLowerCase().includes(lower) ||
          m.DisplayNumber.toLowerCase().includes(lower) ||
          m.PracticeArea.toLowerCase().includes(lower)
      );
    }
    return final;
  }, [
    mattersInDateRange,
    activeGroupedArea,
    activePracticeAreas,
    activeState,
    activeFeeEarner,
    feeEarnerType,
    searchTerm,
    userData,
  ]);

  // Display matters as most recent first
  const displayedMatters = useMemo(
    () => [...filteredMatters].reverse().slice(0, itemsToShow),
    [filteredMatters, itemsToShow]
  );

  // ---------- Infinite Scroll Effect ----------
  const handleLoadMore = useCallback(() => {
    setItemsToShow((prev) => Math.min(prev + 20, filteredMatters.length));
  }, [filteredMatters.length]);

  useEffect(() => {
    if (!loader.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore();
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(loader.current);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const showOverview =
    !activeGroupedArea && activePracticeAreas.length === 0 && !activeState && !searchTerm;

  const groupedCounts = useMemo(() => {
    const counts: { [group: string]: number } = {};
    filteredMatters.forEach((m) => {
      const group = groupPracticeArea(m.PracticeArea);
      counts[group] = (counts[group] || 0) + 1;
    });
    return counts;
  }, [filteredMatters]);

  const monthlyGroupedCounts: MonthlyData[] = useMemo(() => {
    const counts: { [month: string]: { [group: string]: number } } = {};
    filteredMatters.forEach((m) => {
      if (m.OpenDate && m.PracticeArea) {
        const date = parseISO(m.OpenDate);
        if (!isValid(date)) return;
        const monthLabel = format(startOfMonth(date), 'MMM yyyy');
        if (!counts[monthLabel]) counts[monthLabel] = {};
        const group = groupPracticeArea(m.PracticeArea);
        counts[monthLabel][group] = (counts[monthLabel][group] || 0) + 1;
      }
    });
    const sortedMonths = Object.keys(counts).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    return sortedMonths.map((month) => ({ month, ...counts[month] }));
  }, [filteredMatters]);

  const originatingArray = useMemo(() => {
    const rawEntries = Object.entries(
      filteredMatters.reduce((acc, m) => {
        if (m.OriginatingSolicitor) {
          acc[m.OriginatingSolicitor] = (acc[m.OriginatingSolicitor] || 0) + 1;
        }
        return acc;
      }, {} as { [name: string]: number })
    );
    const transformed = rawEntries.map(([rawName, count]) => {
      let fullName = rawName;
      let displayName = rawName;
      if (teamData) {
        const member = teamData.find((tm) => tm['Full Name'] === rawName);
        if (member && member['Full Name']) {
          fullName = member['Full Name'];
        }
      }
      if (nameCorrections[fullName]) {
        displayName = nameCorrections[fullName];
      } else {
        displayName = fullName;
      }
      const isLeft = leftTeam.some((n) => n.toLowerCase() === fullName.toLowerCase());
      const initials =
  displayName === 'Joshua Whitcombe'
    ? 'JWH'
    : displayName === 'Ryan Choi'
    ? 'RCH'
    : displayName
        .split(' ')
        .map((part) => part.charAt(0))
        .join('');
      return { initials, count, isLeft, fullName };
    });
    const combined = transformed.reduce((acc, curr) => {
      if (acc[curr.initials]) {
        acc[curr.initials].count += curr.count;
        acc[curr.initials].isLeft = acc[curr.initials].isLeft || curr.isLeft;
      } else {
        acc[curr.initials] = { ...curr };
      }
      return acc;
    }, {} as {
      [initials: string]: { initials: string; count: number; isLeft: boolean; fullName: string };
    });
    const combinedArray = Object.values(combined);
    const nonLeft = combinedArray.filter((item) => !item.isLeft);
    const left = combinedArray.filter((item) => item.isLeft);
    nonLeft.sort((a, b) => b.count - a.count);
    const leftOrdered = left.sort((a, b) => leftTeam.indexOf(a.fullName) - leftTeam.indexOf(b.fullName));
    const excludeInitials = ['LZ', 'KW', 'JWS', 'BL'];
    return [...nonLeft, ...leftOrdered].filter((item) => !excludeInitials.includes(item.initials));
  }, [filteredMatters, teamData]);

  // --------------------------------------
  // NEW: find outstanding data for the selected matter
  // --------------------------------------
  const matterOutstandingData = useMemo(() => {
    if (!outstandingBalances || !Array.isArray(outstandingBalances.data) || !selectedMatter) {
      return null;
    }
    const matterIdNum = Number(selectedMatter.UniqueID);
    const found = outstandingBalances.data.find(
      (entry: any) =>
        Array.isArray(entry.associated_matter_ids) &&
        entry.associated_matter_ids.includes(matterIdNum)
    );
    return found || null;
  }, [outstandingBalances, selectedMatter]);

  // ------------------------------------------------
  // Fetch getMatterOverview, getComplianceData, and getMatterSpecificActivities whenever selectedMatter changes
  // ------------------------------------------------
  useEffect(() => {
    if (!selectedMatter) {
      setMatterOverview(null);
      setOverviewResponse('');
      setComplianceData(null);
      setMatterSpecificActivities(null);
      return;
    }
    (async () => {
      const overviewResponse = await callGetMatterOverview(Number(selectedMatter.UniqueID));
      if (overviewResponse?.data) {
        setMatterOverview(overviewResponse.data);
        setOverviewResponse(JSON.stringify(overviewResponse.data, null, 2));
      }
      // Call getComplianceData using the matter's UniqueID and ClientID
      const complianceResponse = await callGetComplianceData(
        selectedMatter.UniqueID,
        selectedMatter.ClientID
      );
      setComplianceData(complianceResponse);
      // NEW: Call getMatterSpecificActivities using the matter's UniqueID
      const activitiesResponse = await callGetMatterSpecificActivities(selectedMatter.UniqueID);
      setMatterSpecificActivities(activitiesResponse);
    })();
  }, [selectedMatter]);

  // ------------------------------------------------
  // If a matter is selected, render the detail pivot
  // ------------------------------------------------
  if (selectedMatter) {
    return (
      <div className={outerDetailContainerStyle(isDarkMode)}>
        <div className={innerDetailCardStyle(isDarkMode)}>
          <IconButton
            iconProps={{ iconName: 'Back' }}
            title="Back"
            ariaLabel="Back"
            onClick={() => setSelectedMatter(null)}
            styles={{
              root: {
                backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
                color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                marginBottom: '20px', // keep any margin you need
                selectors: {
                  ':hover': {
                    backgroundColor: isDarkMode
                      ? colours.dark.background
                      : colours.light.background,
                  },
                },
              },
            }}
          />
          <Pivot
            aria-label="Matter Detail Tabs"
            styles={{
              root: { marginBottom: '20px', borderBottom: 'none' },
              link: { fontSize: '16px', fontWeight: 600 },
            }}
          >
            <PivotItem headerText="Overview" itemKey="Overview">
              <MatterOverview
                matter={selectedMatter}
                overviewData={matterOverview}
                outstandingData={matterOutstandingData}
                complianceData={complianceData}
                matterSpecificActivitiesData={matterSpecificActivities}
                onEdit={() => {}}
                transactions={transactions}
              />
            </PivotItem>

            <PivotItem headerText="Transactions" itemKey="Transactions">
              <MatterTransactions matter={selectedMatter} transactions={transactions} />
            </PivotItem>

            {allowedUsers.includes(userFirstName) ? (
              <PivotItem headerText="Documents" itemKey="Documents">
                <Documents
                  matter={selectedMatter}
                  category={groupPracticeArea(selectedMatter.PracticeArea)}
                />
              </PivotItem>
            ) : (
              <PivotItem headerText="Documents" itemKey="Documents">
                <MessageBar messageBarType={MessageBarType.error}>
                  Access Denied: You do not have permission to view Documents.
                </MessageBar>
              </PivotItem>
            )}
          </Pivot>
        </div>
      </div>
    );
  }  

  // ------------------------------------------------
  // Otherwise, render the grid (overview or matter list)
  // ------------------------------------------------
  return (
    <div className={containerStyle(isDarkMode)}>
    {showNewMatterPage ? (
      allowedUsers.includes(userFirstName) ? (
        <NewMatters poidData={poidData} setPoidData={setPoidData} teamData={teamData} />
      ) : (
        <MessageBar messageBarType={MessageBarType.error}>
          This feature is under active development. Please check back soon.
        </MessageBar>
      )
    ) : (
        <>
          <MattersCombinedMenu
            activeGroupedArea={activeGroupedArea}
            setActiveGroupedArea={setActiveGroupedArea}
            practiceAreas={Array.from(new Set(matters.map((m) => m.PracticeArea as string))).sort()}
            activePracticeAreas={activePracticeAreas}
            setActivePracticeAreas={setActivePracticeAreas}
            activeState={activeState}
            setActiveState={setActiveState}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isSearchActive={isSearchActive}
            setSearchActive={setSearchActive}
            activeFeeEarner={activeFeeEarner}
            setActiveFeeEarner={setActiveFeeEarner}
            feeEarnerType={feeEarnerType}
            setFeeEarnerType={setFeeEarnerType}
            teamData={teamData}
            onNewMatter={handleNewMatter} // Pass the new matter handler
          />
  
          {isLoading ? (
            <Spinner label="Loading matters..." size={SpinnerSize.medium} />
          ) : error ? (
            <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
          ) : (
            <>
              {showOverview ? (
                <>
                  <Stack tokens={{ childrenGap: 20 }} className={overviewCardStyle}>
                    <div className={dateSliderContainerStyle}>
                      {validDates.length > 0 && (
                        <>
                          <Text
                            variant="mediumPlus"
                            styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}
                          >
                            {format(validDates[currentSliderStart], 'dd MMM yyyy')} -{' '}
                            {format(validDates[currentSliderEnd], 'dd MMM yyyy')}
                          </Text>
                          <Slider
                            range
                            min={0}
                            max={validDates.length - 1}
                            value={[currentSliderStart, currentSliderEnd]}
                            onChange={(value) => {
                              if (Array.isArray(value)) {
                                setCurrentSliderStart(value[0]);
                                setCurrentSliderEnd(value[1]);
                              }
                            }}
                            trackStyle={[{ backgroundColor: colours.highlight, height: 8 }]}
                            handleStyle={[
                              {
                                backgroundColor: colours.highlight,
                                borderColor: colours.highlight,
                                height: 20,
                                width: 20,
                                transform: 'translateX(-50%)',
                              },
                              {
                                backgroundColor: colours.highlight,
                                borderColor: colours.highlight,
                                height: 20,
                                width: 20,
                                transform: 'translateX(-50%)',
                              },
                            ]}
                            railStyle={{
                              backgroundColor: isDarkMode
                                ? colours.dark.border
                                : colours.inactiveTrackLight,
                              height: 8,
                            }}
                            style={{ width: 500, margin: '0 auto' }}
                          />
                        </>
                      )}
                    </div>
  
                    <Stack tokens={{ childrenGap: 20 }}>
                      <Stack horizontal wrap tokens={{ childrenGap: 20 }} style={{ marginBottom: '20px' }}>
                        {['Commercial', 'Property', 'Construction', 'Employment', 'Miscellaneous'].map(
                          (group) => {
                            const count = groupedCounts[group] || 0;
                            const monthlyArr = monthlyGroupedCounts.map((mm) => ({
                              month: mm.month,
                              count: (mm[group] as number) || 0,
                            }));
                            return (
                              <AreaCountCard
                                key={group}
                                area={group}
                                count={count}
                                monthlyCounts={monthlyArr}
                                icon={getGroupIcon(group)}
                                color={getGroupColor(group)}
                                animationDelay={0.2}
                              />
                            );
                          }
                        )}
                      </Stack>
  
                      <Stack
                        horizontal
                        horizontalAlign="center"
                        wrap
                        verticalAlign="center"
                        styles={{ root: { width: '100%' } }}
                        tokens={{ childrenGap: 10 }}
                      >
                        {originatingArray.map((item, idx, arr) => (
                          <React.Fragment key={item.fullName}>
                            <Stack horizontalAlign="center" styles={{ root: { minWidth: '80px', textAlign: 'center' } }}>
                              <Text
                                variant="xLarge"
                                styles={{
                                  root: {
                                    fontWeight: 600,
                                    color: item.isLeft ? '#888888' : colours.highlight,
                                    fontFamily: 'Raleway, sans-serif',
                                  },
                                }}
                              >
                                {item.count}
                              </Text>
                              <Text
                                variant="small"
                                styles={{
                                  root: {
                                    fontWeight: 400,
                                    marginTop: '4px',
                                    color: item.isLeft
                                      ? '#888888'
                                      : isDarkMode
                                      ? colours.dark.text
                                      : colours.light.text,
                                    fontFamily: 'Raleway, sans-serif',
                                    fontStyle: item.isLeft ? 'italic' : 'normal',
                                  },
                                }}
                              >
                                {item.initials}
                              </Text>
                            </Stack>
                            {idx < arr.length - 1 && (
                              <Text
                                styles={{
                                  root: {
                                    margin: '0 10px',
                                    color: isDarkMode ? '#fff' : '#333',
                                  },
                                }}
                              >
                                |
                              </Text>
                            )}
                          </React.Fragment>
                        ))}
                      </Stack>
                    </Stack>
                  </Stack>
  
                  {monthlyGroupedCounts.length > 0 && (
                    <div className={chartContainerStyle}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyGroupedCounts}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#ccc'} />
                          <XAxis dataKey="month" stroke={isDarkMode ? '#fff' : '#333'} />
                          <YAxis stroke={isDarkMode ? '#fff' : '#333'} />
                          <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#333' : '#fff' }} />
                          <Legend content={renderCustomLegend} />
                          {['Commercial', 'Property', 'Construction', 'Employment', 'Miscellaneous'].map(
                            (group) => (
                              <Bar key={group} dataKey={group} fill={colours.grey} animationDuration={1500}>
                                <LabelList
                                  dataKey={group}
                                  position="top"
                                  content={(props) => (
                                    <CustomLabel {...props} isDarkMode={isDarkMode} dataKey={group} />
                                  )}
                                />
                              </Bar>
                            )
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <main className={mainContentStyle(isDarkMode)}>
                  {filteredMatters.length === 0 ? (
                    <Text>No matters found matching your criteria.</Text>
                  ) : (
                    <div
                      className={mergeStyles({
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px',
                        marginTop: '20px',
                      })}
                    >
                      {displayedMatters.map((matter, idx) => {
                        const row = Math.floor(idx / 4);
                        const col = idx % 4;
                        const animationDelay = row * 0.2 + col * 0.1;
                        return (
                          <MatterCard
                            key={matter.UniqueID}
                            matter={matter}
                            onSelect={() => setSelectedMatter(matter)}
                            animationDelay={animationDelay}
                          />
                        );
                      })}
                      <div ref={loader} />
                    </div>
                  )}
                </main>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
  
  };
  
  export default Matters;