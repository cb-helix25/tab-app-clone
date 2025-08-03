
import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
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
import { parseISO, startOfMonth, format, isValid } from 'date-fns';
import { Enquiry, UserData, POID } from '../../app/functionality/types';
import CustomPagination from '../../app/styles/CustomPagination';
import EnquiryLineItem from './EnquiryLineItem';
import GroupedEnquiryCard from './GroupedEnquiryCard';
import { GroupedEnquiry, getMixedEnquiryDisplay, isGroupedEnquiry } from './enquiryGrouping';
import EnquiryOverview from './EnquiryOverview';
import PitchBuilder from './PitchBuilder';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigator } from '../../app/functionality/NavigatorContext';
import UnclaimedEnquiries from './UnclaimedEnquiries';
import { Pivot, PivotItem } from '@fluentui/react';
import { Context as TeamsContextType } from '@microsoft/teams-js';
import AreaCountCard from './AreaCountCard';
import EnquiriesMenu from './EnquiriesMenu';
import NewEnquiryList from './NewEnquiryList';
import { NewEnquiry } from '../../app/functionality/newEnquiryTypes';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';

initializeIcons();

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
}

const Enquiries: React.FC<EnquiriesProps> = ({
  context,
  enquiries,
  userData,
  poidData,
  setPoidData,
  teamData,
}) => {
  const [localEnquiries, setLocalEnquiries] = useState<Enquiry[]>(enquiries || []);

  // Add sample test data for demonstration
  const sampleTestEnquiries: Enquiry[] = [
    {
      ID: 'test-001',
      Date_Created: '2024-07-25T10:30:00Z',
      Touchpoint_Date: '2024-07-25T10:30:00Z',
      Email: 'luke.phillips@example.com',
      Area_of_Work: 'Commercial',
      Type_of_Work: 'Contract Review',
      Method_of_Contact: 'Email',
      Point_of_Contact: 'team@helix-law.com',
      Company: 'Phillips Consulting Ltd',
      First_Name: 'Luke',
      Last_Name: 'Phillips',
      Phone_Number: '+44 7123 456789',
      Value: '£5,000',
      Rating: 'Good',
    },
    {
      ID: 'test-002',
      Date_Created: '2024-07-20T14:15:00Z',
      Touchpoint_Date: '2024-07-20T14:15:00Z',
      Email: 'luke.phillips@example.com',
      Area_of_Work: 'Property',
      Type_of_Work: 'Lease Agreement',
      Method_of_Contact: 'Phone',
      Point_of_Contact: 'team@helix-law.com',
      Company: 'Phillips Consulting Ltd',
      First_Name: 'Luke',
      Last_Name: 'Phillips',
      Phone_Number: '+44 7123 456789',
      Value: '£3,500',
      Rating: 'Neutral',
    },
    {
      ID: 'test-003',
      Date_Created: '2024-07-28T09:00:00Z',
      Touchpoint_Date: '2024-07-28T09:00:00Z',
      Email: 'sarah.jones@testcompany.co.uk',
      Area_of_Work: 'Employment',
      Type_of_Work: 'Workplace Dispute',
      Method_of_Contact: 'Web Form',
      Point_of_Contact: 'team@helix-law.com',
      Company: 'Test Company Ltd',
      First_Name: 'Sarah',
      Last_Name: 'Jones',
      Phone_Number: '+44 7987 654321',
      Value: '£2,000',
    },
  ];

  // Combine actual enquiries with test data for demonstration
  const [enrichedEnquiries, setEnrichedEnquiries] = useState<Enquiry[]>(() => {
    const combined = [...(enquiries || []), ...sampleTestEnquiries];
    return combined;
  });

  // Use enrichedEnquiries instead of localEnquiries for demonstration
  const [displayEnquiries, setDisplayEnquiries] = useState<Enquiry[]>(enrichedEnquiries);
  const { isDarkMode } = useTheme();
  const { setContent } = useNavigator();
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedNewEnquiry, setSelectedNewEnquiry] = useState<NewEnquiry | null>(null);

  // Convert NewEnquiry to Enquiry for compatibility with PitchBuilder
  const convertNewEnquiryToEnquiry = (newEnquiry: NewEnquiry): Enquiry => {
    return {
      ID: newEnquiry.id.toString(),
      Date_Created: newEnquiry.datetime,
      Touchpoint_Date: newEnquiry.datetime,
      Email: newEnquiry.email,
      Area_of_Work: newEnquiry.aow,
      Type_of_Work: newEnquiry.tow,
      Method_of_Contact: newEnquiry.moc,
      Point_of_Contact: newEnquiry.poc,
      First_Name: newEnquiry.first,
      Last_Name: newEnquiry.last,
      Phone_Number: newEnquiry.phone,
      Value: newEnquiry.value,
      // Add other required fields with sensible defaults
      Gift_Rank: parseInt(newEnquiry.rank) || 0,
    } as Enquiry;
  };
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Removed pagination states
  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const enquiriesPerPage = 12;

  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false);
  const [currentRating, setCurrentRating] = useState<string>('');
  const [ratingEnquiryId, setRatingEnquiryId] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [activeMainTab, setActiveMainTab] = useState<string>('Claimed');
  const [activeSubTab, setActiveSubTab] = useState<string>('Overview');
  const [showUnclaimedBoard, setShowUnclaimedBoard] = useState<boolean>(false);
  const [convertedEnquiriesList, setConvertedEnquiriesList] = useState<Enquiry[]>([]);
  const [convertedPoidDataList, setConvertedPoidDataList] = useState<POID[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ oldest: string; newest: string } | null>(null);
  const [isSearchActive, setSearchActive] = useState<boolean>(false);
  const [showGroupedView, setShowGroupedView] = useState<boolean>(true);

  const [currentSliderStart, setCurrentSliderStart] = useState<number>(0);
  const [currentSliderEnd, setCurrentSliderEnd] = useState<number>(0);

  // Added for infinite scroll
  const [itemsToShow, setItemsToShow] = useState<number>(20);
  const loader = useRef<HTMLDivElement | null>(null);
  const previousMainTab = useRef<string>('Claimed');

  const toggleDashboard = useCallback(() => {
    if (activeMainTab === '') {
      setActiveMainTab(previousMainTab.current || 'Claimed');
    } else {
      previousMainTab.current = activeMainTab;
      setActiveMainTab('');
    }
  }, [activeMainTab]);

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

  const unclaimedEnquiries = useMemo(
    () =>
      displayEnquiries.filter(
        (e) => e.Point_of_Contact?.toLowerCase() === 'team@helix-law.com'
      ),
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

  useEffect(() => {
    if (poidData && displayEnquiries.length > 0) {
      const converted = displayEnquiries.filter((enq) =>
        poidData.some((poid) => String(poid.acid) === enq.ID)
      );
      setConvertedEnquiriesList(converted);
  
      const convertedPoid = poidData.filter((poid) =>
        displayEnquiries.some((enq) => enq.ID === String(poid.acid))
      );
      setConvertedPoidDataList(convertedPoid);
    }
  }, [poidData, displayEnquiries]);

  const handleSubTabChange = useCallback((item?: PivotItem) => {
    if (item) {
      setActiveSubTab(item.props.itemKey as string);
    }
  }, []);

  const handleSelectEnquiry = useCallback((enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setActiveSubTab('Pitch'); // Go directly to Pitch Builder instead of Overview
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedEnquiry(null);
  }, []);

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

  const handleEditRating = useCallback(async (id: string, newRating: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_UPDATE_RATING_PATH}?code=${process.env.REACT_APP_UPDATE_RATING_CODE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ID: id, Rating: newRating }),
        }
      );
      if (response.ok) {
        setLocalEnquiries((prev) =>
          prev.map((enq) =>
            enq.ID === id ? { ...enq, Rating: newRating as Enquiry['Rating'] } : enq
          )
        );
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

  const triagedPointOfContactEmails = useMemo(
    () =>
      [
        'automations@helix-law.com',
        'commercial@helix-law.com',
        'construction@helix-law.com',
        'employment@helix-law.com',
        'property@helix-law.com',
      ].map((e) => e.toLowerCase()),
    []
  );

  const filteredEnquiries = useMemo(() => {
    let filtered = enquiriesInSliderRange;
    if (activeMainTab === 'All') {
      // do nothing
    } else {
      switch (activeMainTab) {
        case 'Claimed':
          filtered = filtered.filter(
            (e) => e.Point_of_Contact?.toLowerCase() === (context?.userPrincipalName || '').toLowerCase()
          );
          break;
        case 'Converted':
          if (context && context.userPrincipalName) {
            const userEmail = context.userPrincipalName.toLowerCase();
            const userFilteredEnquiryIds = convertedPoidDataList
              .filter((p) => p.poc?.toLowerCase() === userEmail)
              .map((p) => String(p.acid));
            filtered = convertedEnquiriesList.filter((enq) =>
              userFilteredEnquiryIds.includes(enq.ID)
            );
          } else {
            filtered = convertedEnquiriesList;
          }
          break;
        case 'Claimable':
          filtered = filtered.filter(
            (enq) => enq.Point_of_Contact?.toLowerCase() === 'team@helix-law.com'
          );
          break;
        case 'Triaged':
          filtered = filtered.filter(
            (enq) =>
              enq.Point_of_Contact &&
              triagedPointOfContactEmails.includes(enq.Point_of_Contact.toLowerCase())
          );
          break;
        default:
          break;
      }
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (en) =>
          `${en.First_Name} ${en.Last_Name}`.toLowerCase().includes(lowerSearchTerm) ||
          en.Email?.toLowerCase().includes(lowerSearchTerm) ||
          (en.Company && en.Company.toLowerCase().includes(lowerSearchTerm))
      );
    }
    if (selectedArea) {
      filtered = filtered.filter(
        (enq) => enq.Area_of_Work && enq.Area_of_Work.toLowerCase() === selectedArea.toLowerCase()
      );
    }
    return filtered;
  }, [
    enquiriesInSliderRange,
    activeMainTab,
    context,
    searchTerm,
    triagedPointOfContactEmails,
    convertedEnquiriesList,
    convertedPoidDataList,
    selectedArea,
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
      setActiveMainTab(key);
      setActiveSubTab('Overview');
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
      height: ACTION_BAR_HEIGHT,
      position: 'sticky',
      top: ACTION_BAR_HEIGHT,
      zIndex: 999,
    });
  }

  useLayoutEffect(() => {
    if (!selectedEnquiry && !selectedNewEnquiry) {
      setContent(
        <EnquiriesMenu
          activeArea={selectedArea}
          setActiveArea={setSelectedArea}
          activeState={activeMainTab}
          setActiveState={handleSetActiveState}
          toggleDashboard={toggleDashboard}
          toggleUnclaimed={toggleUnclaimedBoard}
          unclaimedActive={showUnclaimedBoard}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSearchActive={isSearchActive}
          setSearchActive={setSearchActive}
          showGroupedView={showGroupedView}
          setShowGroupedView={setShowGroupedView}
        />
      );
    } else {
      setContent(
        <div className={detailNavStyle(isDarkMode)}>
          <IconButton
            iconProps={{ iconName: 'ChevronLeft' }}
            onClick={handleBackToList}
            className={backButtonStyle}
            title="Back"
            ariaLabel="Back"
          />
          <Pivot
            className="navigatorPivot"
            selectedKey={activeSubTab}
            onLinkClick={handleSubTabChange}
          >
            <PivotItem headerText="Overview" itemKey="Overview" />
            <PivotItem headerText="Pitch Builder" itemKey="Pitch" />
          </Pivot>
        </div>
      );
    }
    return () => setContent(null);
  }, [
    setContent,
    selectedEnquiry,
    selectedNewEnquiry,
    selectedArea,
    activeMainTab,
    searchTerm,
    isSearchActive,
    handleSetActiveState,
    isDarkMode,
    activeSubTab,
    handleSubTabChange,
    handleBackToList,
  ]);

  // Navigator content for new enquiry system
  useEffect(() => {
    if (selectedNewEnquiry) {
      setContent(
        <div className={detailNavStyle(isDarkMode)}>
          <div 
            className="nav-back-button"
            onClick={() => setSelectedNewEnquiry(null)}
            style={{
              width: '32px',
              height: '32px',
              background: isDarkMode ? colours.dark.sectionBackground : "#f3f3f3",
              border: '1px solid #e1dfdd',
              borderRadius: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              marginRight: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e7f1ff';
              e.currentTarget.style.border = '1px solid #3690CE';
              e.currentTarget.style.width = '120px';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? colours.dark.sectionBackground : "#f3f3f3";
              e.currentTarget.style.border = '1px solid #e1dfdd';
              e.currentTarget.style.width = '32px';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            }}
            title="Back to Enquiries"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedNewEnquiry(null);
              }
            }}
          >
            {/* ChevronLeft Icon */}
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              style={{
                transition: 'color 0.3s, opacity 0.3s',
                color: isDarkMode ? '#ffffff' : '#666666',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <path 
                d="M10 12L6 8L10 4" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Expandable Text */}
            <span 
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '14px',
                fontWeight: 600,
                color: '#3690CE',
                opacity: 0,
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
              }}
              className="back-text"
            >
              Back to Enquiries
            </span>
          </div>
          
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: isDarkMode ? colours.dark.text : colours.light.text,
            marginLeft: '8px'
          }}>
            Enquiry: {selectedNewEnquiry.id}
          </span>
          
          <style>{`
            .nav-back-button:hover .back-text {
              opacity: 1 !important;
            }
            .nav-back-button:hover svg {
              opacity: 0 !important;
            }
          `}</style>
        </div>
      );
    }
  }, [selectedNewEnquiry, setContent, isDarkMode]);

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
      <Stack
        tokens={{ childrenGap: 24 }}
        styles={{
          root: {
            backgroundColor: isDarkMode
              ? colours.dark.sectionBackground
              : colours.light.sectionBackground,
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '32px',
            borderRadius: '12px',
            fontFamily: 'Raleway, sans-serif',
          },
        }}
      >
        {activeSubTab === 'Overview' && (
          <EnquiryOverview 
            enquiry={enquiry} 
            onEditRating={handleRate} 
            onEditNotes={() => { }} 
            allEnquiries={displayEnquiries}
            onSelectEnquiry={handleSelectEnquiry}
          />
        )}
        {activeSubTab === 'Pitch' && (
          <PitchBuilder enquiry={enquiry} userData={userData} />
        )}
      </Stack>
    ),
    [handleRate, isDarkMode, activeSubTab, userData]
  );

  const enquiriesCountPerMember = useMemo(() => {
    if (!enquiriesInSliderRange || !teamData) return [];
    const grouped: { [email: string]: number } = {};
    enquiriesInSliderRange.forEach((enq) => {
      const pocEmail = enq.Point_of_Contact?.toLowerCase();
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

  return (
    <div className={containerStyle(isDarkMode)}>
      <div className={mergeStyles({ width: '100%' })}></div>

      <section className="page-section">
        <Stack
          tokens={{ childrenGap: 20 }}
          styles={{
            root: {
              backgroundColor: isDarkMode 
                ? colours.dark.sectionBackground 
                : colours.light.sectionBackground,
              padding: '16px',
              borderRadius: 0,
              boxShadow: isDarkMode
                ? `0 4px 12px ${colours.dark.border}`
                : `0 4px 12px ${colours.light.border}`,
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
      ) : (
        !selectedEnquiry &&
        !selectedNewEnquiry &&
        !selectedArea &&
        !activeMainTab && (
          <Stack
            tokens={{ childrenGap: 20 }}
            styles={{
              root: {
                backgroundColor: isDarkMode ? colours.dark.sectionBackground : '#fff',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: isDarkMode
                ? '0 4px 16px rgba(0, 0, 0, 0.6)'
                : '0 4px 16px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px',
              fontFamily: 'Raleway, sans-serif',
            },
          }}
        >
          <Stack
            horizontalAlign="center"
            tokens={{ childrenGap: 20 }}
            style={{ marginBottom: '20px' }}
          >
              <Stack
              tokens={{ childrenGap: 5 }}
              verticalAlign="center"
              style={{ fontFamily: 'Raleway, sans-serif' }}
              >
              <Text
                variant="mediumPlus"
                styles={{
                  root: {
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    textAlign: 'center',
                    width: '100%',
                  },
                }}
                >
                {sortedValidEnquiries[currentSliderEnd]?.Touchpoint_Date
                  ? format(
                    parseISO(sortedValidEnquiries[currentSliderEnd].Touchpoint_Date),
                    'dd MMM yyyy'
                  )
                  : ''}
                {' - '}
                {sortedValidEnquiries[currentSliderStart]?.Touchpoint_Date
                  ? format(
                    parseISO(sortedValidEnquiries[currentSliderStart].Touchpoint_Date),
                    'dd MMM yyyy'
                  )
                  : ''}
              </Text>
              <Slider
                range
                min={0}
                max={sortedValidEnquiries.length - 1}
                value={[
                  sortedValidEnquiries.length - 1 - currentSliderEnd,
                  sortedValidEnquiries.length - 1 - currentSliderStart,
                ]}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    setCurrentSliderStart(sortedValidEnquiries.length - 1 - value[1]);
                    setCurrentSliderEnd(sortedValidEnquiries.length - 1 - value[0]);
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

            </Stack>
          </Stack>
          <Stack
            horizontal
            wrap
            horizontalAlign="stretch"
            tokens={{ childrenGap: 20 }}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {['Commercial', 'Property', 'Construction', 'Employment', 'Other/Unsure'].map(
              (area) => (
                <AreaCountCard
                  key={area}
                  area={area}
                  count={enquiriesCountPerArea[area]}
                  monthlyCounts={monthlyEnquiryCounts.map((m) => ({
                    month: m.month,
                    count: getMonthlyCountByArea(m, area),
                  }))}
                  icon={getAreaIcon(area)}
                  color={getAreaColor(area)}
                  animationDelay={0.2}
                />
              )
            )}
          </Stack>
        </Stack>
        )
      )}

      <div
        key={activeMainTab}
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
        {!selectedEnquiry && !selectedArea && !activeMainTab ? (
          <div
            className={mergeStyles({
              padding: '30px',
              backgroundColor: 'transparent',
              borderRadius: '20px',
              boxShadow: 'none',
              position: 'relative',
              fontFamily: 'Raleway, sans-serif',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={monthlyEnquiryCounts}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                style={{ fontFamily: 'Raleway, sans-serif' }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? colours.dark.border : '#e0e0e0'}
                />
                <YAxis
                  stroke={isDarkMode ? colours.dark.text : colours.light.text}
                  tick={{
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: 'Raleway, sans-serif',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode
                      ? colours.dark.sectionBackground
                      : colours.light.background,
                    border: `1px solid ${
                      isDarkMode ? colours.dark.border : colours.light.border
                    }`,
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontFamily: 'Raleway, sans-serif',
                  }}
                  labelStyle={{
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontFamily: 'Raleway, sans-serif',
                  }}
                  itemStyle={{
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontFamily: 'Raleway, sans-serif',
                  }}
                />
                <Legend content={renderCustomLegend} />
                <Bar
                  dataKey="commercial"
                  shape={<CustomBarShape />}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="commercial"
                    content={(props) => (
                      <CustomLabel
                        {...props}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isDarkMode={isDarkMode}
                        dataKey="commercial"
                      />
                    )}
                  />
                </Bar>
                <Bar
                  dataKey="property"
                  shape={<CustomBarShape />}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="property"
                    content={(props) => (
                      <CustomLabel
                        {...props}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isDarkMode={isDarkMode}
                        dataKey="property"
                      />
                    )}
                  />
                </Bar>
                <Bar
                  dataKey="construction"
                  shape={<CustomBarShape />}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="construction"
                    content={(props) => (
                      <CustomLabel
                        {...props}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isDarkMode={isDarkMode}
                        dataKey="construction"
                      />
                    )}
                  />
                </Bar>
                <Bar
                  dataKey="employment"
                  shape={<CustomBarShape />}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="employment"
                    content={(props) => (
                      <CustomLabel
                        {...props}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isDarkMode={isDarkMode}
                        dataKey="employment"
                      />
                    )}
                  />
                </Bar>
                <Bar
                  dataKey="otherUnsure"
                  shape={<CustomBarShape />}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="otherUnsure"
                    content={(props) => (
                      <CustomLabel
                        {...props}
                        value={typeof props.value === 'number' ? props.value : undefined}
                        isDarkMode={isDarkMode}
                        dataKey="otherUnsure"
                      />
                    )}
                  />
                </Bar>
                <XAxis
                  dataKey="month"
                  stroke={isDarkMode ? colours.dark.text : colours.light.text}
                  tick={{
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: 'Raleway, sans-serif',
                    textAnchor: 'middle',
                  }}
                  height={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : selectedEnquiry ? (
          renderDetailView(selectedEnquiry)
        ) : (
          <>
            {/* New Enquiry List - always shown unless v1 enquiry is selected */}
            <NewEnquiryList
              onSelectEnquiry={(enquiry: NewEnquiry) => {
                setSelectedNewEnquiry(enquiry);
              }}
              onRateEnquiry={(enquiryId: number) => {
                console.log('Rate enquiry:', enquiryId);
                // Could integrate with existing rating system
              }}
              onPitch={(enquiry: NewEnquiry) => {
                setSelectedNewEnquiry(enquiry);
                // Convert NewEnquiry to Enquiry and set it for the PitchBuilder
                const convertedEnquiry = convertNewEnquiryToEnquiry(enquiry);
                setSelectedEnquiry(convertedEnquiry);
                setActiveSubTab('Pitch'); // Go directly to Pitch Builder
              }}
            />

            {/* V1 Enquiries - only show if no v2 enquiry is selected */}
            {!selectedNewEnquiry && filteredEnquiries.length === 0 ? (
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
                  No enquiries found
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
                  Try adjusting your search criteria or filters
                </Text>
              </div>
            ) : !selectedNewEnquiry ? (
              <>
                {/* Connected List Items */}
                <div
                  className={mergeStyles({
                    display: 'flex',
                    flexDirection: 'column',
                    gap:  "12px",
                    padding: 0,
                    margin: 0,
                    backgroundColor: 'transparent',
                  })}
                >
                  {displayedItems.map((item, idx) => {
                    const isLast = idx === displayedItems.length - 1;
                    
                    if (isGroupedEnquiry(item)) {
                      // Render grouped enquiry card
                      return (
                        <GroupedEnquiryCard
                          key={item.clientKey}
                          groupedEnquiry={item}
                          onSelect={handleSelectEnquiry}
                          onRate={handleRate}
                          teamData={teamData}
                          isLast={isLast}
                        />
                      );
                    } else {
                      // Render single enquiry
                      return (
                        <EnquiryLineItem
                          key={item.ID}
                          enquiry={item}
                          onSelect={handleSelectEnquiry}
                          onRate={handleRate}
                          teamData={teamData}
                          isLast={isLast}
                        />
                      );
                    }
                  })}
                </div>
                <div ref={loader} />
              </>
            ) : null}
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
    </div>
  );

  function containerStyle(dark: boolean) {
    return mergeStyles({
      backgroundColor: dark ? colours.dark.background : colours.light.background,
      minHeight: '100vh',
      boxSizing: 'border-box',
      color: dark ? colours.light.text : colours.dark.text,
    });
  }
};

export default Enquiries;
