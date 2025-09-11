
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { getProxyBaseUrl } from '../../utils/getProxyBaseUrl';
import {
  Stack,
  Text,
  Icon,
  mergeStyles,
  MessageBar,
  MessageBarType,
  Link,
  IconButton,
  PrimaryButton,
  DefaultButton,
  Modal,
  initializeIcons,
} from '@fluentui/react';
import {
  BarChart,
  Bar,
  CartesianGrid,
// invisible change
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
// Search UI
import { SearchBox } from '@fluentui/react';
import { sharedSearchBoxContainerStyle, sharedSearchBoxStyle } from '../../app/styles/FilterStyles';
import { parseISO, startOfMonth, format, isValid } from 'date-fns';
import { Enquiry, POID, UserData } from '../../app/functionality/types';
import EnquiryLineItem from './EnquiryLineItem';
import NewUnclaimedEnquiryCard from './NewUnclaimedEnquiryCard';
import ClaimedEnquiryCard from './ClaimedEnquiryCard';
import EnquiryApiDebugger from '../../components/EnquiryApiDebugger';
import GroupedEnquiryCard from './GroupedEnquiryCard';
import { GroupedEnquiry, getMixedEnquiryDisplay, isGroupedEnquiry } from './enquiryGrouping';
import PitchBuilder from './PitchBuilder';
import EnquiryCalls from './EnquiryCalls';
import EnquiryEmails from './EnquiryEmails';
import { colours } from '../../app/styles/colours';
import ToggleSwitch from '../../components/ToggleSwitch';
import { isAdminUser, hasInstructionsAccess } from '../../app/admin';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigatorActions } from '../../app/functionality/NavigatorContext';
import UnclaimedEnquiries from './UnclaimedEnquiries';
import { Pivot, PivotItem } from '@fluentui/react';
import SegmentedControl from '../../components/filter/SegmentedControl';
import { Context as TeamsContextType } from '@microsoft/teams-js';
import AreaCountCard from './AreaCountCard';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';

// Icons initialized in index.tsx

interface TeamData {
  'Created Date'?: string;
  'Created Time'?: string;
  'Full Name'?: string;
  'Last'?: string;
  'First'?: string;
  'Nickname'?: string;
  'Initials'?: string;
  'Email'?: string;
  'Entra ID'?: string;
  'Clio ID'?: string;
  'Rate'?: number;
  'Role'?: string;
  'AOW'?: string;
}

interface MonthlyCount {
  month: string;
  commercial: number;
  construction: number;
  employment: number;
  property: number;
  otherUnsure: number;
}

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number;
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
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof value !== 'number'
  ) {
    return null;
  }

  const textFill = isDarkMode ? '#fff' : '#333';

  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + 5}
      textAnchor="middle"
      fill={textFill}
      fontSize="12"
      fontFamily="Raleway, sans-serif"
    >
      {value}
    </text>
  );
};

const CustomBarShape: React.FC<any> = (props) => {
  const { x, y, width, height } = props;
  const { isDarkMode } = useTheme();
  const fillColor = isDarkMode ? colours.dark.border : '#d0d0d0';
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={2}
      fill={fillColor}
    />
  );
};

interface EnquiriesProps {
  context: TeamsContextType | null;
  enquiries: Enquiry[] | null;
  userData: UserData[] | null;
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null;
  onRefreshEnquiries?: () => Promise<void>;
}

const Enquiries: React.FC<EnquiriesProps> = ({
  context,
  enquiries,
  userData,
  poidData,
  setPoidData,
  teamData,
  onRefreshEnquiries,
}) => {

  // Use only real enquiries data
  // All normalized enquiries (union of legacy + new) retained irrespective of toggle
  const [allEnquiries, setAllEnquiries] = useState<(Enquiry & { __sourceType: 'new' | 'legacy' })[]>([]);
  // Display subset after applying dataset toggle
  const [displayEnquiries, setDisplayEnquiries] = useState<(Enquiry & { __sourceType: 'new' | 'legacy' })[]>([]);
  // Loading state to prevent flickering
  const [isLoadingAllData, setIsLoadingAllData] = useState<boolean>(false);
  // Track if we've already fetched all data to prevent duplicate calls
  const hasFetchedAllData = useRef<boolean>(false);

  // Debug logging

  // Navigation state variables  
  // (declaration moved below, only declare once)

  // Function to fetch all enquiries (unfiltered) for "All" mode
  const fetchAllEnquiries = useCallback(async () => {
    if (isLoadingAllData) {
      console.log('🔄 Already loading all data, skipping fetch');
      return;
    }
    
    console.log('🔄 Attempting to fetch all enquiries, hasFetched:', hasFetchedAllData.current);
    
    try {
      setIsLoadingAllData(true);
      hasFetchedAllData.current = true;
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      // Call the unified route to get ALL enquiries (both legacy and new sources)
      // Use the same route for both local and production - the one that works!
      const allDataUrl = '/api/enquiries-unified';
      
      console.log('🌐 Fetching ALL enquiries (unified) from:', allDataUrl);
      
      const response = await fetch(allDataUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔍 RAW RESPONSE from unified route:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        hasEnquiries: !!data.enquiries,
        enquiriesLength: data.enquiries?.length,
        dataKeys: Object.keys(data),
        sampleData: JSON.stringify(data).substring(0, 200)
      });
      
      let rawEnquiries: any[] = [];
      if (Array.isArray(data)) {
        rawEnquiries = data;
        console.log('📦 Using data as direct array');
      } else if (Array.isArray(data.enquiries)) {
        rawEnquiries = data.enquiries;
        console.log('📦 Using data.enquiries array');
      } else {
        console.warn('⚠️ Unexpected data structure:', data);
      }
      
      console.log('✅ Fetched all enquiries:', rawEnquiries.length);
      console.log('📊 All enquiries POC breakdown:', rawEnquiries.reduce((acc: any, enq) => {
        const poc = enq.Point_of_Contact || enq.poc || 'unknown';
        acc[poc] = (acc[poc] || 0) + 1;
        return acc;
      }, {}));
      
      // PRODUCTION DEBUG: Log sample of claimed enquiries
      const claimedSample = rawEnquiries
        .filter(enq => {
          const poc = (enq.Point_of_Contact || enq.poc || '').toLowerCase();
          return poc !== 'team@helix-law.com' && poc.trim() !== '';
        })
        .slice(0, 10);
      console.log('🔍 PRODUCTION DEBUG - Sample claimed enquiries:', claimedSample.map(e => ({
        ID: e.ID || e.id,
        POC: e.Point_of_Contact || e.poc,
        Area: e.Area_of_Work || e.aow,
        Date: e.Touchpoint_Date || e.datetime
      })));
      
      // Convert to normalized format
      const normalizedEnquiries = rawEnquiries.map((raw: any) => {
        const sourceType = detectSourceType(raw);
        return {
          ...raw,
          ID: raw.ID || raw.id?.toString(),
          Touchpoint_Date: raw.Touchpoint_Date || raw.datetime,
          Point_of_Contact: raw.Point_of_Contact || raw.poc,
          Area_of_Work: raw.Area_of_Work || raw.aow,
          Type_of_Work: raw.Type_of_Work || raw.tow,
          Method_of_Contact: raw.Method_of_Contact || raw.moc,
          First_Name: raw.First_Name || raw.first,
          Last_Name: raw.Last_Name || raw.last,
          Email: raw.Email || raw.email,
          Phone_Number: raw.Phone_Number || raw.phone,
          Value: raw.Value || raw.value,
          Initial_first_call_notes: raw.Initial_first_call_notes || raw.notes,
          Call_Taker: raw.Call_Taker || raw.rep,
          __sourceType: sourceType
        };
      });
      
      console.log('🔄 Setting normalized data to state:', normalizedEnquiries.length);
      console.log('🔍 Sample normalized enquiry:', normalizedEnquiries[0]);
      console.log('🔍 Normalized enquiries POC distribution:', normalizedEnquiries.reduce((acc: any, enq) => {
        const poc = enq.Point_of_Contact || 'unknown';
        acc[poc] = (acc[poc] || 0) + 1;
        return acc;
      }, {}));
      
      setAllEnquiries(normalizedEnquiries);
      setDisplayEnquiries(normalizedEnquiries);
      
      console.log('✅ State updated with normalized enquiries');
      
      return normalizedEnquiries;
    } catch (error) {
      console.error('❌ Failed to fetch all enquiries:', error);
      return [];
    } finally {
      setIsLoadingAllData(false);
    }
  }, [isLoadingAllData]);

  // ...existing code...

  const { isDarkMode } = useTheme();
  const { setContent } = useNavigatorActions();
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [twoColumn, setTwoColumn] = useState<boolean>(false);
  // Scope toggle (Mine vs All) for claimed enquiries - admin-only feature, default to Mine
  const [showMineOnly, setShowMineOnly] = useState<boolean>(true); // Default to showing only Mine for admin users
  // Removed pagination states
  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const enquiriesPerPage = 12;

  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false);
  const [currentRating, setCurrentRating] = useState<string>('');
  const [ratingEnquiryId, setRatingEnquiryId] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<string>('Pitch');
  const [showUnclaimedBoard, setShowUnclaimedBoard] = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ oldest: string; newest: string } | null>(null);
  const [isSearchActive, setSearchActive] = useState<boolean>(false);
  const [showGroupedView, setShowGroupedView] = useState<boolean>(true);
  const [showDataInspector, setShowDataInspector] = useState<boolean>(false);
  // Local dataset toggle (legacy vs new direct) analogous to Matters (only in localhost UI for now)
  const [useNewData, setUseNewData] = useState<boolean>(false);
  // Admin-only: control visibility of Deal Capture (Scope & Quote Description + Amount)
  const [showDealCapture, setShowDealCapture] = useState<boolean>(false);
  
  // Auto-refresh state
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(30 * 60); // 30 minutes in seconds
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalhost = (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  // Admin check (match Matters logic) – be robust to spaced keys and fallbacks
  const userRec: any = (userData && userData[0]) ? userData[0] : {};
  const userRole: string = (userRec.Role || userRec.role || '').toString();
  const userFullName: string = (
    userRec.FullName ||
    userRec['Full Name'] ||
    [userRec.First, userRec.Last].filter(Boolean).join(' ')
  )?.toString() || '';
  const isAdmin = isAdminUser(userData?.[0] || null);
  console.log('🔍 ADMIN STATUS DEBUG:', {
    userEmail: userData?.[0]?.Email,
    userInitials: userData?.[0]?.Initials,
    userName: userData?.[0]?.First,
    isAdmin,
    showMineOnly
  });
  const hasInstructionsAndMoreAccess = hasInstructionsAccess(userData?.[0] || null);
  // Debug storage for raw payloads when inspecting
  const [debugRaw, setDebugRaw] = useState<{ legacy?: unknown; direct?: unknown }>({});
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  // Navigation state variables  
  const [activeState, setActiveState] = useState<string>('Claimed');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>('All');

  // Detect source type heuristically (keep pure & easily testable)
  const detectSourceType = (enq: Record<string, unknown>): 'new' | 'legacy' => {
    // Heuristics for NEW dataset:
    // 1. Presence of distinctly lower-case schema keys (id + datetime)
    // 2. Presence of pipeline fields 'stage' or 'claim'
    // 3. Absence of ANY spaced legacy keys (e.g. "Display Number") combined with at least one expected lower-case key
    const hasLowerCore = 'id' in enq && 'datetime' in enq;
    const hasPipeline = 'stage' in enq || 'claim' in enq;
    if (hasLowerCore || hasPipeline) return 'new';
    const hasSpacedKey = Object.keys(enq).some(k => k.includes(' '));
    const hasAnyLowerCompact = ['aow','poc','notes','rep','email'].some(k => k in enq);
    if (!hasSpacedKey && hasAnyLowerCompact) return 'new';
    return 'legacy';
  };

  // Normalize all incoming enquiries once (unfiltered by toggle)
  useEffect(() => {
    console.log('🔄 Prop useEffect triggered:', { 
      hasEnquiries: !!enquiries, 
      enquiriesLength: enquiries?.length || 0, 
      isAdmin, 
      showMineOnly,
      currentDisplayCount: displayEnquiries.length
    });
    
    if (!enquiries) {
      setAllEnquiries([]);
      setDisplayEnquiries([]);
      return;
    }
    
    // Don't override fetched data when admin is in "All" mode
    if (isAdmin && !showMineOnly) {
      console.log('👤 Admin in All mode - keeping fetched dataset, not using prop data');
      // If we already have fetched data, don't clear it
      if (displayEnquiries.length > 0) {
        console.log('👤 Preserving existing fetched data:', displayEnquiries.length, 'enquiries');
        return;
      }
    }
    
    const normalised: (Enquiry & { __sourceType: 'new' | 'legacy'; [k: string]: unknown })[] = enquiries.map((raw: any) => {
      const sourceType = detectSourceType(raw);
      const rec: Enquiry & { __sourceType: 'new' | 'legacy'; [k: string]: unknown } = {
        ...raw,
        ID: raw.ID || raw.id?.toString(),
        Touchpoint_Date: raw.Touchpoint_Date || raw.datetime,
        Point_of_Contact: raw.Point_of_Contact || raw.poc,
        Area_of_Work: raw.Area_of_Work || raw.aow,
        Type_of_Work: raw.Type_of_Work || raw.tow,
        Method_of_Contact: raw.Method_of_Contact || raw.moc,
        First_Name: raw.First_Name || raw.first,
        Last_Name: raw.Last_Name || raw.last,
        Email: raw.Email || raw.email,
        Phone_Number: raw.Phone_Number || raw.phone,
        Value: raw.Value || raw.value,
        Initial_first_call_notes: raw.Initial_first_call_notes || raw.notes,
        Call_Taker: raw.Call_Taker || raw.rep,
        __sourceType: sourceType
      };
      return rec;
    });
    const newCount = normalised.filter(r => r.__sourceType === 'new').length;
    const legacyCount = normalised.length - newCount;
    setAllEnquiries(normalised);
  }, [enquiries, isAdmin, showMineOnly]);

  // Map for claimer quick lookup
  const claimerMap = useMemo(() => {
    const map: Record<string, any> = {};
    teamData?.forEach(td => { if (td.Email) map[td.Email.toLowerCase()] = td; });
    return map;
  }, [teamData]);

  // Single select handler (pitch builder path)

  // Apply dataset toggle to derive display list without losing the other dataset
  useEffect(() => {
    if (!allEnquiries.length) {
      setDisplayEnquiries([]);
      return;
    }
    
    // If admin is in "All" mode and we have fetched unified data, show all data
    const userEmail = userData?.[0]?.Email?.toLowerCase() || '';
    if (isAdmin && !showMineOnly && hasFetchedAllData.current && allEnquiries.length > 1000) {
      console.log('👑 Admin All mode - showing unified data:', allEnquiries.length);
      setDisplayEnquiries(allEnquiries);
      return;
    }
    
    if (isLocalhost) {
      let filtered = allEnquiries.filter(e => useNewData ? e.__sourceType === 'new' : e.__sourceType === 'legacy');
      // Fallback: if toggle selected new but zero new detected, show legacy + emit warning for debug panel
      if (useNewData && filtered.length === 0) {
        filtered = allEnquiries;
      }
      
      // Debug logging for BR
      if (userEmail.includes('br@') || userEmail.includes('brendan')) {
        console.log('🗄️ BR DEBUG - Data loading:', {
          totalAllEnquiries: allEnquiries.length,
          filteredCount: filtered.length,
          useNewData,
          isLocalhost,
          userEmail,
          samplePOCs: allEnquiries.slice(0, 10).map(e => e.Point_of_Contact || (e as any).poc)
        });
      }
      
      setDisplayEnquiries(filtered);
    } else {
      setDisplayEnquiries(allEnquiries);
    }
  }, [allEnquiries, useNewData, isLocalhost, userData, showMineOnly]);

  // Reset area filter if current filter is no longer available
  useEffect(() => {
    if (userData && userData.length > 0 && userData[0].AOW) {
      const userAOW = userData[0].AOW.split(',').map(a => a.trim());
      if (activeAreaFilter !== 'All' && !userAOW.includes(activeAreaFilter)) {
        setActiveAreaFilter('All');
      }
    }
  }, [userData, activeAreaFilter]);

  // Fetch all enquiries when user switches to "All" mode and current dataset is too small
  useEffect(() => {
    if (isLoadingAllData) return; // Prevent multiple concurrent fetches
    
    const userEmail = userData?.[0]?.Email?.toLowerCase() || '';
    const isBRUser = userEmail.includes('br@') || userEmail.includes('brendan');
    
    console.log('🔄 Toggle useEffect triggered:', { isAdmin, showMineOnly, userEmail, hasData: displayEnquiries.length });
    
    // When switching to "Mine" mode, ensure displayEnquiries has the full dataset for filtering
    // BUT don't reset fetch flag if we already have all data - this prevents infinite loops
    if (showMineOnly) {
      if (allEnquiries.length > 0) {
        console.log('🔄 Mine mode - setting displayEnquiries to allEnquiries for filtering:', allEnquiries.length);
        setDisplayEnquiries(allEnquiries);
      }
      // Don't reset hasFetchedAllData.current here - it causes infinite loops
      return;
    }
    
    // Also reset if we previously fetched only new data (29 records) and need unified data
    if (displayEnquiries.length < 100 && allEnquiries.length < 100) {
      console.log('🔄 Resetting fetch flag - previous fetch may have been incomplete');
      hasFetchedAllData.current = false;
    }
    
    // If admin toggles to "All" and we don't have comprehensive data, fetch complete dataset
    if (isAdmin && !showMineOnly && !hasFetchedAllData.current) {
      console.log('🔄 Admin switched to All mode - fetching complete dataset');
      fetchAllEnquiries();
    } else if (isBRUser && !showMineOnly && displayEnquiries.length <= 1 && !hasFetchedAllData.current) {
      console.log('🔄 BR switched to All mode but only has 1 enquiry - fetching complete dataset');
      fetchAllEnquiries();
    }
  }, [showMineOnly, userData, fetchAllEnquiries, isAdmin]); // Removed isLoadingAllData from deps

  const [currentSliderStart, setCurrentSliderStart] = useState<number>(0);
  const [currentSliderEnd, setCurrentSliderEnd] = useState<number>(0);

  // Added for infinite scroll
  const [itemsToShow, setItemsToShow] = useState<number>(20);
  const loader = useRef<HTMLDivElement | null>(null);
  const previousMainTab = useRef<string>('Claimed');

  const toggleDashboard = useCallback(() => {
    if (activeState === '') {
      setActiveState(previousMainTab.current || 'Claimed');
    } else {
      previousMainTab.current = activeState;
      setActiveState('');
    }
  }, [activeState]);

  useEffect(() => {
    const flag = sessionStorage.getItem('openUnclaimedEnquiries');
    if (flag === 'true') {
      setShowUnclaimedBoard(true);
      sessionStorage.removeItem('openUnclaimedEnquiries');
    }
  }, []);

  const toggleUnclaimedBoard = useCallback(() => {
    setShowUnclaimedBoard((prev) => !prev);
  }, []);

  useEffect(() => {
    if (displayEnquiries.length > 0) {
      const validDates = displayEnquiries
        .map((enq) => enq.Touchpoint_Date)
        .filter((d): d is string => typeof d === 'string' && isValid(parseISO(d)))
        .map((d) => parseISO(d));
      if (validDates.length > 0) {
        const oldestDate = new Date(Math.min(...validDates.map((date) => date.getTime())));
        const newestDate = new Date(Math.max(...validDates.map((date) => date.getTime())));
        setDateRange({
          oldest: format(oldestDate, 'dd MMM yyyy'),
          newest: format(newestDate, 'dd MMM yyyy'),
        });
        setCurrentSliderStart(0);
        setCurrentSliderEnd(validDates.length - 1);
      }
    } else {
      setDateRange(null);
    }
  }, [displayEnquiries]);

  const sortedEnquiries = useMemo(() => {
    return [...displayEnquiries].sort((a, b) => {
      const dateA = parseISO(a.Touchpoint_Date || '');
      const dateB = parseISO(b.Touchpoint_Date || '');
      return dateA.getTime() - dateB.getTime();
    });
  }, [displayEnquiries]);

  const unclaimedEmails = useMemo(
    () => ['team@helix-law.com'].map((e) => e.toLowerCase()),
    []
  );

  const unclaimedEnquiries = useMemo(
    () =>
      displayEnquiries.filter((e) => {
        const poc = (e.Point_of_Contact || (e as any).poc || '').toLowerCase();
        return poc === 'team@helix-law.com';
      }),
    [displayEnquiries]
  );

  const sortedValidEnquiries = useMemo(() => {
    return sortedEnquiries.filter(
      (enq) => enq.Touchpoint_Date && isValid(parseISO(enq.Touchpoint_Date))
    );
  }, [sortedEnquiries]);

  useEffect(() => {
    if (sortedValidEnquiries.length > 0) {
      setCurrentSliderEnd(sortedValidEnquiries.length - 1);
    }
  }, [sortedValidEnquiries.length]);

  const enquiriesInSliderRange = useMemo(() => {
    return sortedValidEnquiries.slice(currentSliderStart, currentSliderEnd + 1);
  }, [sortedValidEnquiries, currentSliderStart, currentSliderEnd]);

  const monthlyEnquiryCounts = useMemo(() => {
    const counts: { [month: string]: MonthlyCount } = {};
    enquiriesInSliderRange.forEach((enq) => {
      if (enq.Touchpoint_Date && enq.Area_of_Work) {
        const date = parseISO(enq.Touchpoint_Date);
        if (!isValid(date)) return;
        const monthStart = startOfMonth(date);
        const monthLabel = format(monthStart, 'MMM yyyy');
        const area = enq.Area_of_Work.toLowerCase();

        if (!counts[monthLabel]) {
          counts[monthLabel] = {
            month: monthLabel,
            commercial: 0,
            construction: 0,
            employment: 0,
            property: 0,
            otherUnsure: 0,
          };
        }

        switch (area) {
          case 'commercial':
            counts[monthLabel].commercial += 1;
            break;
          case 'construction':
            counts[monthLabel].construction += 1;
            break;
          case 'employment':
            counts[monthLabel].employment += 1;
            break;
          case 'property':
            counts[monthLabel].property += 1;
            break;
          default:
            counts[monthLabel].otherUnsure += 1;
            break;
        }
      }
    });

    const sortedMonths = Object.keys(counts).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    return sortedMonths.map((m) => counts[m]);
  }, [enquiriesInSliderRange]);

  const handleSubTabChange = useCallback((item?: PivotItem) => {
    if (item) {
      const key = item.props.itemKey as string;
      // Prevent switching to Calls or Emails if Pitch Builder is open
      if (activeSubTab === 'Pitch' && (key === 'Calls' || key === 'Emails')) {
        return;
      }
      setActiveSubTab(key);
    }
  }, [activeSubTab]);

  const handleSelectEnquiry = useCallback((enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setActiveSubTab('Pitch'); // Go directly to Pitch Builder
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedEnquiry(null);
  }, []);

  useEffect(() => {
    const resume = localStorage.getItem('resumePitchBuilder');
    if (resume) {
      localStorage.removeItem('resumePitchBuilder');
      const saved = localStorage.getItem('pitchBuilderState');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          const enquiryId = state.enquiryId;
          if (enquiryId) {
            const found = displayEnquiries.find(e => e.ID === enquiryId);
            if (found) {
              handleSelectEnquiry(found);
            }
          }
        } catch (e) {
          console.error('Failed to resume pitch builder', e);
        }
      }
    }
  }, [displayEnquiries, handleSelectEnquiry]);

  // Auto-refresh functionality
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    console.log('isRefreshing:', isRefreshing);
    console.log('onRefreshEnquiries available:', !!onRefreshEnquiries);
    
    if (isRefreshing) {
      console.log('❌ Already refreshing, skipping');
      return;
    }
    
    if (!onRefreshEnquiries) {
      console.log('❌ No onRefreshEnquiries function provided');
      alert('Refresh function not available. Please check the parent component.');
      return;
    }
    
    setIsRefreshing(true);
    console.log('✅ Starting refresh...');
    
    try {
      await onRefreshEnquiries();
      setLastRefreshTime(new Date());
      setNextRefreshIn(30 * 60); // Reset to 30 minutes
      console.log('✅ Refresh completed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh enquiries:', error);
      alert(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
      console.log('🏁 Refresh process finished');
    }
  }, [isRefreshing, onRefreshEnquiries]);

  // Auto-refresh timer (30 minutes)
  useEffect(() => {
    const startAutoRefresh = () => {
      // Clear existing intervals
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      // Set up 30-minute auto-refresh
      refreshIntervalRef.current = setInterval(() => {
        handleManualRefresh();
      }, 30 * 60 * 1000); // 30 minutes

      // Set up countdown timer (updates every minute)
      countdownIntervalRef.current = setInterval(() => {
        setNextRefreshIn(prev => {
          const newValue = prev - 60;
          return newValue <= 0 ? 30 * 60 : newValue;
        });
      }, 60 * 1000); // 1 minute
    };

    startAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [handleManualRefresh]);

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const handleRate = useCallback((id: string) => {
    setRatingEnquiryId(id);
    setCurrentRating('');
    setIsRateModalOpen(true);
  }, []);

  const closeRateModal = useCallback(() => {
    setIsRateModalOpen(false);
    setRatingEnquiryId(null);
    setCurrentRating('');
  }, []);

  const handleEditEnquiry = useCallback(async (updatedEnquiry: Enquiry) => {
    try {
      // Calculate the updates by comparing with current state
      const originalEnquiry = allEnquiries.find(e => e.ID === updatedEnquiry.ID);
      if (!originalEnquiry) return;

      const updates: Partial<Enquiry> = {};
      if (updatedEnquiry.First_Name !== originalEnquiry.First_Name) updates.First_Name = updatedEnquiry.First_Name;
      if (updatedEnquiry.Last_Name !== originalEnquiry.Last_Name) updates.Last_Name = updatedEnquiry.Last_Name;
      if (updatedEnquiry.Email !== originalEnquiry.Email) updates.Email = updatedEnquiry.Email;
      if (updatedEnquiry.Value !== originalEnquiry.Value) updates.Value = updatedEnquiry.Value;
      if (updatedEnquiry.Initial_first_call_notes !== originalEnquiry.Initial_first_call_notes) {
        updates.Initial_first_call_notes = updatedEnquiry.Initial_first_call_notes;
      }

      if (Object.keys(updates).length === 0) return;

      // Call the save function - using direct API call to avoid dependency issues
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const updateUrl = isLocalhost 
        ? '/api/enquiries-unified/update'
        : `${getProxyBaseUrl()}/${process.env.REACT_APP_UPDATE_ENQUIRY_PATH}?code=${process.env.REACT_APP_UPDATE_ENQUIRY_CODE}`;
      
      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: updatedEnquiry.ID, ...updates }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update enquiry: ${errorText}`);
      }

      // Update local state
      const updateEnquiry = (enquiry: Enquiry & { __sourceType: 'new' | 'legacy' }): Enquiry & { __sourceType: 'new' | 'legacy' } => {
        if (enquiry.ID === updatedEnquiry.ID) {
          return { ...enquiry, ...updates };
        }
        return enquiry;
      };

      setAllEnquiries(prev => prev.map(updateEnquiry));
      setDisplayEnquiries(prev => prev.map(updateEnquiry));
      
      console.log('✅ Enquiry updated successfully:', updatedEnquiry.ID, updates);
      
    } catch (error) {
      console.error('Failed to edit enquiry:', error);
      throw error; // Re-throw so the card can handle the error
    }
  }, [allEnquiries]);

  const handleAreaChange = useCallback(async (enquiryId: string, newArea: string) => {
    try {
      // Get the appropriate update endpoint
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const updateUrl = isLocalhost 
        ? '/api/enquiries-unified/update' // Local development route
        : `${getProxyBaseUrl()}/${process.env.REACT_APP_UPDATE_ENQUIRY_PATH}?code=${process.env.REACT_APP_UPDATE_ENQUIRY_CODE}`;
      
      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: enquiryId, Area_of_Work: newArea }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update enquiry area: ${errorText}`);
      }

      // Update local state
      const updateEnquiry = (enquiry: Enquiry & { __sourceType: 'new' | 'legacy' }): Enquiry & { __sourceType: 'new' | 'legacy' } => {
        if (enquiry.ID === enquiryId) {
          return { ...enquiry, Area_of_Work: newArea };
        }
        return enquiry;
      };

      setAllEnquiries(prev => prev.map(updateEnquiry));
      setDisplayEnquiries(prev => prev.map(updateEnquiry));
      
      console.log('✅ Enquiry area updated successfully:', enquiryId, 'to', newArea);
      
    } catch (error) {
      console.error('Failed to update enquiry area:', error);
      throw error;
    }
  }, []);

  const handleSaveEnquiry = useCallback(async (enquiryId: string, updates: Partial<Enquiry>) => {
    try {
      // Get the appropriate update endpoint
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const updateUrl = isLocalhost 
        ? '/api/enquiries-unified/update' // Local development route
        : `${getProxyBaseUrl()}/${process.env.REACT_APP_UPDATE_ENQUIRY_PATH}?code=${process.env.REACT_APP_UPDATE_ENQUIRY_CODE}`;
      
      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: enquiryId, ...updates }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update enquiry: ${errorText}`);
      }

      // Update the local data
      const updateEnquiry = (enquiry: Enquiry & { __sourceType: 'new' | 'legacy' }): Enquiry & { __sourceType: 'new' | 'legacy' } => {
        if (enquiry.ID === enquiryId) {
          return { ...enquiry, ...updates };
        }
        return enquiry;
      };

      setAllEnquiries(prev => prev.map(updateEnquiry));
      setDisplayEnquiries(prev => prev.map(updateEnquiry));
      
      console.log('✅ Enquiry updated successfully:', enquiryId, updates);
    } catch (error) {
      console.error('❌ Failed to update enquiry:', error);
      throw error;
    }
  }, []);

  const handleEditRating = useCallback(async (id: string, newRating: string) => {
    try {
      const response = await fetch(
        `${getProxyBaseUrl()}/${process.env.REACT_APP_UPDATE_RATING_PATH}?code=${process.env.REACT_APP_UPDATE_RATING_CODE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ID: id, Rating: newRating }),
        }
      );
      if (response.ok) {
        // No longer update localEnquiries; only update via API and refresh if needed
        setIsSuccessVisible(true);
      } else {
        const errorText = await response.text();
        console.error('Failed to update rating:', errorText);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  }, []);

  const submitRating = useCallback(async () => {
    if (ratingEnquiryId && currentRating) {
      await handleEditRating(ratingEnquiryId, currentRating);
      setIsSuccessVisible(true);
      closeRateModal();
    }
  }, [ratingEnquiryId, currentRating, handleEditRating, closeRateModal]);

  const filteredEnquiries = useMemo(() => {
    let filtered = displayEnquiries; // Use full dataset, not slider range

    const userEmail = userData && userData[0] && userData[0].Email
      ? userData[0].Email.toLowerCase()
      : '';

    // For local development, use Sam SP's data
    const useLocalData = process.env.REACT_APP_USE_LOCAL_DATA === 'true';
    const isLocalhost = window.location.hostname === 'localhost';
    
    const effectiveUserEmail = (useLocalData && isLocalhost) 
      ? 'ac@helix-law.com' 
      : userEmail;

    // Debug logging for BR
    if (userEmail.includes('br@') || userEmail.includes('brendan')) {
      console.log('🐛 BR DEBUG - Enquiries filtering:', {
        originalUserEmail: userEmail,
        effectiveUserEmail,
        isLocalhost,
        useLocalData,
        activeState,
        showMineOnly,
        totalEnquiriesBeforeFilter: displayEnquiries.length
      });
      
      // Show sample of all POCs before filtering
      const allPOCs = displayEnquiries.slice(0, 20).map(e => 
        (e.Point_of_Contact || (e as any).poc || '').toLowerCase()
      );
      console.log('📧 All POCs in dataset (first 20):', allPOCs);
      
      // Count by POC
      const pocCounts: Record<string, number> = {};
      displayEnquiries.forEach(e => {
        const poc = (e.Point_of_Contact || (e as any).poc || '').toLowerCase();
        pocCounts[poc] = (pocCounts[poc] || 0) + 1;
      });
      console.log('📊 POC counts:', pocCounts);
    }

    // Add detailed logging for data flow debugging
    console.log('🔍 Data Flow Debug:', {
      activeState,
      showMineOnly,
      isAdmin,
      allEnquiriesCount: allEnquiries.length,
      displayEnquiriesCount: displayEnquiries.length,
      enquiriesInSliderRangeCount: displayEnquiries.length,
      filteredStartCount: filtered.length
    });

    // Filter by activeState first (supports Claimed, Unclaimed, etc.)
    if (activeState === 'Claimed') {
      if (showMineOnly || !isAdmin) {
        console.log('🔍 Filtering for Mine Only - looking for:', effectiveUserEmail);
        
        // DEBUG: Show available claimed POCs first
        const claimedEnquiries = filtered.filter(enquiry => {
          const poc = (enquiry.Point_of_Contact || (enquiry as any).poc || '').toLowerCase();
          const isUnclaimed = unclaimedEmails.includes(poc);
          return !isUnclaimed && poc && poc.trim() !== '';
        });
        
        const claimedPOCs = claimedEnquiries.reduce((acc: any, enq) => {
          const poc = (enq.Point_of_Contact || (enq as any).poc || '').toLowerCase();
          acc[poc] = (acc[poc] || 0) + 1;
          return acc;
        }, {});
        
        console.log('🔍 MINE DEBUG - Available claimed POCs:', claimedPOCs);
        console.log('🔍 MINE DEBUG - Total claimed enquiries available:', claimedEnquiries.length);
        console.log('🔍 MINE DEBUG - Looking for exact match:', effectiveUserEmail);
        console.log('🔍 MINE DEBUG - User has claimed enquiries:', claimedPOCs[effectiveUserEmail] || 0);
        
        filtered = filtered.filter(enquiry => {
          const poc = (enquiry.Point_of_Contact || (enquiry as any).poc || '').toLowerCase();
          const matches = effectiveUserEmail ? poc === effectiveUserEmail : false;
          if (userEmail.includes('br@') || userEmail.includes('lz@')) {
            console.log('📧 Enquiry POC:', poc, 'matches:', matches);
          }
          return matches;
        });
      } else {
        console.log('🌍 Filtering for All Claimed enquiries (Admin Mode)');
        console.log('📊 Total enquiries before filtering:', filtered.length);
        console.log('📊 Unclaimed emails to exclude:', unclaimedEmails);
        console.log('🔍 PRODUCTION DEBUG - Current user admin status:', isAdmin);
        console.log('🔍 PRODUCTION DEBUG - Current showMineOnly setting:', showMineOnly);
        
        // Show sample of data we're working with
        if (filtered.length > 0) {
          const samples = filtered.slice(0, 3).map(e => ({
            ID: e.ID,
            POC: e.Point_of_Contact || (e as any).poc,
            CallTaker: e.Call_Taker || (e as any).rep
          }));
          console.log('📋 Sample enquiries:', samples);
        }
        
        // For admin "All" mode, we want to show enquiries that have been claimed by ANYONE
        // This means any enquiry that doesn't have the default unclaimed POC
        filtered = filtered.filter(enquiry => {
          const poc = (enquiry.Point_of_Contact || (enquiry as any).poc || '').toLowerCase();
          
          // An enquiry is "claimed" if it has a POC that's NOT in the unclaimed emails list
          // The unclaimed list contains placeholder emails like 'team@helix-law.com'
          const isUnclaimed = unclaimedEmails.includes(poc);
          const isClaimed = !isUnclaimed && poc && poc.trim() !== '';
          
          return isClaimed;
        });
        
        console.log('📊 Total claimed enquiries after filtering:', filtered.length);
        console.log('🔍 PRODUCTION DEBUG - Sample of filtered claimed enquiries:', filtered.slice(0, 5).map(e => ({
          ID: e.ID,
          POC: e.Point_of_Contact || (e as any).poc,
          Area: e.Area_of_Work,
          Date: e.Touchpoint_Date
        })));
      }
    } else if (activeState === 'Claimable') {
      filtered = filtered.filter(enquiry => {
        // Handle both old and new schema
        const poc = (enquiry.Point_of_Contact || (enquiry as any).poc || '').toLowerCase();
        return unclaimedEmails.includes(poc);
      });
    }

    // Area-based access control - only applies for unclaimed enquiries
    if (activeState === 'Claimable' && userData && userData.length > 0 && userData[0].AOW) {
      const userAOW = userData[0].AOW.split(',').map(a => a.trim().toLowerCase());

      const hasFullAccess = userAOW.some(
        area => area.includes('operations') || area.includes('tech')
      );

      if (!hasFullAccess) {
        filtered = filtered.filter(enquiry => {
          const enquiryArea = (enquiry.Area_of_Work || '').toLowerCase();
          if (!enquiryArea) return false;

          const inAllowed = userAOW.some(
            a => a === enquiryArea || a.includes(enquiryArea) || enquiryArea.includes(a)
          );
          if (!inAllowed) return false;

          if (activeAreaFilter !== 'All') {
            return enquiryArea === activeAreaFilter.toLowerCase();
          }
          return true;
        });
      } else if (activeAreaFilter !== 'All') {
        filtered = filtered.filter(enquiry => {
          const enquiryArea = (enquiry.Area_of_Work || '').toLowerCase();
          return enquiryArea === activeAreaFilter.toLowerCase();
        });
      }
    } else if (activeAreaFilter !== 'All') {
      filtered = filtered.filter(enquiry => {
        const enquiryArea = (enquiry.Area_of_Work || '').toLowerCase();
        return enquiryArea === activeAreaFilter.toLowerCase();
      });
    }

    
    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(enquiry => 
        enquiry.First_Name?.toLowerCase().includes(term) ||
        enquiry.Last_Name?.toLowerCase().includes(term) ||
        enquiry.Email?.toLowerCase().includes(term) ||
        enquiry.Company?.toLowerCase().includes(term) ||
        enquiry.Type_of_Work?.toLowerCase().includes(term) ||
        enquiry.ID?.toLowerCase().includes(term)
      );
    }
    
    // Final debug logging for BR
    if (userEmail.includes('br@') || userEmail.includes('brendan')) {
      console.log('🎯 BR DEBUG - Final filtered results:', {
        finalCount: filtered.length,
        activeState,
        showMineOnly,
        searchTerm: searchTerm.trim(),
        activeAreaFilter
      });
      if (filtered.length > 0) {
        console.log('📋 Sample enquiry POCs:', filtered.slice(0, 5).map(e => e.Point_of_Contact || (e as any).poc));
      }
    }
    
    return filtered;
  }, [
    displayEnquiries, // Use full dataset, not slider range
    userData,
    activeState,
    activeAreaFilter,
    searchTerm,
    showMineOnly,
    unclaimedEmails,
  ]);

  // Removed pagination logic
  // const indexOfLastEnquiry = currentPage * enquiriesPerPage;
  // const indexOfFirstEnquiry = indexOfLastEnquiry - enquiriesPerPage;
  // const currentEnquiries = useMemo(
  //   () => filteredEnquiries.slice(indexOfFirstEnquiry, indexOfLastEnquiry),
  //   [filteredEnquiries, indexOfFirstEnquiry, indexOfLastEnquiry]
  // );
  // const totalPages = Math.ceil(filteredEnquiries.length / enquiriesPerPage);

  // Added for infinite scroll - support both grouped and regular view
  const displayedItems = useMemo(() => {
    if (showGroupedView) {
      // Use grouped display
      const mixedItems = getMixedEnquiryDisplay([...filteredEnquiries].reverse());
      return mixedItems.slice(0, itemsToShow);
    } else {
      // Use regular display
      return [...filteredEnquiries].reverse().slice(0, itemsToShow);
    }
  }, [filteredEnquiries, itemsToShow, showGroupedView]);

  const handleLoadMore = useCallback(() => {
    setItemsToShow((prev) => Math.min(prev + 20, filteredEnquiries.length));
  }, [filteredEnquiries.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setItemsToShow((prev) => Math.min(prev + 20, filteredEnquiries.length));
        }
      },
      {
        root: null,
        rootMargin: '200px', // Increased margin to trigger earlier
        threshold: 0.1, // Trigger as soon as the loader is slightly visible
      }
    );
  
    // Delay observer setup slightly to allow state updates
    const timeoutId = setTimeout(() => {
      if (loader.current) {
        observer.observe(loader.current);
      }
    }, 100); // Small delay ensures `filteredEnquiries` is set before attaching
  
    return () => {
      clearTimeout(timeoutId);
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [filteredEnquiries, itemsToShow]);
  const handleSetActiveState = useCallback(
    (key: string) => {
      if (key !== '') {
        previousMainTab.current = key;
      }
      setActiveState(key);
      setActiveSubTab('Pitch');
      setItemsToShow(20);
      setTimeout(() => {
        setItemsToShow((prev) =>
          Math.min(prev + 40, filteredEnquiries.length)
        );
      }, 200);
    },
    [filteredEnquiries.length]
  );

  const ACTION_BAR_HEIGHT = 48;

  const backButtonStyle = mergeStyles({
    width: 32,
    height: 32,
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : '#f3f3f3',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    marginRight: 8,
  });

  function detailNavStyle(dark: boolean) {
    return mergeStyles({
      backgroundColor: dark ? colours.dark.sectionBackground : colours.light.sectionBackground,
      boxShadow: dark ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
      borderTop: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      alignItems: 'center',
      height: '48px',
      position: 'sticky',
      top: '48px',
      zIndex: 999,
    });
  }

  const ratingOptions = [
    {
      key: 'Good',
      text: 'Good',
      description:
        'Might instruct us, relevant to our work. Interesting contact and/or matter, likely to lead somewhere short or long term.',
    },
    {
      key: 'Neutral',
      text: 'Neutral',
      description:
        'Ok contact, matter or person/prospect possibly of interest but not an ideal fit. Uncertain will instruct us.',
    },
    {
      key: 'Poor',
      text: 'Poor',
      description:
        'Poor quality. Very unlikely to instruct us. Prospect or matter not a good fit. Time waster or irrelevant issue.',
    },
  ];

  const renderRatingOptions = useCallback(() => {
    return (
      <Stack tokens={{ childrenGap: 15 }}>
        {ratingOptions.map((option) => (
          <Stack key={option.key} tokens={{ childrenGap: 5 }}>
            <label htmlFor={`radio-${option.key}`} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                id={`radio-${option.key}`}
                name="rating"
                value={option.key}
                checked={currentRating === option.key}
                onChange={(e) => setCurrentRating(e.target.value)}
                style={{ marginRight: '12px', width: '18px', height: '18px' }}
              />
              <Text
                variant="mediumPlus"
                styles={{
                  root: {
                    fontWeight: 600,
                    color: colours.highlight,
                    fontFamily: 'Raleway, sans-serif',
                  },
                }}
              >
                {option.text}
              </Text>
            </label>
            <Text
              variant="small"
              styles={{
                root: {
                  marginLeft: '30px',
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontFamily: 'Raleway, sans-serif',
                },
              }}
            >
              {option.description}
            </Text>
          </Stack>
        ))}
      </Stack>
    );
  }, [currentRating, isDarkMode, ratingOptions]);

  const renderDetailView = useCallback(
    (enquiry: Enquiry) => (
      <>
        {activeSubTab === 'Pitch' && (
          <PitchBuilder enquiry={enquiry} userData={userData} showDealCapture={showDealCapture} />
        )}
        {activeSubTab === 'Calls' && <EnquiryCalls enquiry={enquiry} />}
        {activeSubTab === 'Emails' && <EnquiryEmails enquiry={enquiry} />}
      </>
    ),
    [activeSubTab, userData, showDealCapture]
  );

  const enquiriesCountPerMember = useMemo(() => {
    if (!enquiriesInSliderRange || !teamData) return [];
    const grouped: { [email: string]: number } = {};
    enquiriesInSliderRange.forEach((enq) => {
      // Handle both old and new schema
      const pocEmail = (enq.Point_of_Contact || (enq as any).poc || '').toLowerCase();
      if (pocEmail) {
        grouped[pocEmail] = (grouped[pocEmail] || 0) + 1;
      }
    });
    const counts: { initials: string; count: number }[] = [];
    teamData.forEach((member) => {
      const memberEmail = member.Email?.toLowerCase();
      const memberRole = member.Role?.toLowerCase();
      if (memberEmail && grouped[memberEmail] && memberRole !== 'non-solicitor') {
        counts.push({
          initials: member.Initials || '',
          count: grouped[memberEmail],
        });
      }
    });
    counts.sort((a, b) => b.count - a.count);
    return counts;
  }, [enquiriesInSliderRange, teamData]);

  const enquiriesCountPerArea = useMemo(() => {
    const c: { [key: string]: number } = {
      Commercial: 0,
      Property: 0,
      Construction: 0,
      Employment: 0,
      'Other/Unsure': 0,
    };
    enquiriesInSliderRange.forEach((enq) => {
      const area = enq.Area_of_Work?.toLowerCase();
      if (area === 'commercial') {
        c.Commercial += 1;
      } else if (area === 'property') {
        c.Property += 1;
      } else if (area === 'construction') {
        c.Construction += 1;
      } else if (area === 'employment') {
        c.Employment += 1;
      } else {
        c['Other/Unsure'] += 1;
      }
    });
    return c;
  }, [enquiriesInSliderRange]);

  const loggedInUserInitials = useMemo(() => {
    if (userData && userData.length > 0) {
      return userData[0].Initials || '';
    }
    return '';
  }, [userData]);

  const getMonthlyCountByArea = (monthData: MonthlyCount, area: string): number => {
    switch (area.toLowerCase()) {
      case 'commercial':
        return monthData.commercial;
      case 'property':
        return monthData.property;
      case 'construction':
        return monthData.construction;
      case 'employment':
        return monthData.employment;
      case 'other/unsure':
        return monthData.otherUnsure;
      default:
        return 0;
    }
  };

  function getAreaIcon(area: string): string {
    switch (area.toLowerCase()) {
      case 'commercial':
        return 'KnowledgeArticle';
      case 'property':
        return 'CityNext';
      case 'construction':
        return 'ConstructionCone';
      case 'employment':
        return 'People';
      case 'other/unsure':
        return 'Help';
      default:
        return 'Question';
    }
  }

  function getAreaColor(area: string): string {
    switch (area.toLowerCase()) {
      case 'commercial':
        return colours.blue;
      case 'construction':
        return colours.orange;
      case 'property':
        return colours.green;
      case 'employment':
        return colours.yellow;
      case 'other/unsure':
        return '#E53935';
      default:
        return colours.cta;
    }
  }

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
                backgroundColor: getAreaColor(entry.value),
                marginRight: 8,
              }}
            />
            <span
              style={{
                color: isDarkMode ? colours.dark.text : colours.light.text,
                fontWeight: 500,
              }}
            >
              {entry.value.charAt(0).toUpperCase() + entry.value.slice(1)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  function containerStyle(dark: boolean) {
    return mergeStyles({
      backgroundColor: dark ? colours.dark.background : colours.light.background,
      minHeight: '100vh',
      boxSizing: 'border-box',
      color: dark ? colours.light.text : colours.dark.text,
    });
  }

  // Global Navigator: list vs detail
  useEffect(() => {
    // Add CSS animation for spinning refresh icon
    if (typeof document !== 'undefined' && !document.getElementById('refreshSpinAnimation')) {
      const style = document.createElement('style');
      style.id = 'refreshSpinAnimation';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // List mode: filter/search bar in Navigator (like Matters list state)
    if (!selectedEnquiry) {
      setContent(
        <div style={{
          backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
          padding: '10px 24px 12px 24px',
          boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 14,
          fontFamily: 'Raleway, sans-serif',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
        }}>
          <SegmentedControl
            id="enquiries-status-seg"
            ariaLabel="Filter enquiries by status"
            value={activeState === 'Claimable' ? 'Unclaimed' : activeState}
            onChange={(k) => handleSetActiveState(k === 'Unclaimed' ? 'Claimable' : k)}
            options={['Claimed','Unclaimed'].map(k => ({ key: k, label: k }))}
          />
          {userData && userData[0]?.AOW && userData[0].AOW.split(',').length > 1 && (
            <SegmentedControl
              id="enquiries-area-seg"
              ariaLabel="Filter enquiries by area of work"
              value={activeAreaFilter}
              onChange={setActiveAreaFilter}
              options={[{ key: 'All', label: 'All' }, ...userData[0].AOW.split(',').map(a => a.trim()).map(a => ({ key: a, label: a }))]}
            />
          )}
          {/* Search box */}
          <div className={sharedSearchBoxContainerStyle(isDarkMode)}>
            <SearchBox
              key="enquiries-search-box"
              placeholder="Search (name, email, company, type, ID)"
              value={searchTerm}
              onChange={(_, v) => setSearchTerm(v || '')}
              onSearch={(v) => setSearchTerm(v || '')}
              onClear={() => setSearchTerm('')}
              styles={sharedSearchBoxStyle(isDarkMode)}
              aria-label="Search enquiries"
            />
          </div>
          <div style={{ flex: 1 }} />
          
          {/* Refresh indicator and manual refresh button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 8,
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            fontSize: 12,
            color: isDarkMode ? colours.dark.subText : colours.light.subText
          }}>
            <Icon 
              iconName={isRefreshing ? "Sync" : "Clock"} 
              style={{ 
                fontSize: 14, 
                color: isRefreshing ? colours.blue : (isDarkMode ? colours.dark.subText : colours.light.subText),
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }} 
            />
            <span style={{ fontSize: 11, fontWeight: 500 }}>
              {isRefreshing ? 'Refreshing...' : `Next: ${formatTimeRemaining(nextRefreshIn)}`}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh now"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 4,
                backgroundColor: isRefreshing 
                  ? (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                color: isRefreshing 
                  ? (isDarkMode ? colours.dark.subText : colours.light.subText)
                  : (isDarkMode ? colours.dark.text : colours.light.text),
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'Raleway, sans-serif',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                opacity: isRefreshing ? 0.5 : 0.8
              }}
              onMouseEnter={(e) => {
                if (!isRefreshing) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRefreshing) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                }
              }}
            >
              <Icon 
                iconName={isRefreshing ? "Sync" : "Refresh"} 
                style={{ 
                  fontSize: 12,
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }} 
              />
              <span>{isRefreshing ? 'Updating...' : 'Update Now'}</span>
            </button>
          </div>
          
          {/* Column toggle for production */}
          <ToggleSwitch 
            id="enquiries-column-toggle" 
            checked={twoColumn} 
            onChange={setTwoColumn} 
            size="sm" 
            onText="2-col" 
            offText="1-col" 
            ariaLabel="Toggle two column layout" 
          />
          
          {(isAdmin || isLocalhost) && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px 2px 6px', height: 40, borderRadius: 12,
                background: isDarkMode ? '#5a4a12' : colours.highlightYellow,
                border: isDarkMode ? '1px solid #806c1d' : '1px solid #e2c56a',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)', fontSize: 11, fontWeight: 600, color: isDarkMode ? '#ffe9a3' : '#5d4700'
              }}
              title="Admin Debugger (alex, luke, cass only)"
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? '#ffe9a3' : '#5d4700', marginRight: 4 }}>Admin Only</span>
              <IconButton
                iconProps={{ iconName: 'TestBeaker', style: { fontSize: 16 } }}
                title="Admin Debugger (alex, luke, cass only)"
                ariaLabel="Admin Debugger (alex, luke, cass only)"
                onClick={() => setShowDataInspector(v => !v)}
                styles={{ root: { borderRadius: 8, background: 'rgba(0,0,0,0.08)', height: 30, width: 30 } }}
                data-tooltip="alex, luke, cass"
              />
              <ToggleSwitch id="enquiries-new-data-toggle" checked={useNewData} onChange={setUseNewData} size="sm" onText="New" offText="Legacy" ariaLabel="Toggle dataset between legacy and new" />
              <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 8, marginRight: 6, color: isDarkMode ? '#ffe9a3' : '#5d4700' }}>Scope:</span>
              <ToggleSwitch id="enquiries-scope-toggle" checked={showMineOnly} onChange={setShowMineOnly} size="sm" onText="Mine" offText="All" ariaLabel="Toggle between showing only my claimed enquiries and all claimed enquiries" />
            </div>
          )}
        </div>
      );
    } else {
      // Detail mode: 48px navigator with Back + tabs (and optional small admin pill at right)
      setContent(
        <div className={detailNavStyle(isDarkMode)}>
          <IconButton
            iconProps={{ iconName: 'ChevronLeft' }}
            onClick={handleBackToList}
            className={backButtonStyle}
            title="Back"
            ariaLabel="Back"
          />
          <Pivot className="navigatorPivot" selectedKey={activeSubTab} onLinkClick={handleSubTabChange}>
            <PivotItem headerText="Pitch Builder" itemKey="Pitch" />
            <PivotItem
              headerText="Calls"
              itemKey="Calls"
              headerButtonProps={activeSubTab === 'Pitch' ? { 'aria-disabled': true, style: { color: '#aaa', cursor: 'not-allowed' } } : {}}
            />
            <PivotItem
              headerText="Emails"
              itemKey="Emails"
              headerButtonProps={activeSubTab === 'Pitch' ? { 'aria-disabled': true, style: { color: '#aaa', cursor: 'not-allowed' } } : {}}
            />
          </Pivot>
          <div style={{ flex: 1 }} />
          {(isAdmin || isLocalhost) && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px 2px 6px', height: 40, borderRadius: 12,
                background: isDarkMode ? '#5a4a12' : colours.highlightYellow,
                border: isDarkMode ? '1px solid #806c1d' : '1px solid #e2c56a',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)', fontSize: 11, fontWeight: 600, color: isDarkMode ? '#ffe9a3' : '#5d4700'
              }}
              title="Admin / debug controls"
            >
              <IconButton
                iconProps={{ iconName: 'TestBeaker', style: { fontSize: 16 } }}
                title="Debug"
                ariaLabel="Open data inspector"
                onClick={() => setShowDataInspector(v => !v)}
                styles={{ root: { borderRadius: 8, background: 'rgba(0,0,0,0.08)', height: 30, width: 30 } }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? '#ffe9a3' : '#5d4700' }}>Deal Capture</span>
              <ToggleSwitch
                id="deal-capture-toggle"
                checked={showDealCapture}
                onChange={setShowDealCapture}
                size="sm"
                onText="Show"
                offText="Hide"
                ariaLabel="Show or hide Deal Capture (Scope & Quote Description + Amount)"
              />
            </div>
          )}
        </div>
      );
    }
    return () => setContent(null);
  }, [
    setContent,
    isDarkMode,
    selectedEnquiry,
    activeState,
    activeAreaFilter,
    searchTerm,
    userData,
    isAdmin,
    isLocalhost,
    useNewData,
    showMineOnly,
    twoColumn,
    activeSubTab,
    showDealCapture,
    handleSubTabChange,
    handleBackToList,
    isRefreshing,
    nextRefreshIn,
    formatTimeRemaining,
    handleManualRefresh,
  ]);

  return (
    <div className={containerStyle(isDarkMode)}>

  <section className="page-section">
        <Stack
          tokens={{ childrenGap: 20 }}
          styles={{
            root: {
              backgroundColor: isDarkMode 
                ? colours.dark.sectionBackground 
                : colours.light.sectionBackground,
              // Remove extra chrome when viewing a single enquiry; PitchBuilder renders its own card
              padding: selectedEnquiry ? '0' : '16px',
              borderRadius: 0,
              boxShadow: selectedEnquiry
                ? 'none'
                : (isDarkMode
                    ? `0 4px 12px ${colours.dark.border}`
                    : `0 4px 12px ${colours.light.border}`),
              width: '100%',
              fontFamily: 'Raleway, sans-serif',
            },
          }}
        >

      {showUnclaimedBoard ? (
        <UnclaimedEnquiries
          enquiries={unclaimedEnquiries}
          onSelect={handleSelectEnquiry}
        />
      ) : null}

      <div
        key={activeState}
        className={mergeStyles({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0px', // Remove extra gap between sections
          paddingBottom: 0, // Remove extra space at the bottom
          backgroundColor: 'transparent',
          transition: 'background-color 0.3s',
        })}
      >
        {selectedEnquiry ? (
          renderDetailView(selectedEnquiry)
        ) : (
          <>
                  {filteredEnquiries.length === 0 ? (
                    <div
                      className={mergeStyles({
                        backgroundColor: 'transparent',
                        borderRadius: '12px',
                        padding: '60px 40px',
                        textAlign: 'center',
                        boxShadow: 'none',
                      })}
                    >
                      <Icon
                        iconName="Search"
                        styles={{
                          root: {
                            fontSize: '48px',
                            color: isDarkMode ? colours.dark.subText : colours.light.subText,
                            marginBottom: '20px',
                          },
                        }}
                      />
                      <Text
                        variant="xLarge"
                        styles={{
                          root: {
                            color: isDarkMode ? colours.dark.text : colours.light.text,
                            fontFamily: 'Raleway, sans-serif',
                            fontWeight: '600',
                            marginBottom: '8px',
                          },
                        }}
                      >
                        {activeState === 'Claimed' && showMineOnly
                          ? 'No claimed enquiries found'
                          : activeState === 'Claimed'
                          ? 'No claimed enquiries found'
                          : 'No enquiries found'
                        }
                      </Text>
                      <Text
                        variant="medium"
                        styles={{
                          root: {
                            color: isDarkMode ? colours.dark.subText : colours.light.subText,
                            fontFamily: 'Raleway, sans-serif',
                          },
                        }}
                      >
                        {activeState === 'Claimed' && showMineOnly
                          ? 'You have no claimed enquiries yet. Try switching to "All" to see claimed enquiries from all team members.'
                          : activeState === 'Claimed'
                          ? 'No enquiries have been claimed yet.'
                          : 'Try adjusting your search criteria or filters'
                        }
                      </Text>
                    </div>

            ) : (
              <>
                        {/* Connected List Items */}
                        <div
                          className={
                            (() => {
                              const base = mergeStyles({
                                display: twoColumn ? 'grid' : 'flex',
                                flexDirection: twoColumn ? undefined : 'column',
                                gap: '12px',
                                padding: 0,
                                margin: 0,
                                backgroundColor: 'transparent',
                                gridTemplateColumns: twoColumn ? 'repeat(2, minmax(0, 1fr))' : undefined,
                                width: '100%', // allow full width usage
                                transition: 'grid-template-columns .25s ease',
                              });
                              return twoColumn ? `${base} two-col-grid` : base;
                            })()
                          }
                          style={twoColumn ? { position: 'relative' } : undefined}
                        >
                          {twoColumn && (() => {
                            if (typeof document !== 'undefined' && !document.getElementById('enquiriesTwoColStyles')) {
                              const el = document.createElement('style');
                              el.id = 'enquiriesTwoColStyles';
                              el.textContent = '@media (max-width: 860px){.two-col-grid{display:flex!important;flex-direction:column!important;}}';
                              document.head.appendChild(el);
                            }
                            return null;
                          })()}
                          {displayedItems.map((item, idx) => {
                            const isLast = idx === displayedItems.length - 1;

                            // Extract user's areas of work (AOW) for filtering
                            let userAOW: string[] = [];
                            if (userData && userData.length > 0 && userData[0].AOW) {
                              userAOW = userData[0].AOW.split(',').map((a) => a.trim().toLowerCase());
                            }

                            // Get user email for claim functionality
                            const currentUserEmail = userData && userData[0] && userData[0].Email
                              ? userData[0].Email.toLowerCase()
                              : '';

                            if (isGroupedEnquiry(item)) {
                              // Render grouped enquiry card
                              return (
                                <GroupedEnquiryCard
                                  key={item.clientKey}
                                  groupedEnquiry={item}
                                  onSelect={handleSelectEnquiry}
                                  onRate={handleRate}
                                  onPitch={handleSelectEnquiry}
                                  teamData={teamData}
                                  isLast={isLast}
                                  userAOW={userAOW}
                                />
                              );
                            } else {
                              const pocLower = (item.Point_of_Contact || (item as any).poc || '').toLowerCase();
                              const isUnclaimed = pocLower === 'team@helix-law.com';
                              if (isUnclaimed) {
                                return (
                                  <NewUnclaimedEnquiryCard
                                    key={item.ID}
                                    enquiry={item}
                                    onSelect={() => {}} // Prevent click-through to pitch builder
                                    onRate={handleRate}
                                    onAreaChange={handleAreaChange}
                                    isLast={isLast}
                                    userEmail={currentUserEmail}
                                    onClaimSuccess={onRefreshEnquiries}
                                  />
                                );
                              }
                              const claimer = claimerMap[pocLower];
                              return (
                                <ClaimedEnquiryCard
                                  key={item.ID}
                                  enquiry={item}
                                  claimer={claimer}
                                  onSelect={handleSelectEnquiry}
                                  onRate={handleRate}
                                  onEdit={handleEditEnquiry}
                                  onAreaChange={handleAreaChange}
                                  userData={userData}
                                  isLast={isLast}
                                />
                              );
                            }
                          })}
                        </div>
                        
                        <div ref={loader} />
              </>
            )}
          </>
        )}
      </div>

      {isSuccessVisible && (
        <MessageBar
          messageBarType={MessageBarType.success}
          isMultiline={false}
          onDismiss={() => setIsSuccessVisible(false)}
          dismissButtonAriaLabel="Close"
          styles={{
            root: {
              position: 'fixed',
              bottom: 20,
              right: 20,
              maxWidth: '300px',
              zIndex: 1000,
              borderRadius: '4px',
              fontFamily: 'Raleway, sans-serif',
            },
          }}
        >
          Rating submitted successfully!
        </MessageBar>
      )}

      <Modal
        isOpen={isRateModalOpen}
        onDismiss={closeRateModal}
        isBlocking={false}
        containerClassName={mergeStyles({
          maxWidth: 600,
          padding: '30px',
          borderRadius: '12px',
          backgroundColor: isDarkMode
            ? colours.dark.sectionBackground
            : colours.light.sectionBackground,
          color: isDarkMode ? colours.dark.text : colours.light.text,
          fontFamily: 'Raleway, sans-serif',
        })}
        styles={{ main: { maxWidth: '600px', margin: 'auto' } }}
        aria-labelledby="rate-modal"
      >
        <Stack tokens={{ childrenGap: 20 }}>
          <Text
            variant="xxLarge"
            styles={{
              root: {
                fontWeight: '700',
                color: isDarkMode ? colours.dark.text : colours.light.text,
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          >
            Rate
          </Text>
          <Text
            variant="medium"
            styles={{
              root: {
                color: isDarkMode ? colours.dark.text : colours.light.text,
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          >
            Please select a rating:
          </Text>
          {renderRatingOptions()}
          <Stack horizontal tokens={{ childrenGap: 15 }} horizontalAlign="end">
            <PrimaryButton
              text="Submit"
              onClick={submitRating}
              disabled={!currentRating}
              styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}
            />
            <DefaultButton
              text="Cancel"
              onClick={closeRateModal}
              styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}
            />
          </Stack>
        </Stack>
      </Modal>
        </Stack>
      </section>

      {/* Enquiry API Debugger - Only in development */}
      {showDataInspector && (
        <EnquiryApiDebugger
          currentEnquiries={displayEnquiries}
          onClose={() => setShowDataInspector(false)}
        />
      )}
      {showDataInspector && isLocalhost && (
        <div style={{ margin:'16px 0', padding:16, background: isDarkMode ? '#1e2430' : '#f5f8fc', border:`1px solid ${isDarkMode? 'rgba(255,255,255,0.1)': '#d4e1f1'}`, borderRadius:8 }}>
          <Text variant="mediumPlus" styles={{ root:{ fontWeight:600, marginBottom:8, color: isDarkMode? colours.dark.text: colours.light.text }}}>Local Dataset Toggle Debug</Text>
          <Text variant="small" styles={{ root:{ display:'block', marginBottom:8 }}}>Showing <strong>{useNewData ? 'NEW (direct)' : 'LEGACY'}</strong> dataset. Total after normalization: {displayEnquiries.length}</Text>
          {debugError && <MessageBar messageBarType={MessageBarType.error}>{debugError}</MessageBar>}
        </div>
      )}

    </div>
  );
}

export default Enquiries;
