import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import CustomTabs from './styles/CustomTabs';
import { ThemeProvider } from './functionality/ThemeContext';
import Navigator from '../components/Navigator';
import { useNavigatorActions } from './functionality/NavigatorContext';
import FormsModal from '../components/FormsModal';
import ResourcesModal from '../components/ResourcesModal';
import { NavigatorProvider } from './functionality/NavigatorContext';
import { colours } from './styles/colours';
import * as microsoftTeams from '@microsoft/teams-js';
import { Context as TeamsContextType } from '@microsoft/teams-js';
import { Matter, UserData, Enquiry, Tab, TeamData, POID, Transaction, BoardroomBooking, SoundproofPodBooking, InstructionData, NormalizedMatter } from './functionality/types';
import { hasActiveMatterOpening } from './functionality/matterOpeningUtils';
import localIdVerifications from '../localData/localIdVerifications.json';
import localInstructionData from '../localData/localInstructionData.json';
import { getProxyBaseUrl } from '../utils/getProxyBaseUrl';
import { ADMIN_USERS, isAdminUser } from './admin';

const proxyBaseUrl = getProxyBaseUrl();

const Home = lazy(() => import('../tabs/home/Home'));
const Forms = lazy(() => import('../tabs/forms/Forms'));
const Enquiries = lazy(() => import('../tabs/enquiries/Enquiries'));
const Instructions = lazy(() => import('../tabs/instructions/Instructions'));
const Matters = lazy(() => import('../tabs/matters/Matters'));
const ReportingHome = lazy(() => import('../tabs/Reporting/ReportingHome')); // Replace ReportingCode with ReportingHome
const CallHub = lazy(() => import('../tabs/CallHub/CallHub'));

interface AppProps {
  teamsContext: TeamsContextType | null;
  userData: UserData[] | null;
  enquiries: Enquiry[] | null;
  matters: NormalizedMatter[];
  isLoading: boolean;
  error: string | null;
  teamData?: TeamData[] | null;
  isLocalDev?: boolean;
  onAreaChange?: (areas: string[]) => void;
  onUserChange?: (user: UserData) => void;
  onRefreshEnquiries?: () => Promise<void>;
}

const App: React.FC<AppProps> = ({
  teamsContext,
  userData,
  enquiries,
  matters,
  isLoading,
  error,
  teamData,
  isLocalDev = false,
  onAreaChange,
  onUserChange,
  onRefreshEnquiries,
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const isDarkMode = teamsContext?.theme === 'dark';

  // Map and validate POID data from localIdVerifications
  const initialPoidData: POID[] = (localIdVerifications as any[])
    .map((v) => ({
      poid_id: String(v.InternalId),
      first: v.FirstName,
      last: v.LastName,
      email: v.Email,
      nationality: v.Nationality,
      nationality_iso: v.NationalityAlpha2,
      date_of_birth: v.DOB,
      passport_number: v.PassportNumber,
      drivers_license_number: v.DriversLicenseNumber,
      house_building_number: v.HouseNumber,
      street: v.Street,
      city: v.City,
      county: v.County,
      post_code: v.Postcode,
      country: v.Country,
      company_name: v.company_name || v.CompanyName,
      company_number: v.company_number || v.CompanyNumber,
      company_house_building_number: v.company_house_building_number || v.CompanyHouseNumber,
      company_street: v.company_street || v.CompanyStreet,
      company_city: v.company_city || v.CompanyCity,
      company_county: v.company_county || v.CompanyCounty,
      company_post_code: v.company_post_code || v.CompanyPostcode,
      company_country: v.company_country || v.CompanyCountry,
      company_country_code: v.company_country_code || v.CompanyCountryCode,
      // Electronic ID verification fields
      stage: v.stage,
      check_result: v.EIDOverallResult,
      pep_sanctions_result: v.PEPAndSanctionsCheckResult,
      address_verification_result: v.AddressVerificationResult,
      check_expiry: v.CheckExpiry,
      poc: v.poc,
      prefix: v.prefix,
      type: v.type,
      client_id: v.ClientId,
      matter_id: v.MatterId,
    }))
    .filter(poid =>
      poid &&
      poid.poid_id &&
      poid.first &&
      poid.last &&
      isNaN(Number(poid.first)) &&
      isNaN(Number(poid.last))
    );
  const [poidData, setPoidData] = useState<POID[]>(initialPoidData);
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);
  const [allInstructionData, setAllInstructionData] = useState<InstructionData[]>([]); // Admin: all users' instructions
  const [allMattersFromHome, setAllMattersFromHome] = useState<Matter[] | null>(null);
  const [outstandingBalances, setOutstandingBalances] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined);
  const [boardroomBookings, setBoardroomBookings] = useState<BoardroomBooking[] | null>(null);
  const [soundproofBookings, setSoundproofBookings] = useState<SoundproofPodBooking[] | null>(null);
  
  // Modal state management with mutual exclusivity
  const [isFormsModalOpen, setIsFormsModalOpen] = useState(false);
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);
  
  const [hasActiveMatter, setHasActiveMatter] = useState(false);
  const [isInMatterOpeningWorkflow, setIsInMatterOpeningWorkflow] = useState(false);

  // Check for active matter opening every 2 seconds
  useEffect(() => {
    const checkActiveMatter = () => {
      setHasActiveMatter(hasActiveMatterOpening(isInMatterOpeningWorkflow));
    };
    
    // Initial check
    checkActiveMatter();
    
    // Set up polling
    const interval = setInterval(checkActiveMatter, 2000);
    
    return () => clearInterval(interval);
  }, [isInMatterOpeningWorkflow]);

  // Modal handlers with mutual exclusivity
  const openFormsModal = () => {
    setIsResourcesModalOpen(false); // Close resources modal first
    setIsFormsModalOpen(true);
  };

  const openResourcesModal = () => {
    setIsFormsModalOpen(false); // Close forms modal first
    setIsResourcesModalOpen(true);
  };

  const closeFormsModal = () => {
    setIsFormsModalOpen(false);
  };

  const closeResourcesModal = () => {
    setIsResourcesModalOpen(false);
  };

  // Open modals when tabs are selected
  useEffect(() => {
    if (activeTab === 'forms') {
      openFormsModal();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'resources') {
      openResourcesModal();
    }
  }, [activeTab]);

  const handleAllMattersFetched = (fetchedMatters: Matter[]) => {
    setAllMattersFromHome(fetchedMatters);
  };

  const handleOutstandingBalancesFetched = (data: any) => {
    setOutstandingBalances(data);
  };

  const handlePOID6YearsFetched = (data: any[]) => {
    // Don't override the local POID data with POID6Years data
    // We should store this separately but never use it for the main POID list
    // NEVER DO: setPoidData(data);
    
    // Since POID data should only come from localIdVerifications.json,
    // we'll reset poidData to initialPoidData if it's been corrupted
    if (poidData.length !== initialPoidData.length) {
      setPoidData(initialPoidData);
    }
  };

  const handleTransactionsFetched = (fetchedTransactions: Transaction[]) => {
    setTransactions(fetchedTransactions);
  };

  const handleBoardroomBookingsFetched = (data: BoardroomBooking[]) => {
    setBoardroomBookings(data);
  };

  const handleSoundproofBookingsFetched = (data: SoundproofPodBooking[]) => {
    setSoundproofBookings(data);
  };

  const handleFormsTabClick = () => {
    if (isFormsModalOpen) {
      closeFormsModal();
    } else {
      openFormsModal();
    }
  };

  const handleResourcesTabClick = () => {
    if (isResourcesModalOpen) {
      closeResourcesModal();
    } else {
      openResourcesModal();
    }
  };

  useEffect(() => {
    const closeLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.transition = 'opacity 0.5s';
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 500);
      }
    };

    if (teamsContext && userData && enquiries && matters) {
      closeLoadingScreen();
    }
  }, [teamsContext, userData, enquiries, matters]);

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigateToInstructions = () => {
      setActiveTab('instructions');
    };
    const handleNavigateToEnquiries = () => {
      setActiveTab('enquiries');
    };

    window.addEventListener('navigateToInstructions', handleNavigateToInstructions);
    window.addEventListener('navigateToEnquiries', handleNavigateToEnquiries);

    return () => {
      window.removeEventListener('navigateToInstructions', handleNavigateToInstructions);
      window.removeEventListener('navigateToEnquiries', handleNavigateToEnquiries);
    };
  }, []);

  // Determine the current user's initials
  const userInitials = userData?.[0]?.Initials?.toUpperCase() || '';

  // Fetch instruction data on app load
  useEffect(() => {
    const useLocalData =
      process.env.REACT_APP_USE_LOCAL_DATA === "true" ||
      (process.env.REACT_APP_USE_LOCAL_DATA !== "false" && window.location.hostname === "localhost");

    async function fetchInstructionData() {
      const pilotUsers = ["AC", "JW", "KW", "BL", "LZ"];
      const targetInitials = pilotUsers.includes(userInitials) ? "LZ" : userInitials;
      const currentUser = userData?.[0];
      const isAdmin = isAdminUser(currentUser);

      if (useLocalData) {
        console.log('🔧 Using local test instruction data for development');
        // Merge local instruction data with ID verification data
        const instructionsWithIdVerifications = (localInstructionData as InstructionData[]).map(prospect => ({
          ...prospect,
          // Add ID verifications to prospect level
          idVerifications: (localIdVerifications as any[]).filter(
            (idv: any) => prospect.instructions?.some((inst: any) => inst.InstructionRef === idv.InstructionRef)
          ),
          // Also add to instructions level for easier access
          instructions: prospect.instructions?.map(inst => ({
            ...inst,
            idVerifications: (localIdVerifications as any[]).filter(
              (idv: any) => idv.InstructionRef === inst.InstructionRef
            )
          }))
        }));
        
        setInstructionData(instructionsWithIdVerifications);
        if (isAdmin) {
          setAllInstructionData(instructionsWithIdVerifications); // Admin gets all local data
        }
        return;
      }

      try {
        console.log('🔵 Fetching instruction data from unified server endpoint');
        
        // Call our new unified server endpoint
        const params = new URLSearchParams();
        if (!isAdmin) {
          params.append('initials', targetInitials);
        } else {
          params.append('includeAll', 'true');
        }
        
        const url = `/api/instructions?${params.toString()}`;
        console.log('🌐 Calling unified endpoint:', url);
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('✅ Received clean instruction data:', {
          count: data.count,
          computedServerSide: data.computedServerSide,
          timestamp: data.timestamp
        });

        // Debug: Check if Luke Test instruction is in the response
        console.log('🔍 Debug: Instructions in API response:', data.instructions?.length || 0);
        const lukeTest = data.instructions?.find((i: any) => i.InstructionRef?.includes('27367-94842'));
        console.log('🔍 Debug: Luke Test found in instructions:', !!lukeTest, lukeTest?.FirstName, lukeTest?.LastName);
        
        // Backend now returns all items (instructions + deals) in the instructions array
        // Transform each item into our frontend format
        const transformedData: InstructionData[] = data.instructions.map((item: any) => {
          // Check if this is a real instruction or a standalone deal
          const isRealInstruction = item.isRealInstruction !== false;
          
          if (isRealInstruction) {
            // This is a real instruction with embedded deal data
            return {
              prospectId: item.InstructionRef, // Use instruction ref as prospect ID
              instructions: [item], // Single instruction
              deals: item.deal ? [item.deal] : [], // Nested deal if exists
              documents: item.documents || [], // Nested documents
              idVerifications: item.idVerifications || [], // Nested ID verifications
              electronicIDChecks: item.idVerifications || [], // Alias for compatibility
              riskAssessments: item.riskAssessments || [], // Nested risk assessments
              compliance: item.riskAssessments || [], // Alias for compatibility
              jointClients: item.deal?.jointClients || [], // Joint clients from nested deal
              matters: item.matters || [], // Nested matters if any
              payments: item.payments || [], // Add payments data from instruction
              
              // Add computed properties for UI
              verificationStatus: (item.idVerifications?.length || 0) > 0 ? 'completed' : 'pending',
              riskStatus: (item.riskAssessments?.length || 0) > 0 ? 'assessed' : 'pending',
              nextAction: item.Stage || 'review',
              matterLinked: !!item.MatterId,
              paymentCompleted: item.InternalStatus === 'paid',
              documentCount: item.documents?.length || 0
            };
          } else {
            // This is a standalone deal (pitched deal without instruction)
            const deal = item.deal || item; // Deal data might be nested or at root level
            return {
              prospectId: item.InstructionRef || `deal-${deal.DealId}`, // Use instruction ref or deal ID
              instructions: [], // No instruction yet for pitched deals
              deals: [deal], // Single deal
              documents: deal.documents || [],
              idVerifications: [],
              electronicIDChecks: [],
              riskAssessments: [],
              compliance: [],
              jointClients: deal.jointClients || [],
              matters: [],
              
              // Add computed properties for UI
              verificationStatus: 'pending',
              riskStatus: 'pending',
              nextAction: deal.Status || 'pitched',
              matterLinked: false,
              paymentCompleted: false,
              documentCount: deal.documents?.length || 0
            };
          }
        });

        // Set the data - now properly structured!
        setInstructionData(transformedData);
        
        // Debug: Check what was actually set
        console.log('🔍 Debug: Transformed data count:', transformedData.length);
        const instructionsCount = transformedData.filter(item => item.instructions.length > 0).length;
        const pitchedDealsCount = transformedData.filter(item => item.instructions.length === 0).length;
        console.log('🔍 Debug: Real instructions count:', instructionsCount);
        console.log('🔍 Debug: Pitched deals count:', pitchedDealsCount);
        const lukeTransformed = transformedData.find(item => 
          item.instructions?.[0]?.InstructionRef?.includes('27367-94842') ||
          String(item.prospectId)?.includes('27367-94842')
        );
        console.log('🔍 Debug: Luke Test in transformed data:', !!lukeTransformed);
        
        if (isAdmin) {
          setAllInstructionData(transformedData);
        }
        
        console.log('✅ Clean instruction data loaded successfully');

      } catch (err) {
        console.error("❌ Error fetching instruction data from unified endpoint:", err);
        
        // Fallback: try the legacy endpoint as backup
        console.log('🔄 Attempting legacy endpoint as fallback...');
        const path = process.env.REACT_APP_GET_INSTRUCTION_DATA_PATH;
        const code = process.env.REACT_APP_GET_INSTRUCTION_DATA_CODE;
        if (path && code) {
          try {
            const url = `${proxyBaseUrl}/${path}?code=${code}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              const all = Array.isArray(data) ? data : [data];
              
              if (isAdmin) {
                setAllInstructionData(all);
              }
              
              const filtered = all.reduce<InstructionData[]>((acc, prospect) => {
                const instructions = (prospect.instructions ?? []).filter(
                  (inst: any) => inst.HelixContact === targetInitials,
                );
                if (instructions.length > 0) {
                  const refSet = new Set(
                    instructions.map((i: any) => i.InstructionRef),
                  );
                  acc.push({
                    ...prospect,
                    instructions,
                    deals: (prospect.deals ?? []).filter((d: any) =>
                      refSet.has(d.InstructionRef),
                    ),
                  });
                }
                return acc;
              }, []);
              setInstructionData(filtered);
              console.log('✅ Legacy endpoint worked as fallback');
            } else {
              console.error("Failed to fetch instructions from legacy endpoint");
            }
          } catch (legacyErr) {
            console.error("Legacy endpoint error:", legacyErr);
          }
        } else {
          console.error("Missing env variables for legacy instruction data endpoint");
        }
      }
    }

    if (userInitials) {
      fetchInstructionData();
    }
  }, [userInitials, userData]);

  // Tabs visible to all users start with the Enquiries tab.
  // Only show the Instructions tab to admins or when developing locally (hostname === 'localhost').
  // Only show the Reports tab to admins.
  const tabs: Tab[] = useMemo(() => {
    const isLocalhost = window.location.hostname === 'localhost';
    const currentUser = userData?.[0] || null;
    const isAdmin = isAdminUser(currentUser);
    
    const showInstructionsTab = isAdmin;
    const showReportsTab = isAdmin;

    return [
      { key: 'enquiries', text: 'Enquiries' },
      ...(showInstructionsTab ? [{ key: 'instructions', text: 'Instructions' }] : []),
      { key: 'matters', text: 'Matters' },
      { key: 'forms', text: 'Forms', disabled: true }, // Disabled tab that triggers modal
      { key: 'resources', text: 'Resources', disabled: true }, // Disabled tab that triggers modal
      ...(showReportsTab ? [{ key: 'reporting', text: 'Reports' }] : []),
      ...(isLocalhost ? [{ key: 'callhub', text: 'Call Hub' }] : []),
    ];
  }, [userData]);

  // Ensure the active tab is still valid when tabs change (e.g., when switching users)
  // If current tab is no longer available, redirect to home instead of breaking navigation
  useEffect(() => {
    const validTabKeys = tabs.map(tab => tab.key);
    if (activeTab !== 'home' && !validTabKeys.includes(activeTab)) {
      setActiveTab('home'); // Redirect to home if current tab is no longer valid
    }
  }, [tabs, activeTab]);

  const { setContent } = useNavigatorActions();

  // Ensure Navigator content is cleared when navigating away from Home
  React.useEffect(() => {
    if (activeTab !== 'home') {
      setContent(null);
    }
  }, [activeTab, setContent]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home
            context={teamsContext}
            userData={userData}
            enquiries={enquiries}
            onAllMattersFetched={handleAllMattersFetched}
            onOutstandingBalancesFetched={handleOutstandingBalancesFetched}
            onPOID6YearsFetched={handlePOID6YearsFetched}
            onTransactionsFetched={handleTransactionsFetched}
            onBoardroomBookingsFetched={handleBoardroomBookingsFetched}
            onSoundproofBookingsFetched={handleSoundproofBookingsFetched}
            teamData={teamData}
            isInMatterOpeningWorkflow={isInMatterOpeningWorkflow}
          />
        );
      case 'enquiries':
        return (
          <Enquiries
            context={teamsContext}
            userData={userData}
            enquiries={enquiries}
            teamData={teamData}
            poidData={poidData}
            setPoidData={setPoidData}
            onRefreshEnquiries={onRefreshEnquiries}
          />
        );
      case 'instructions':
        return (
          <Instructions
            userInitials={userInitials}
            instructionData={instructionData}
            setInstructionData={setInstructionData}
            allInstructionData={allInstructionData}
            teamData={teamData}
            userData={userData}
            matters={allMattersFromHome || []}
            hasActiveMatter={hasActiveMatter}
            setIsInMatterOpeningWorkflow={setIsInMatterOpeningWorkflow} poidData={[]} setPoidData={function (value: React.SetStateAction<POID[]>): void {
              throw new Error('Function not implemented.');
            } } enquiries={enquiries}          />
          );
      case 'matters':
        return (
          <Matters
            matters={matters}
            isLoading={isLoading}
            error={error}
            userData={userData}
          />
        );
      case 'reporting':
        return <ReportingHome userData={userData} teamData={teamData} />;
      case 'callhub':
        return <CallHub />;
      default:
        return (
          <Home
            context={teamsContext}
            userData={userData}
            enquiries={enquiries}
            onAllMattersFetched={handleAllMattersFetched}
            onOutstandingBalancesFetched={handleOutstandingBalancesFetched}
            onPOID6YearsFetched={handlePOID6YearsFetched}
            onTransactionsFetched={handleTransactionsFetched}
            onBoardroomBookingsFetched={handleBoardroomBookingsFetched}
            onSoundproofBookingsFetched={handleSoundproofBookingsFetched}
            teamData={teamData}
          />
        );
    }
  };

  if (!teamsContext || !userData || !enquiries || !matters) {
    return <div>Loading or Error...</div>;
  }

  return (
    <NavigatorProvider>
      <ThemeProvider isDarkMode={isDarkMode || false}>
        <div
          style={{
            backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
            minHeight: '100vh',
            transition: 'background-color 0.3s',
          }}
        >
          <CustomTabs
            selectedKey={activeTab}
            onLinkClick={(item) => setActiveTab(item?.props.itemKey || activeTab)}
            onHomeClick={() => setActiveTab('home')}
            tabs={tabs}
            ariaLabel="Main Navigation Tabs"
            user={userData[0]}
            onFormsClick={handleFormsTabClick}
            onResourcesClick={handleResourcesTabClick}
            hasActiveMatter={hasActiveMatter}
            isInMatterOpeningWorkflow={isInMatterOpeningWorkflow}
            isLocalDev={isLocalDev}
            onAreaChange={onAreaChange}
            teamData={teamData as any}
            onUserChange={onUserChange}
          />
          <Navigator />
          
          {/* Full-width Modal Overlays */}
          <FormsModal
            userData={userData}
            teamData={teamData}
            matters={matters || []}
            isOpen={isFormsModalOpen}
            onDismiss={closeFormsModal}
          />
          <ResourcesModal
            isOpen={isResourcesModalOpen}
            onDismiss={closeResourcesModal}
          />
          
          <Suspense fallback={<div>Loading...</div>}>
            {renderContent()}
          </Suspense>
        </div>
      </ThemeProvider>
    </NavigatorProvider>
  );
};

export default App;