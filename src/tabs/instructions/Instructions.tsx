import React, { useEffect, useState, useMemo, useRef, useLayoutEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import {
  Stack,
  mergeStyles,
  Pivot,
  PivotItem,
  Text,
  PrimaryButton,
  Dialog,
  DialogType,
  DialogFooter,
  DefaultButton,
  IconButton,
} from "@fluentui/react";
import {
  FaIdBadge,
  FaRegIdBadge,
  FaFileAlt,
  FaRegFileAlt,
  FaFolder,
  FaRegFolder,
  FaCheckCircle,
} from 'react-icons/fa';
import { MdOutlineArticle, MdArticle, MdOutlineWarning, MdWarning, MdAssessment, MdOutlineAssessment } from 'react-icons/md';
import { FaShieldAlt } from 'react-icons/fa';
import QuickActionsCard from "../home/QuickActionsCard"; // legacy, to be removed after full migration
import { useTheme } from "../../app/functionality/ThemeContext";
import { useNavigatorActions } from "../../app/functionality/NavigatorContext";
import { colours } from "../../app/styles/colours";
import { dashboardTokens } from "./componentTokens";
import DataFlowWorkbench from "../../components/DataFlowWorkbench";
import InstructionCard from "./InstructionCard";

import RiskComplianceCard from "./RiskComplianceCard";
import JointClientCard, { ClientInfo } from "./JointClientCard";
import DealCard from "./DealCard";
import type { DealSummary } from "./JointClientCard";
import { InstructionData, POID, TeamData, UserData, Matter } from "../../app/functionality/types";
import { hasActiveMatterOpening, clearMatterOpeningDraft } from "../../app/functionality/matterOpeningUtils";
import { isAdminUser } from "../../app/admin";
import FlatMatterOpening from "./MatterOpening/FlatMatterOpening";
import RiskAssessmentPage from "./RiskAssessmentPage";
import EIDCheckPage from "./EIDCheckPage";
import InstructionEditor from "./components/InstructionEditor";
import "../../app/styles/InstructionsBanner.css";
// invisible change 2.2
import DocumentEditorPage from "./DocumentEditorPage";
import DocumentsV3 from "./DocumentsV3";
import localUserData from "../../localData/localUserData.json";
import SegmentedControl from '../../components/filter/SegmentedControl';
import TwoLayerFilter, { TwoLayerFilterOption } from '../../components/filter/TwoLayerFilter';
import ToggleSwitch from '../../components/ToggleSwitch';
import InstructionApiDebugger from '../../components/InstructionApiDebugger';
import IDVerificationReviewModal from '../../components/modals/IDVerificationReviewModal';
import { fetchVerificationDetails, approveVerification } from '../../services/verificationAPI';

interface InstructionsProps {
  userInitials: string;
  instructionData: InstructionData[];
  setInstructionData: React.Dispatch<React.SetStateAction<InstructionData[]>>;
  allInstructionData?: InstructionData[]; // Admin: all users' instructions
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null;
  userData?: UserData[] | null;
  matters?: Matter[];
  hasActiveMatter?: boolean;
  setIsInMatterOpeningWorkflow?: (inWorkflow: boolean) => void;
  enquiries?: any[] | null;
}
const Instructions: React.FC<InstructionsProps> = ({
  userInitials,
  instructionData,
  setInstructionData,
  allInstructionData = [],
  poidData,
  setPoidData,
  teamData,
  userData,
  matters = [],
  hasActiveMatter = false,
  setIsInMatterOpeningWorkflow,
  enquiries = [],
}) => {
  const { isDarkMode } = useTheme();
  const { setContent } = useNavigatorActions();
  const [showNewMatterPage, setShowNewMatterPage] = useState<boolean>(false);
  const [showRiskPage, setShowRiskPage] = useState<boolean>(false);
  const [showEIDPage, setShowEIDPage] = useState<boolean>(false);
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<any | null>(
    null,
  );
  const [pendingInstructionRef, setPendingInstructionRef] = useState<string>('');
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [idVerificationLoading, setIdVerificationLoading] = useState<Set<string>>(new Set());
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewModalDetails, setReviewModalDetails] = useState<any>(null);
  const overviewGridRef = useRef<HTMLDivElement | null>(null);
  const [pendingInstruction, setPendingInstruction] = useState<any | null>(null);
  const [forceNewMatter, setForceNewMatter] = useState(false);
  const [showCclDraftPage, setShowCclDraftPage] = useState(false);

  // Flat tab navigation: default to Clients
  const [activeTab, setActiveTab] = useState<'pitches' | 'clients' | 'risk'>('pitches');
  
  // Unified enquiries data for name mapping (separate from main enquiries)
  const [unifiedEnquiries, setUnifiedEnquiries] = useState<any[]>([]);
  
  // Client name cache for performance optimization
  // Enhanced caching for client name resolution
  const clientNameCache = useMemo(() => {
    // Clear old cache on component mount to ensure fresh data after fixes
    localStorage.removeItem('clientNameCache');
    sessionStorage.removeItem('unifiedEnquiries');
    sessionStorage.removeItem('unifiedEnquiriesTime');
    
    return new Map<string, { firstName: string; lastName: string }>();
  }, []);

  // Save cache to localStorage whenever it changes
  const saveClientNameCache = useCallback((cache: Map<string, { firstName: string; lastName: string }>) => {
    try {
      localStorage.setItem('clientNameCache', JSON.stringify(Array.from(cache.entries())));
    } catch (error) {
      console.warn('Failed to save client name cache to localStorage');
    }
  }, []);

  /**
   * Fetch unified enquiries data for name mapping
   * This combines enquiries from both database sources directly
   */
  const fetchUnifiedEnquiries = async () => {
    try {
      console.log('🔗 Fetching unified enquiries for name mapping...');
      
      // Check if we already have cached data in sessionStorage
      const cached = sessionStorage.getItem('unifiedEnquiries');
      const cacheTime = sessionStorage.getItem('unifiedEnquiriesTime');
      const oneHour = 60 * 60 * 1000; // Extended to 1 hour for better performance
      
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < oneHour)) {
        console.log('📦 Using cached unified enquiries data');
        const cachedData = JSON.parse(cached);
        setUnifiedEnquiries(cachedData);
        return;
      }
      
      // Try the server route directly
      try {
        const response = await fetch('http://localhost:8080/api/enquiries-unified');
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Fetched ${data.count} unified enquiries from both databases`);
          console.log('🔍 Sample unified enquiries data:', data.enquiries?.slice(0, 3));
          console.log('🔍 Looking for prospect 27671:', data.enquiries?.find((e: any) => 
            e.ID === '27671' || e.id === '27671' || e.acid === '27671' || e.card_id === '27671'
          ));
          const enquiries = data.enquiries || [];
          setUnifiedEnquiries(enquiries);
          
          // Cache the results
          sessionStorage.setItem('unifiedEnquiries', JSON.stringify(enquiries));
          sessionStorage.setItem('unifiedEnquiriesTime', Date.now().toString());
          return;
        } else {
          console.log(`❌ Unified route failed with status: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.log(`❌ Error details:`, errorText);
        }
      } catch (err) {
        console.log('📝 Unified route not available yet, falling back to direct queries...', err);
      }

      // Fallback: Fetch from both sources directly
      const [mainEnquiries, instructionsData] = await Promise.all([
        // Main enquiries (helix-core-data via SQL)
        fetch('/api/enquiries').then(res => res.ok ? res.json() : { enquiries: [] }),
        // Instructions data (already has ProspectId info)
        fetch('/api/instructions').then(res => res.ok ? res.json() : { instructions: [] })
      ]);

      console.log(`📊 Fallback data: ${mainEnquiries.enquiries?.length || 0} main enquiries, ${instructionsData.instructions?.length || 0} instructions`);

      // Combine data sources for name mapping
      const combinedEnquiries = [
        ...(mainEnquiries.enquiries || []),
        // Extract prospect info from instructions - check both deal and instruction level
        ...(instructionsData.instructions || []).map((inst: any) => {
          // Try to get ProspectId from deal first, then instruction level
          const prospectId = inst.deal?.ProspectId || inst.ProspectId;
          const firstName = inst.FirstName || inst.deal?.FirstName || '';
          const lastName = inst.LastName || inst.deal?.LastName || '';
          const email = inst.Email || inst.deal?.LeadClientEmail || '';
          
          return {
            acid: prospectId,
            first: firstName,
            last: lastName,
            email: email,
            db_source: 'instructions'
          };
        }).filter((item: any) => item.acid && (item.first || item.last))
      ];

      console.log(`✅ Combined ${combinedEnquiries.length} enquiries for name mapping (${mainEnquiries.enquiries?.length || 0} from main + ${instructionsData.instructions?.filter((i: any) => i.deal?.ProspectId || i.ProspectId).length || 0} from instructions)`);
      
      setUnifiedEnquiries(combinedEnquiries);
      
      // Cache the fallback results too
      sessionStorage.setItem('unifiedEnquiries', JSON.stringify(combinedEnquiries));
      sessionStorage.setItem('unifiedEnquiriesTime', Date.now().toString());
      
    } catch (error) {
      console.error('❌ Error fetching unified enquiries:', error);
      setUnifiedEnquiries([]);
    }
  };

  /**
   * Lookup client name by ProspectId (which matches ACID in enquiries data)
   * @param prospectId The ProspectId value to search for
   * @returns Object with firstName and lastName, or empty strings if not found
   */
  const getClientNameByProspectId = useCallback((prospectId: string | number | undefined): { firstName: string; lastName: string } => {
    if (!prospectId) {
      return { firstName: '', lastName: '' };
    }

    // Fast path: Check cache first for immediate response
    const cached = clientNameCache.get(prospectId.toString());
    if (cached) {
      return cached;
    }

    // If unified enquiries not loaded yet, try to find name in current instruction data
    if (!unifiedEnquiries || unifiedEnquiries.length === 0) {
      // Look for the name in the current instruction being displayed
      const currentInstructionData = effectiveInstructionData || [];
      const matchingInstruction = currentInstructionData.find((inst: any) => {
        const instrProspectId = inst.deal?.ProspectId || inst.ProspectId;
        return instrProspectId?.toString() === prospectId.toString();
      });
      
      if (matchingInstruction) {
        // Cast to any since instruction data can have various dynamic properties
        const inst = matchingInstruction as any;
        const firstName = inst.FirstName || inst.Name?.split(' ')[0] || '';
        const lastName = inst.LastName || inst.Name?.split(' ')[1] || '';
        if (firstName || lastName) {
          const result = { firstName, lastName };
          // Cache this result in memory and localStorage
          clientNameCache.set(prospectId.toString(), result);
          saveClientNameCache(clientNameCache);
          return result;
        }
      }
      
      return { firstName: '', lastName: '' };
    }

    // Convert prospectId to string for comparison and caching
    const prospectIdStr = String(prospectId);
    
    // Check cache first
    if (clientNameCache.has(prospectIdStr)) {
      const cached = clientNameCache.get(prospectIdStr);
      if (cached) {
        return cached;
      }
    }

    const enquiry = unifiedEnquiries.find((enq: any) => {
      const enqId = enq.ID || enq.id || enq.acid || enq.ACID || enq.Acid;
      const match = String(enqId) === prospectIdStr;
      
      if (match && prospectIdStr === '27671') {
        console.log('🎯 Found match for 27671:', enq);
      }
      return match;
    });

    if (prospectIdStr === '27671') {
      console.log('🔍 Searching for 27671 in', unifiedEnquiries.length, 'enquiries');
      console.log('🔍 Found enquiry for 27671:', enquiry);
    }

    const result = enquiry ? {
      firstName: enquiry.First_Name || enquiry.first || enquiry.First || enquiry.firstName || enquiry.FirstName || '',
      lastName: enquiry.Last_Name || enquiry.last || enquiry.Last || enquiry.lastName || enquiry.LastName || ''
    } : { firstName: '', lastName: '' };
    
    // Cache the result in both memory and localStorage
    clientNameCache.set(prospectIdStr, result);
    saveClientNameCache(clientNameCache);
    return result;
  }, [unifiedEnquiries, clientNameCache, saveClientNameCache]);

  const handleRiskAssessmentSave = (risk: any) => {
    setInstructionData(prev =>
      prev.map(prospect => {
        const updatedProspect = { ...prospect } as any;
        const riskKey = updatedProspect.riskAssessments
          ? 'riskAssessments'
          : updatedProspect.compliance
          ? 'compliance'
          : 'riskAssessments';

        updatedProspect[riskKey] = Array.isArray(updatedProspect[riskKey])
          ? updatedProspect[riskKey].filter((r: any) => r.InstructionRef !== risk.InstructionRef)
          : [];
        updatedProspect[riskKey].push(risk);

        updatedProspect.instructions = (updatedProspect.instructions || []).map((inst: any) => {
          if (inst.InstructionRef === risk.InstructionRef) {
            const instRiskKey = inst.riskAssessments
              ? 'riskAssessments'
              : inst.compliance
              ? 'compliance'
              : 'riskAssessments';
            inst[instRiskKey] = Array.isArray(inst[instRiskKey])
              ? inst[instRiskKey].filter((r: any) => r.InstructionRef !== risk.InstructionRef)
              : [];
            inst[instRiskKey].push(risk);
          }
          return inst;
        });
        return updatedProspect;
      }),
    );

    setSelectedInstruction((prev: any) => {
      if (!prev || prev.InstructionRef !== risk.InstructionRef) return prev;
      const instRiskKey = prev.riskAssessments
        ? 'riskAssessments'
        : prev.compliance
        ? 'compliance'
        : 'riskAssessments';
      const arr = Array.isArray(prev[instRiskKey])
        ? prev[instRiskKey].filter((r: any) => r.InstructionRef !== risk.InstructionRef)
        : [];
      arr.push(risk);
      return { ...prev, [instRiskKey]: arr } as any;
    });

    setSelectedRisk(risk);
  };

  // Notify parent when matter opening workflow state changes
  useEffect(() => {
    if (setIsInMatterOpeningWorkflow) {
      setIsInMatterOpeningWorkflow(showNewMatterPage);
    }
  }, [showNewMatterPage, setIsInMatterOpeningWorkflow]);

  // Check for navigation trigger from Home component
  useEffect(() => {
    const shouldOpenMatterOpening = localStorage.getItem('openMatterOpening');
    if (shouldOpenMatterOpening === 'true') {
      // Clear the flag
      localStorage.removeItem('openMatterOpening');
      // Open matter opening if not already open
      if (!showNewMatterPage) {
        setShowNewMatterPage(true);
        // Scroll to top when opening matter page from navigation
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, []); // Only run on mount
  
  // Filter states
  const [clientsActionFilter, setClientsActionFilter] = useState<'All' | 'Verify ID' | 'Assess Risk' | 'Open Matter' | 'Draft CCL' | 'Complete'>('All');
  const [pitchesStatusFilter, setPitchesStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [riskStatusFilter, setRiskStatusFilter] = useState<'All' | 'Outstanding' | 'Completed'>('All');
  
  // Unified secondary filter state - tracks the secondary filter value for each tab
  const [secondaryFilter, setSecondaryFilter] = useState<string>(() => {
    switch (activeTab) {
      case 'clients': return clientsActionFilter;
      case 'pitches': return pitchesStatusFilter;
      case 'risk': return riskStatusFilter;
      default: return 'All';
    }
  });
  
  const [showApiDebugger, setShowApiDebugger] = useState(false);
  const [riskFilterRef, setRiskFilterRef] = useState<string | null>(null);
  const [showAllInstructions, setShowAllInstructions] = useState<boolean>(false); // Admin toggle - defaults to false (show user's own data first)
  
  // Debug toggles for admin/localhost
  const [useNewData, setUseNewData] = useState<boolean>(false);
  const [twoColumn, setTwoColumn] = useState<boolean>(false);
  const [showWorkbench, setShowWorkbench] = useState<boolean>(false);
  
  const currentUser: UserData | undefined = userData?.[0] || (localUserData as UserData[])[0];
  // Admin detection using proper utility
  const isAdmin = isAdminUser(userData?.[0] || null);
  const isLocalhost = (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // State for showing only user's own pitches/deals (defaults to true for non-admin users)
  const [showOnlyMyDeals, setShowOnlyMyDeals] = useState<boolean>(!isAdmin);

  // Update showOnlyMyDeals when user changes (for user switching)
  useEffect(() => {
    // For non-admin users, always show only their deals
    // For admin users, keep current state or default to false (show everyone's)
    if (!isAdmin) {
      setShowOnlyMyDeals(true);
    }
  }, [isAdmin, currentUser?.Email]);

  // Reset admin toggle when user changes to ensure proper initial state
  useEffect(() => {
    // Reset to show user's own data when switching users
    setShowAllInstructions(false);
  }, [currentUser?.Email]);

  // Fetch unified enquiries data for name mapping on component load
  useEffect(() => {
    fetchUnifiedEnquiries();
  }, []);
  
  // Window resize effect for responsive filters
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get effective instruction data based on admin mode and user filtering
  const effectiveInstructionData = useMemo(() => {
    console.log('🔄 effectiveInstructionData calculation:', {
      isAdmin,
      showAllInstructions,
      instructionDataLength: instructionData.length,
      allInstructionDataLength: allInstructionData.length,
      currentUserEmail: currentUser?.Email,
      currentUserInitials: currentUser?.Initials
    });
    
    let result = instructionData;
    
    // If admin and wants to see all data, use allInstructionData (unfiltered)
    if (isAdmin && showAllInstructions && allInstructionData.length > 0) {
      result = allInstructionData;
      console.log('🔄 Admin viewing ALL instructions');
    } else {
      // Default: Filter to show only current user's instructions (for both admin and non-admin)
      // If instructionData is empty but allInstructionData has data, filter from allInstructionData
      const sourceData = instructionData.length > 0 ? instructionData : allInstructionData;
      
      if (currentUser && currentUser.Email && sourceData.length > 0) {
        result = sourceData.filter((instruction: any) => {
          // Check multiple fields that might contain user email/initials
          const userEmail = currentUser.Email!.toLowerCase();
          const userInitials = currentUser.Initials?.toUpperCase();
          
          // Log the first few items to see the data structure
          if (sourceData.indexOf(instruction) < 3) {
            console.log('🔍 Sample instruction structure:', {
              prospectId: instruction.prospectId,
              Email: instruction.Email,
              Lead: instruction.Lead,
              assignedTo: instruction.assignedTo,
              poc: instruction.poc,
              POC: instruction.POC,
              deals: instruction.deals?.map((d: any) => ({
                DealId: d.DealId,
                PitchedBy: d.PitchedBy,
                Status: d.Status,
                Email: d.Email,
                Lead: d.Lead,
                assignedTo: d.assignedTo,
                poc: d.poc
              })),
              instructions: instruction.instructions?.map((i: any) => ({
                InstructionRef: i.InstructionRef,
                HelixContact: i.HelixContact
              }))
            });
          }
          
          // Check if this instruction belongs to the current user
          const belongsToUser = (
            // Check deals array for PitchedBy field (this is the key field for deal ownership)
            instruction.deals?.some((deal: any) => 
              deal.PitchedBy?.toUpperCase() === userInitials
            ) ||
            // Check instructions array for HelixContact field (this is the key field for instruction ownership)
            instruction.instructions?.some((inst: any) =>
              inst.HelixContact?.toUpperCase() === userInitials
            ) ||
            // Fallback checks for legacy data structure
            instruction.Email?.toLowerCase() === userEmail ||
            instruction.Lead?.toLowerCase() === userEmail ||
            instruction.assignedTo?.toLowerCase() === userEmail ||
            instruction.poc?.toLowerCase() === userEmail ||
            instruction.POC?.toUpperCase() === userInitials ||
            instruction.deal?.Email?.toLowerCase() === userEmail ||
            instruction.deal?.Lead?.toLowerCase() === userEmail ||
            instruction.deal?.assignedTo?.toLowerCase() === userEmail ||
            instruction.deal?.poc?.toLowerCase() === userEmail ||
            instruction.deal?.PitchedBy?.toUpperCase() === userInitials ||
            // Check deals array for other fields as fallback
            instruction.deals?.some((deal: any) => 
              deal.Email?.toLowerCase() === userEmail ||
              deal.Lead?.toLowerCase() === userEmail ||
              deal.assignedTo?.toLowerCase() === userEmail ||
              deal.poc?.toLowerCase() === userEmail
            )
          );
          
          if (belongsToUser) {
            console.log('✅ Instruction belongs to user:', {
              prospectId: instruction.prospectId,
              userEmail,
              userInitials,
              matchedFields: {
                instruction_Email: instruction.Email?.toLowerCase() === userEmail,
                instruction_poc: instruction.poc?.toLowerCase() === userEmail,
                deal_Email: instruction.deal?.Email?.toLowerCase() === userEmail,
                deal_poc: instruction.deal?.poc?.toLowerCase() === userEmail,
                deals_any: instruction.deals?.some((d: any) => d.poc?.toLowerCase() === userEmail)
              }
            });
          }
          
          return belongsToUser;
        });
        console.log('🔄 Filtered to user instructions:', {
          sourceData: sourceData.length > 0 ? 'instructionData' : 'allInstructionData',
          sourceLength: sourceData.length,
          filteredLength: result.length
        });
      } else {
        result = sourceData;
      }
      console.log(`🔄 ${isAdmin ? 'Admin' : 'User'} viewing OWN instructions (filtered)`);
    }
    
    console.log('🔄 effectiveInstructionData updated:', {
      isAdmin,
      showAllInstructions,
      currentUserEmail: currentUser?.Email,
      currentUserInitials: currentUser?.Initials,
      allInstructionDataLength: allInstructionData.length,
      instructionDataLength: instructionData.length,
      resultLength: result.length,
      usingAllData: isAdmin && showAllInstructions && allInstructionData.length > 0,
      filteringByUser: !isAdmin || !showAllInstructions,
      sampleFilteredItems: result.slice(0, 2).map(r => ({
        prospectId: r.prospectId,
        hasInstructions: r.instructions?.length || 0,
        hasDeals: r.deals?.length || 0,
        deals: r.deals?.map((d: any) => ({ 
          DealId: d.DealId, 
          InstructionRef: d.InstructionRef,
          Email: d.Email, 
          Lead: d.Lead, 
          assignedTo: d.assignedTo,
          Status: d.Status
        })),
        instructions: r.instructions?.map((i: any) => ({
          InstructionRef: i.InstructionRef
        }))
      }))
    });
    
    return result;
  }, [isAdmin, showAllInstructions, allInstructionData, instructionData, currentUser]);

  // Calculate toggle counts based on active tab and current data
  const toggleCounts = useMemo(() => {
    if (activeTab === 'pitches') {
      // For Pitches tab: count deals that don't have instructions yet
      const myPitchesCount = effectiveInstructionData.reduce((count, prospect) => {
        const pitchedDeals = prospect.deals?.filter((deal: any) => 
          !prospect.instructions?.some((inst: any) => inst.InstructionRef === deal.InstructionRef)
        ) || [];
        return count + pitchedDeals.length;
      }, 0);
      
      const allPitchesCount = allInstructionData.reduce((count, prospect) => {
        const pitchedDeals = prospect.deals?.filter((deal: any) => 
          !prospect.instructions?.some((inst: any) => inst.InstructionRef === deal.InstructionRef)
        ) || [];
        return count + pitchedDeals.length;
      }, 0);
      
      return {
        mine: myPitchesCount,
        all: allPitchesCount,
        label: 'pitches'
      };
    } else {
      // For Instructions tab: count actual instructions
      const myInstructionsCount = effectiveInstructionData.reduce((count, prospect) => {
        return count + (prospect.instructions?.length || 0);
      }, 0);
      
      const allInstructionsCount = allInstructionData.reduce((count, prospect) => {
        return count + (prospect.instructions?.length || 0);
      }, 0);
      
      return {
        mine: myInstructionsCount,
        all: allInstructionsCount,
        label: 'instructions'
      };
    }
  }, [activeTab, effectiveInstructionData, allInstructionData]);
  
  const showDraftPivot = true; // Allow all users to see Document editor

  // Unified filter configuration
  const filterOptions: TwoLayerFilterOption[] = [
    {
      key: 'pitches',
      label: 'Pitches',
      subOptions: [
        { key: 'All', label: 'All' },
        { key: 'Open', label: 'Open' },
        { key: 'Closed', label: 'Closed' }
      ]
    },
    {
      key: 'clients',
      label: 'Clients',
      subOptions: [
        { key: 'All', label: 'All' },
        { key: 'Initialised', label: 'Initialised' },
        { key: 'Instructed', label: 'Instructed' },
        { key: 'Pending ID', label: 'Pending ID' },
        { key: 'Pending Payment', label: 'Pending Payment' },
        { key: 'Pending Documents', label: 'Pending Documents' },
        { key: 'Paid', label: 'Paid' },
        { key: 'Complete', label: 'Complete' }
      ]
    },
    {
      key: 'risk',
      label: 'Risk',
      subOptions: [
        { key: 'All', label: 'All' },
        { key: 'Outstanding', label: 'Outstanding' },
        { key: 'Completed', label: 'Completed' }
      ]
    }
  ];

  // Unified filter handlers
  const handlePrimaryFilterChange = (key: string) => {
    setActiveTab(key as 'pitches' | 'clients' | 'risk');
    // Reset secondary filter to the default for the new tab
    switch (key) {
      case 'clients':
        setSecondaryFilter(clientsActionFilter);
        break;
      case 'pitches':
        setSecondaryFilter(pitchesStatusFilter);
        break;
      case 'risk':
        setSecondaryFilter(riskStatusFilter);
        break;
    }
  };

  const handleSecondaryFilterChange = (key: string) => {
    setSecondaryFilter(key);
    // Update the appropriate individual filter state
    switch (activeTab) {
      case 'clients':
        setClientsActionFilter(key as any);
        break;
      case 'pitches':
        setPitchesStatusFilter(key as any);
        break;
      case 'risk':
        setRiskStatusFilter(key as any);
        break;
    }
  };

  // Sync secondary filter when tab changes
  React.useEffect(() => {
    switch (activeTab) {
      case 'clients':
        setSecondaryFilter(clientsActionFilter);
        break;
      case 'pitches':
        setSecondaryFilter(pitchesStatusFilter);
        break;
      case 'risk':
        setSecondaryFilter(riskStatusFilter);
        break;
    }
  }, [activeTab, clientsActionFilter, pitchesStatusFilter, riskStatusFilter, isAdmin, secondaryFilter]);

  // Clear selection when leaving overview tab
  // Clear selection when leaving clients tab
  useEffect(() => {
    if (activeTab !== "clients") {
      setSelectedInstruction(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "risk") {
      setRiskFilterRef(null);
    }
  }, [activeTab]);

  const ACTION_BAR_HEIGHT = 48;

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      boxShadow: dark
        ? "0 2px 6px rgba(0,0,0,0.5)"
        : "0 2px 6px rgba(0,0,0,0.12)",
      padding: "10px 24px 12px 24px", // Taller bar like Enquiries
      transition: "background-color 0.3s",
      display: "flex",
      flexDirection: "row",
      gap: "8px",
      overflowX: "auto",
      msOverflowStyle: "none",
      scrollbarWidth: "none",
      alignItems: "center",
      position: "sticky",
      top: ACTION_BAR_HEIGHT,
      zIndex: 999,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      selectors: {
        '::-webkit-scrollbar': {
          display: 'none',
        },
        '@media (max-width: 768px)': {
          flexWrap: 'wrap',
          padding: '10px 16px 12px 16px',
        }
      },
    });

  const detailNavStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      boxShadow: dark
        ? "0 2px 6px rgba(0,0,0,0.5)"
        : "0 2px 6px rgba(0,0,0,0.12)",
      borderTop: dark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.05)",
      padding: "10px 24px 12px 24px", // Match taller style
      display: "flex",
      flexDirection: "row",
      gap: "8px",
      alignItems: "center",
      position: "sticky",
      top: ACTION_BAR_HEIGHT,
      zIndex: 999,
    });

  const pivotBarStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      boxShadow: dark
        ? "0 2px 4px rgba(0,0,0,0.4)"
        : "0 2px 4px rgba(0,0,0,0.1)",
      borderTop: dark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.05)",
      padding: "0 24px",
      transition: "background-color 0.3s",
      position: "sticky",
      top: ACTION_BAR_HEIGHT * 2,
      zIndex: 998,
      // Responsive padding
      '@media (max-width: 768px)': {
        padding: "0 16px",
      },
      '@media (max-width: 480px)': {
        padding: "0 12px",
      },
    });

  const useLocalData =
    process.env.REACT_APP_USE_LOCAL_DATA === "true" ||
    window.location.hostname === "localhost";

  const isProduction = process.env.NODE_ENV === "production" && !useLocalData;

  const handleBack = () => {
    if (showNewMatterPage) {
      setShowNewMatterPage(false);
      setSelectedInstruction(null);
      setPendingInstructionRef('');
      setForceNewMatter(false);
    } else if (showRiskPage) {
      setShowRiskPage(false);
      setSelectedRisk(null);
    } else if (showEIDPage) {
      setShowEIDPage(false);
    }
  };

  useEffect(() => {
    setContent(
      <>
        {showNewMatterPage || showRiskPage || showEIDPage ? (
          <div className={detailNavStyle(isDarkMode)}>
            <div 
              className="nav-back-button"
              onClick={handleBack}
              style={{
                background: isDarkMode ? colours.dark.sectionBackground : "#f3f3f3",
                border: '1px solid #e1dfdd',
                borderRadius: '0',
                width: '32px',
                height: '32px',
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
              title="Back"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleBack();
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
                Back
              </span>
            </div>
            
            <style>{`
              .nav-back-button:hover .back-text {
                opacity: 1 !important;
              }
              .nav-back-button:hover svg {
                opacity: 0 !important;
              }
            `}</style>
          </div>
        ) : riskFilterRef ? (
          <div className={detailNavStyle(isDarkMode)}>
            <div 
              className="nav-back-button"
              onClick={() => setRiskFilterRef(null)}
              style={{
                background: isDarkMode ? colours.dark.sectionBackground : "#f3f3f3",
                border: '1px solid #e1dfdd',
                borderRadius: '0',
                width: '32px',
                height: '32px',
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
                e.currentTarget.style.width = '150px';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(54,144,206,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? colours.dark.sectionBackground : "#f3f3f3";
                e.currentTarget.style.border = '1px solid #e1dfdd';
                e.currentTarget.style.width = '32px';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
              }}
              title="Back to Risk & Compliance"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setRiskFilterRef(null);
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
                Back to Risk & Compliance
              </span>
            </div>
            
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: isDarkMode ? colours.dark.text : colours.light.text,
              marginLeft: '8px'
            }}>
              Risk & Compliance: {riskFilterRef}
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
        ) : (
          <>
            {/* Quick Actions Bar with Unified Two-Layer Filter */}
            <div className={quickLinksStyle(isDarkMode)}>
              <div style={{ 
                display:'flex', 
                alignItems:'center', 
                gap: windowWidth < 768 ? 12 : 24, 
                width:'100%',
                flexWrap: 'wrap',
                minWidth: 0, // Allow shrinking
                justifyContent: windowWidth < 768 ? 'center' : 'flex-start'
              }}>
                <div style={{
                  minWidth: windowWidth < 768 ? '100%' : 'auto',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}>
                  <TwoLayerFilter
                    id="instructions-unified-filter"
                    ariaLabel="Instructions navigation and filtering"
                    primaryValue={activeTab}
                    secondaryValue={secondaryFilter}
                    onPrimaryChange={handlePrimaryFilterChange}
                    onSecondaryChange={handleSecondaryFilterChange}
                    options={filterOptions}
                    style={{
                      fontSize: windowWidth < 768 ? '10px' : '11px',
                      transform: windowWidth < 768 ? 'scale(0.9)' : 'none',
                      transformOrigin: 'left center'
                    }}
                  />
                </div>
                {/* Spacer - only on larger screens */}
                <div style={{ 
                  flex: 1,
                  minWidth: '20px' // Ensure minimum spacing
                }} />
                {/* Admin controls (debug) for admin or localhost */}
                {(isAdmin || isLocalhost) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '2px 10px 2px 6px',
                      height: 40,
                      borderRadius: 12,
                      background: isDarkMode ? '#5a4a12' : colours.highlightYellow,
                      border: isDarkMode ? '1px solid #806c1d' : '1px solid #e2c56a',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: isDarkMode ? '#ffe9a3' : '#5d4700',
                      flexShrink: 0,
                      minWidth: 'max-content' // Prevent admin controls from shrinking too much
                    }}
                    title="Admin / debug controls"
                  >
                    <IconButton
                      iconProps={{ iconName: 'Flow', style: { fontSize: 16 } }}
                      title="Data flow workbench"
                      ariaLabel="Open data flow workbench"
                      onClick={() => setShowWorkbench(true)}
                      styles={{ root: { borderRadius: 8, background: 'rgba(0,0,0,0.08)', height: 30, width: 30 } }}
                    />
                    <IconButton
                      iconProps={{ iconName: 'TestBeaker', style: { fontSize: 16 } }}
                      title="Debug API calls"
                      ariaLabel="Open data inspector"
                      onClick={() => setShowApiDebugger(v => !v)}
                      styles={{ root: { borderRadius: 8, background: 'rgba(0,0,0,0.08)', height: 30, width: 30 } }}
                    />
                    <ToggleSwitch
                      id="instructions-new-data-toggle"
                      checked={useNewData}
                      onChange={setUseNewData}
                      size="sm"
                      onText="New"
                      offText="Legacy"
                      ariaLabel="Toggle dataset between legacy and new"
                    />
                    <ToggleSwitch
                      id="instructions-two-column-toggle"
                      checked={twoColumn}
                      onChange={setTwoColumn}
                      size="sm"
                      onText="2-col"
                      offText="1-col"
                      ariaLabel="Toggle two column layout"
                    />
                    {isAdmin && (
                      <ToggleSwitch
                        id="instructions-all-users-toggle"
                        checked={showAllInstructions}
                        onChange={setShowAllInstructions}
                        size="sm"
                        onText={`All (${toggleCounts.all})`}
                        offText={`Mine (${toggleCounts.mine})`}
                        ariaLabel={`Toggle between my ${toggleCounts.label} and all ${toggleCounts.label}`}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </>,
    );
    return () => setContent(null);
  }, [
    setContent,
    isDarkMode,
    effectiveInstructionData,
    activeTab,
    showNewMatterPage,
    showRiskPage,
    showEIDPage,
    selectedInstruction,
    hasActiveMatter,
    riskFilterRef,
    clientsActionFilter,
    riskStatusFilter,
    secondaryFilter,
    showApiDebugger,
  ]);

  const containerStyle = mergeStyles({
    backgroundColor: isDarkMode
      ? colours.dark.background
      : colours.light.background,
    minHeight: "100vh",
    boxSizing: "border-box",
    color: isDarkMode ? colours.light.text : colours.dark.text,
  });

  const newMatterContainerStyle = mergeStyles(containerStyle, {
    padding: "12px",
  });

  const sectionContainerStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: "16px",
      paddingBottom: activeTab === "clients" ? "120px" : "16px", // Add bottom padding for global action area
      borderRadius: 0,
      boxShadow: dark
        ? `0 4px 12px ${colours.dark.border}`
        : `0 4px 12px ${colours.light.border}`,
      width: "100%",
      // Responsive padding
      '@media (max-width: 768px)': {
        padding: "12px",
        paddingBottom: activeTab === "clients" ? "100px" : "12px",
      },
      '@media (max-width: 480px)': {
        padding: "8px",
        paddingBottom: activeTab === "clients" ? "80px" : "8px",
      },
    });

  const overviewItems = useMemo(() => {
    const items = effectiveInstructionData.flatMap((prospect) => {
      const instructionItems = (prospect.instructions ?? []).map((inst) => {
        const dealsForInst = (prospect.deals ?? []).filter(
          (d) => d.InstructionRef === inst.InstructionRef,
        );
        const clientsForInst: ClientInfo[] = [];
        const prospectClients = [
          ...(prospect.jointClients ?? prospect.joinedClients ?? []),
          ...dealsForInst.flatMap((d) => d.jointClients ?? []),
        ];
        prospectClients.forEach((jc) => {
          if (dealsForInst.some((d) => d.DealId === jc.DealId)) {
            clientsForInst.push({
              ClientEmail: jc.ClientEmail,
              HasSubmitted: jc.HasSubmitted,
              Lead: false,
              deals: [
                {
                  DealId: jc.DealId,
                  InstructionRef: inst.InstructionRef,
                  ServiceDescription: dealsForInst.find(
                    (d) => d.DealId === jc.DealId,
                  )?.ServiceDescription,
                  Status: dealsForInst.find((d) => d.DealId === jc.DealId)?.Status,
                },
              ],
            });
          }
        });
        dealsForInst.forEach((d) => {
          if (d.LeadClientEmail) {
            clientsForInst.push({
              ClientEmail: d.LeadClientEmail,
              Lead: true,
              deals: [
                {
                  DealId: d.DealId,
                  InstructionRef: d.InstructionRef,
                  ServiceDescription: d.ServiceDescription,
                  Status: d.Status,
                },
              ],
            });
          }
        });
        const deal = dealsForInst[0];

        const riskSource = [
          ...(prospect.riskAssessments ?? prospect.compliance ?? []),
          ...((inst as any).riskAssessments ?? (inst as any).compliance ?? []),
        ];
        dealsForInst.forEach((d) => {
          if (d.instruction) {
            riskSource.push(...(d.instruction.riskAssessments ?? []));
            riskSource.push(...(d.instruction.compliance ?? []));
          }
        });
        const eidSource = [
          ...(prospect.electronicIDChecks ?? []),
          ...(prospect.idVerifications ?? []),
          ...((inst as any).electronicIDChecks ?? []),
          ...((inst as any).idVerifications ?? []),
          ...dealsForInst.flatMap((d) => [
            ...(d.instruction?.electronicIDChecks ?? []),
            ...(d.instruction?.idVerifications ?? []),
          ]),
        ];
        const risk = riskSource.find((r) => r.MatterId === inst.InstructionRef);
        const eids = eidSource.filter(
          (e) => (e.MatterId ?? e.InstructionRef) === inst.InstructionRef,
        );
        const eid = eids[0];
        const rawDocs = [
          ...(prospect.documents ?? []),
          ...((inst as any).documents ?? []),
          ...dealsForInst.flatMap((d) => [
            ...(d.documents ?? []),
            ...(d.instruction?.documents ?? []),
          ]),
        ];
        const docsMap: Record<string, any> = {};
        rawDocs.forEach((doc) => {
          const key =
            doc.DocumentId !== undefined
              ? String(doc.DocumentId)
              : `${doc.FileName ?? ''}-${doc.UploadedAt ?? ''}`;
          if (!docsMap[key]) {
            docsMap[key] = doc;
          }
        });
        const docs = Object.values(docsMap);
        return {
          instruction: inst,
          deal,
          deals: dealsForInst,
          clients: clientsForInst,
          risk,
          eid,
          eids,
          documents: docs,
          prospectId: deal?.ProspectId || inst?.ProspectId || prospect.prospectId,
          documentCount: docs ? docs.length : 0,
        };
      });

      // Also process standalone deals that don't have instructions yet (Pitched stage)
      const standaloneDeals = (prospect.deals ?? []).filter(
        (deal) => !deal.InstructionRef || 
        !(prospect.instructions ?? []).some(inst => inst.InstructionRef === deal.InstructionRef)
      ).map((deal) => {
        const clientsForDeal: ClientInfo[] = [];
        const dealClients = [
          ...(prospect.jointClients ?? prospect.joinedClients ?? []),
          ...(deal.jointClients ?? []),
        ];
        
        dealClients.forEach((jc) => {
          if (jc.DealId === deal.DealId) {
            clientsForDeal.push({
              ClientEmail: jc.ClientEmail,
              HasSubmitted: jc.HasSubmitted,
              Lead: false,
              deals: [{
                DealId: deal.DealId,
                InstructionRef: deal.InstructionRef,
                ServiceDescription: deal.ServiceDescription,
                Status: deal.Status,
              }],
            });
          }
        });
        
        if (deal.LeadClientEmail) {
          clientsForDeal.push({
            ClientEmail: deal.LeadClientEmail,
            Lead: true,
            deals: [{
              DealId: deal.DealId,
              InstructionRef: deal.InstructionRef,
              ServiceDescription: deal.ServiceDescription,
              Status: deal.Status,
            }],
          });
        }

        return {
          instruction: null, // No instruction yet for pitched deals
          deal,
          deals: [deal],
          clients: clientsForDeal,
          risk: null,
          eid: null,
          eids: [],
          documents: deal.documents ?? [],
          prospectId: deal.ProspectId || prospect.prospectId,
          documentCount: deal.documents?.length ?? 0,
        };
      });

      return [...instructionItems, ...standaloneDeals];
    });

    const unique: Record<string, typeof items[number]> = {};
    items.forEach((item) => {
      const ref = item.instruction?.InstructionRef as string | undefined;
      const dealId = item.deal?.DealId as string | undefined;
      
      // Use InstructionRef if available, otherwise use DealId for standalone deals
      const key = ref || (dealId ? `deal-${dealId}` : null);
      
      if (key && !unique[key]) {
        unique[key] = item;
      }
    });
    return Object.values(unique);
  }, [effectiveInstructionData, enquiries]);

  // Debug logging for input data
  React.useEffect(() => {
    console.log('Debug - effectiveInstructionData:', effectiveInstructionData.length, 'prospects');
    const allDeals = effectiveInstructionData.flatMap(p => p.deals ?? []);
    console.log('Debug - Total deals in data:', allDeals.length);
    console.log('Debug - Sample deals:', allDeals.slice(0, 3).map(d => ({
      dealId: d.DealId,
      instructionRef: d.InstructionRef,
      status: d.Status,
      acid: d.ACID || d.acid || d.Acid
    })));
  }, [effectiveInstructionData]);

  // Debug logging for pitches
  React.useEffect(() => {
    const pitchedItems = overviewItems.filter(item => !item.instruction && item.deal);
    console.log('Debug - Total overview items:', overviewItems.length);
    console.log('Debug - Pitched deals (no instruction):', pitchedItems.length);
    console.log('Debug - Pitched deals details:', pitchedItems.map(item => ({
      dealId: item.deal?.DealId,
      status: item.deal?.Status,
      acid: item.deal?.ACID || item.deal?.acid || item.deal?.Acid,
      firstName: item.deal?.firstName,
      lastName: item.deal?.lastName,
      prospectId: item.prospectId
    })));
  }, [overviewItems]);

  const selectedOverviewItem = useMemo(
    () =>
      selectedInstruction
        ? overviewItems.find(
            (item) =>
              item.instruction?.InstructionRef ===
              selectedInstruction.InstructionRef,
          ) || null
        : null,
    [selectedInstruction, overviewItems],
  );

  const poidResult =
    selectedOverviewItem?.eid?.EIDOverallResult?.toLowerCase() ?? "";
  const eidStatus = selectedOverviewItem?.eid?.EIDStatus?.toLowerCase() ?? "";
  const poidPassed = poidResult === "passed" || poidResult === "approved";
  const verificationFound = !!selectedOverviewItem?.eid;
  
  // Match InstructionCard logic for verification status
  let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
  const proofOfIdComplete = Boolean(
    selectedInstruction?.PassportNumber || selectedInstruction?.DriversLicenseNumber
  );
  
  if (!selectedOverviewItem?.eid || eidStatus === 'pending') {
    verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
  } else if (poidPassed) {
    verifyIdStatus = 'complete';
  } else {
    verifyIdStatus = 'review';
  }
  
  const verifyButtonReview = verifyIdStatus === 'review';
  const verifyButtonDisabled = verifyIdStatus === 'complete';
  const verifyButtonLabel = verifyIdStatus === 'complete'
    ? "ID Verified"
    : verifyIdStatus === 'review'
    ? "Review ID"
    : "Verify ID";

  const riskResultRaw = selectedOverviewItem?.risk?.RiskAssessmentResult?.toString().toLowerCase() ?? "";
  const riskStatus = riskResultRaw
    ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw)
        ? 'complete'
        : 'flagged'
    : 'pending';
  const riskButtonDisabled = riskStatus === 'complete';
  
  // Payment status logic
  const paymentResult = selectedOverviewItem?.instruction?.PaymentResult?.toLowerCase();
  const paymentCompleted = paymentResult === "successful";

  const matterLinked = useMemo(() => {
    if (!selectedInstruction) return false;
    
    // Find the prospect that contains this instruction
    const prospect = effectiveInstructionData.find(p => 
      p.instructions?.some((inst: any) => inst.InstructionRef === selectedInstruction.InstructionRef)
    );
    
    if (!prospect) return false;
    
    // Check if this prospect has any matters that correspond to this instruction
    // This could be based on InstructionRef or MatterId
    const hasMatter = prospect.matters?.some((matter: any) => 
      matter.InstructionRef === selectedInstruction.InstructionRef ||
      (selectedInstruction.MatterId && matter.MatterID === selectedInstruction.MatterId)
    );
    
    return !!hasMatter;
  }, [selectedInstruction, effectiveInstructionData]);
  
  // Open Matter button should be enabled when:
  // 1. Both ID is verified AND payment is complete (normal flow), OR
  // 2. There's a matter opening in progress (so user can continue)
  const canOpenMatter = (poidPassed && paymentCompleted) || hasActiveMatterOpening();
  
  // Determine which button should pulse to indicate next ready action
  const getNextReadyAction = (): 'verify' | 'risk' | 'matter' | 'ccl' | null => {
    if (!selectedInstruction) return null;
    
    // Check if the selected instruction has an associated matter
    const hasAssociatedMatter = selectedInstruction && (
      selectedInstruction.MatterId || 
      (selectedInstruction as any).matters?.length > 0
    );
    
    // If instruction has a matter, prioritize CCL button
    if (hasAssociatedMatter) {
      return 'ccl';
    }
    
    // Priority 1: If ID needs verification or review, verify button should pulse
    if (!verifyButtonDisabled) {
      return 'verify';
    }
    
    // Priority 2: If risk needs assessment (pending), risk button should pulse
    if (riskStatus === 'pending') {
      return 'risk';
    }
    
    // Priority 3: If matter can be opened, matter button should pulse
    if (canOpenMatter && !matterLinked) {
      return 'matter';
    }
    
    return null;
  };
  
  const nextReadyAction = getNextReadyAction();
  
  const disableOtherActions = false; // Enable all actions regardless of selection

  const unlinkedDeals = useMemo(
    () =>
      effectiveInstructionData.flatMap((p) =>
        (p.deals ?? []).filter((d) => !d.InstructionRef),
      ),
    [effectiveInstructionData],
  );

  const instructionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const deals = useMemo(
    () =>
      effectiveInstructionData.flatMap((p) =>
        (p.deals ?? []).map((d) => {
          // Attempt to derive lead client name from available data
          let firstName = '';
          let lastName = '';

          // First priority: Look up by ProspectId in enquiries data
          if (d.ProspectId || d.prospectId) {
            const prospectIdLookup = getClientNameByProspectId(d.ProspectId || d.prospectId);
            if (prospectIdLookup.firstName || prospectIdLookup.lastName) {
              firstName = prospectIdLookup.firstName;
              lastName = prospectIdLookup.lastName;
            }
          }

          // Second priority: Use existing email-based lookup if no name found from ACID
          if ((!firstName && !lastName) && d.LeadClientEmail) {
            const emailLc = d.LeadClientEmail.toLowerCase();

            // Look in instruction-level data for a matching client
            const matchingInstruction = (p.instructions ?? []).find((inst: any) =>
              inst.Email?.toLowerCase() === emailLc
            );

            if (matchingInstruction) {
              firstName = matchingInstruction.FirstName || '';
              lastName = matchingInstruction.LastName || '';
            } else {
              // Fall back to joint client records
              const jointSources = [
                ...(p.jointClients ?? p.joinedClients ?? []),
                ...(d.jointClients ?? []),
              ];
              const jointClient = jointSources.find((jc: any) =>
                jc.ClientEmail?.toLowerCase() === emailLc
              );

              if (jointClient) {
                firstName = jointClient.FirstName || jointClient.Name?.split(' ')[0] || '';
                lastName =
                  jointClient.LastName || jointClient.Name?.split(' ').slice(1).join(' ') || '';
              }
            }
          }

          return {
            ...d,
            firstName,
            lastName,
            jointClients: [
              // Only include prospect-level joint clients that match this deal's DealId
              ...(p.jointClients ?? p.joinedClients ?? []).filter((jc) => jc.DealId === d.DealId),
              // Include deal-level joint clients
              ...(d.jointClients ?? []),
            ],
            documents: [
              // Include prospect-level documents that match this deal's DealId
              ...(p.documents ?? []).filter((doc) => doc.DealId === d.DealId),
              // Include deal-level documents
              ...(d.documents ?? []),
              // Include instruction-level documents if deal has an instruction
              ...(d.instruction?.documents ?? []),
            ],
          };
        })
      ),
    [effectiveInstructionData, enquiries],
  );
  const clients: ClientInfo[] = useMemo(() => {
    const map: Record<string, ClientInfo> = {};
    effectiveInstructionData.forEach((p) => {
      const deals = p.deals ?? [];
      deals.forEach((d) => {
        if (d.LeadClientEmail) {
          const key = d.LeadClientEmail;
          const entry = map[key] || {
            ClientEmail: key,
            Lead: true,
            deals: [] as DealSummary[],
          };
          entry.Lead = true;
          (entry.deals as DealSummary[]).push({
            DealId: d.DealId,
            InstructionRef: d.InstructionRef,
            ServiceDescription: d.ServiceDescription,
            Status: d.Status,
          });
          map[key] = entry;
        }
      });
      // Process joint clients - combine prospect-level and deal-level, but filter prospect-level by DealId
      const allJointClients = [
        // Prospect-level joint clients (filter by DealId)
        ...(p.jointClients ?? p.joinedClients ?? []),
        // Deal-level joint clients  
        ...deals.flatMap((d) => d.jointClients ?? [])
      ];
      
      allJointClients.forEach((jc) => {
        const key = jc.ClientEmail;
        const entry = map[key] || {
          ClientEmail: jc.ClientEmail,
          HasSubmitted: jc.HasSubmitted,
          Lead: false,
          deals: [] as DealSummary[],
          // Only include specific fields we want to display
          DealJointClientId: jc.DealJointClientId,
          DealId: jc.DealId,
          SubmissionDateTime: jc.SubmissionDateTime,
        };
        // Update only the fields we want
        entry.HasSubmitted = jc.HasSubmitted;
        entry.DealJointClientId = jc.DealJointClientId;
        entry.DealId = jc.DealId;
        entry.SubmissionDateTime = jc.SubmissionDateTime;
        const deal = deals.find((dd) => dd.DealId === jc.DealId);
        if (deal) {
          (entry.deals as DealSummary[]).push({
            DealId: deal.DealId,
            InstructionRef: deal.InstructionRef,
            ServiceDescription: deal.ServiceDescription,
            Status: deal.Status,
          });
        }
        map[key] = entry;
      });
    });
    return Object.values(map);
  }, [effectiveInstructionData]);

  const riskComplianceData = useMemo(
    () =>
      effectiveInstructionData.flatMap((p) => {
        const instructions = p.instructions ?? [];
        const deals = p.deals ?? [];
        const riskSource: any[] = [
          ...(p.riskAssessments ?? []),
          ...(p.compliance ?? []),
        ];
        const prospectEids: any[] = [
          ...(p.electronicIDChecks ?? []),
          ...(p.idVerifications ?? []),
        ];
        const eidSource: any[] = [...prospectEids];
        prospectEids.forEach((eid: any) => {
          riskSource.push({
            MatterId: eid.InstructionRef ?? eid.MatterId,
            ComplianceDate: eid.EIDCheckedDate,
            CheckId: eid.EIDCheckId,
            CheckResult: eid.EIDOverallResult,
            PEPandSanctionsCheckResult: eid.PEPAndSanctionsCheckResult,
            AddressVerificationCheckResult: eid.AddressVerificationResult,
            EIDStatus: eid.EIDStatus,
          });
        });
        instructions.forEach((inst: any) => {
          riskSource.push(...(inst.riskAssessments ?? []));
          riskSource.push(...(inst.compliance ?? []));
          const instEids: any[] = [
            ...(inst.electronicIDChecks ?? []),
            ...(inst.idVerifications ?? []),
          ];
          eidSource.push(...instEids);
          instEids.forEach((eid: any) => {
            riskSource.push({
              MatterId: eid.InstructionRef ?? inst.InstructionRef,
              ComplianceDate: eid.EIDCheckedDate,
              CheckId: eid.EIDCheckId,
              CheckResult: eid.EIDOverallResult,
              PEPandSanctionsCheckResult: eid.PEPAndSanctionsCheckResult,
              AddressVerificationCheckResult: eid.AddressVerificationResult,
              EIDStatus: eid.EIDStatus,
            });
          });
        });
        deals.forEach((d: any) => {
          if (d.instruction) {
            riskSource.push(...(d.instruction.riskAssessments ?? []));
            riskSource.push(...(d.instruction.compliance ?? []));
            const instEids: any[] = [
              ...(d.instruction.electronicIDChecks ?? []),
              ...(d.instruction.idVerifications ?? []),
            ];
            eidSource.push(...instEids);
            instEids.forEach((eid: any) => {
              riskSource.push({
                MatterId: eid.InstructionRef ?? d.InstructionRef,
                ComplianceDate: eid.EIDCheckedDate,
                CheckId: eid.EIDCheckId,
                CheckResult: eid.EIDOverallResult,
                PEPandSanctionsCheckResult: eid.PEPAndSanctionsCheckResult,
                AddressVerificationCheckResult: eid.AddressVerificationResult,
                EIDStatus: eid.EIDStatus,
              });
            });
          }
        });
        return riskSource.map((r: any) => {
          const eid = eidSource.find((e: any) => e.MatterId === r.MatterId);
          const instruction = instructions.find(
            (i: any) => i.InstructionRef === r.MatterId,
          );
          const deal = deals.find((d: any) => d.InstructionRef === r.MatterId);

          const dealsForInst = deals.filter(
            (d: any) => d.InstructionRef === r.MatterId,
          );
          const clientsForInst: ClientInfo[] = [];
          const prospectClients = [
            ...(p.jointClients ?? p.joinedClients ?? []),
            ...dealsForInst.flatMap((d) => d.jointClients ?? []),
          ];
          
          // Helper function to find client details from instruction data
          const findClientDetails = (email: string) => {
            // Look in instructions for matching email
            const matchingInstruction = instructions.find((inst: any) => 
              inst.Email?.toLowerCase() === email?.toLowerCase()
            );
            if (matchingInstruction) {
              return {
                FirstName: matchingInstruction.FirstName,
                LastName: matchingInstruction.LastName,
                CompanyName: matchingInstruction.CompanyName,
                Phone: matchingInstruction.Phone,
              };
            }
            
            // Look in joint clients data for additional details
            const jointClient = prospectClients.find((jc: any) => 
              jc.ClientEmail?.toLowerCase() === email?.toLowerCase()
            );
            if (jointClient) {
              return {
                FirstName: jointClient.FirstName || jointClient.Name?.split(' ')[0],
                LastName: jointClient.LastName || jointClient.Name?.split(' ').slice(1).join(' '),
                CompanyName: jointClient.CompanyName,
                Phone: jointClient.Phone,
              };
            }
            
            return {};
          };
          
          prospectClients.forEach((jc) => {
            if (dealsForInst.some((d) => d.DealId === jc.DealId)) {
              const clientDetails = findClientDetails(jc.ClientEmail);
              clientsForInst.push({
                ClientEmail: jc.ClientEmail,
                HasSubmitted: jc.HasSubmitted,
                Lead: false,
                ...clientDetails,
                deals: [
                  {
                    DealId: jc.DealId,
                    InstructionRef: r.MatterId,
                    ServiceDescription: dealsForInst.find(
                      (d) => d.DealId === jc.DealId,
                    )?.ServiceDescription,
                    Status: dealsForInst.find((d) => d.DealId === jc.DealId)?.Status,
                  },
                ],
              });
            }
          });
          dealsForInst.forEach((d) => {
            if (d.LeadClientEmail) {
              const clientDetails = findClientDetails(d.LeadClientEmail);
              clientsForInst.push({
                ClientEmail: d.LeadClientEmail,
                Lead: true,
                ...clientDetails,
                deals: [
                  {
                    DealId: d.DealId,
                    InstructionRef: d.InstructionRef,
                    ServiceDescription: d.ServiceDescription,
                    Status: d.Status,
                  },
                ],
              });
            }
          });

          return {
            ...r,
            EIDStatus: eid?.EIDStatus,
            instruction,
            deal,
            ServiceDescription: deal?.ServiceDescription,
            Stage: instruction?.Stage,
            clients: clientsForInst,
          };
        });
      }),
    [effectiveInstructionData],
  );

  const filteredRiskComplianceData = useMemo(() => {
    let base = riskComplianceData.filter(r => riskFilterRef ? r.MatterId === riskFilterRef : true);
    if (riskStatusFilter === 'All') return base;
    const isCompleted = (item: any) => {
      const passed = (val: any) => typeof val === 'string' && ['passed','approved','low','low risk'].includes(val.toLowerCase());
      const eidOk = passed(item.EIDStatus) || passed(item.CheckResult) || passed(item.EIDOverallResult);
      const riskOk = passed(item.RiskAssessmentResult) || passed(item.CheckResult);
      return eidOk && riskOk;
    };
    if (riskStatusFilter === 'Completed') return base.filter(isCompleted);
    return base.filter(i => !isCompleted(i));
  }, [riskComplianceData, riskFilterRef, riskStatusFilter]);

  // Derive next action for clients (overview items reused later)
  const overviewItemsWithNextAction = useMemo(()=>{
    return overviewItems.map(item => {
      const inst = item.instruction as any;
      const eid = item.eid;
      const riskResultRaw = item.risk?.RiskAssessmentResult?.toString().toLowerCase();
      const poidResult = eid?.EIDOverallResult?.toLowerCase();
      const poidPassed = poidResult === 'passed' || poidResult === 'approved';
      const eidStatus = eid?.EIDStatus?.toLowerCase() ?? '';
      const proofOfIdComplete = Boolean(inst?.PassportNumber || inst?.DriversLicenseNumber);
      let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
      if (!eid || eidStatus === 'pending') verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
      else if (poidPassed) verifyIdStatus = 'complete'; else verifyIdStatus = 'review';
      const riskStatus = riskResultRaw ? (['low','low risk','pass','approved'].includes(riskResultRaw)? 'complete':'flagged') : 'pending';
      const paymentCompleted = (inst?.PaymentResult||'').toLowerCase() === 'successful';
      const hasMatter = inst?.MatterId;
      let nextAction: string = 'Complete';
      if (verifyIdStatus !== 'complete') nextAction = 'Verify ID';
      else if (riskStatus === 'pending') nextAction = 'Assess Risk';
      else if (!hasMatter && poidPassed && paymentCompleted) nextAction = 'Open Matter';
      else if (hasMatter) nextAction = 'Draft CCL';
      return { ...item, nextAction };
    });
  }, [overviewItems]);

  const filteredOverviewItems = useMemo(()=>{
    if (clientsActionFilter === 'All') return overviewItemsWithNextAction;
    return overviewItemsWithNextAction.filter(i => i.nextAction === clientsActionFilter || (clientsActionFilter==='Complete' && i.nextAction==='Complete'));
  }, [overviewItemsWithNextAction, clientsActionFilter]);

  // Local dev helper: detect instructions whose next required action is Matter Opening
  const isLocalhostEnv = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const openMatterCandidates = useMemo(() => {
    return filteredOverviewItems.filter((i: any) => i.nextAction === 'Open Matter');
  }, [filteredOverviewItems]);

  // Create POID data for client address information
  const idVerificationOptions = useMemo(() => {
    const seen = new Set<string>();
    return effectiveInstructionData.flatMap((p) => {
      const instructions = p.instructions ?? [];
      const all: any[] = [
        ...(p.electronicIDChecks ?? []),
        ...(p.idVerifications ?? []),
      ];
      instructions.forEach((inst: any) => {
        all.push(...(inst.electronicIDChecks ?? []));
        all.push(...(inst.idVerifications ?? []));
        if (inst.PassportNumber || inst.DriversLicenseNumber) {
          all.push({ ...inst, fromInstruction: true });
        }
      });
      return all.flatMap((v) => {
        if (!v) return [];
        const key = String(v.InternalId ?? v.MatterId ?? v.InstructionRef ?? "");
        if (seen.has(key)) return [];
        seen.add(key);
        const instRef = v.InstructionRef ?? v.MatterId;
        const inst = instructions.find((i: any) => i.InstructionRef === instRef) ?? (v.fromInstruction ? v : null);
        const merged: any = { ...inst, ...v };
        delete merged.EIDRawResponse;
        
        // Add verification results and status information
        const eidOverallResult = v.EIDOverallResult || merged.EIDOverallResult;
        const eidStatus = v.EIDStatus || merged.EIDStatus;
        
        return [
          {
            poid_id: String(merged.InternalId ?? key),
            prefix: merged.Title,
            first: merged.FirstName,
            last: merged.LastName,
            company_name: merged.CompanyName,
            nationality: merged.Nationality,
            nationality_iso: merged.NationalityAlpha2,
            date_of_birth: merged.DOB,
            best_number: merged.Phone,
            email: merged.Email,
            passport_number: merged.PassportNumber,
            drivers_license_number: merged.DriversLicenseNumber,
            house_building_number: merged.HouseNumber,
            street: merged.Street,
            city: merged.City,
            county: merged.County,
            post_code: merged.Postcode,
            country: merged.Country,
            country_code: merged.CountryCode,
            company_number: merged.CompanyNumber,
            company_house_building_number: merged.CompanyHouseNumber,
            company_street: merged.CompanyStreet,
            company_city: merged.CompanyCity,
            company_county: merged.CompanyCounty,
            company_post_code: merged.CompanyPostcode,
            company_country: merged.CompanyCountry,
            company_country_code: merged.CompanyCountryCode,
            stage: merged.Stage,
            // Add verification status and results
            EIDOverallResult: eidOverallResult,
            EIDStatus: eidStatus,
            CheckResult: v.CheckResult,
            DocumentType: v.DocumentType,
            DocumentNumber: v.DocumentNumber,
            IssuedDate: v.IssuedDate,
            ExpiryDate: v.ExpiryDate,
            IssuingCountry: v.IssuingCountry,
            CheckDate: v.CheckDate,
            FraudScore: v.FraudScore,
            AuthenticityScore: v.AuthenticityScore,
            QualityScore: v.QualityScore,
            BiometricScore: v.BiometricScore,
            Notes: v.Notes,
            // Add individual verification results for address and PEP checks
            AddressVerificationResult: eidOverallResult === 'Passed' ? 'Passed' : eidOverallResult === 'Failed' ? 'Review' : eidOverallResult === 'Review' ? 'Review' : null,
            PEPAndSanctionsCheckResult: eidOverallResult === 'Passed' ? 'Passed' : eidOverallResult === 'Failed' ? 'Review' : eidOverallResult === 'Review' ? 'Review' : null,
            ...merged,
          },
        ];
      });
    });
  }, [effectiveInstructionData]);

  // Group risk compliance data by instruction reference
  const groupedRiskComplianceData = useMemo(() => {
    const grouped = new Map<string, {
      instructionRef: string;
      riskAssessments: any[];
      idVerifications: any[];
      clients: any[];
      serviceDescription?: string;
      stage?: string;
      allData: any[];
    }>();

    filteredRiskComplianceData.forEach(item => {
      const instructionRef = item.InstructionRef || item.MatterId || 'Unknown';
      
      if (!grouped.has(instructionRef)) {
        grouped.set(instructionRef, {
          instructionRef,
          riskAssessments: [],
          idVerifications: [],
          clients: item.clients || [],
          serviceDescription: item.ServiceDescription,
          stage: item.Stage,
          allData: []
        });
      }

      const group = grouped.get(instructionRef)!;
      group.allData.push(item);

      // Categorize the item based on its properties
      if (item.CheckId || item.EIDStatus || item.EIDCheckedDate || 
          item.CheckResult || item.PEPandSanctionsCheckResult || 
          item.AddressVerificationCheckResult) {
        // This is an ID verification item
        group.idVerifications.push(item);
      } else {
        // This is a risk assessment item
        group.riskAssessments.push(item);
      }

      // Update shared properties (take from latest item)
      if (item.ServiceDescription) group.serviceDescription = item.ServiceDescription;
      if (item.Stage) group.stage = item.Stage;
      if (item.clients && item.clients.length > 0) group.clients = item.clients;
    });

    // Now enhance each group with proper ID verification data from instructionData
    Array.from(grouped.values()).forEach(group => {
      // Find the corresponding instruction data for this instruction ref
      const instructionItem = effectiveInstructionData.find(p => 
        p.instructions?.some((inst: any) => inst.InstructionRef === group.instructionRef)
      );
      
      if (instructionItem) {
        const instruction = instructionItem.instructions?.find((inst: any) => 
          inst.InstructionRef === group.instructionRef
        );
        
        // Get all ID verifications for this instruction
        const allIdVerifications = [
          ...(instructionItem.idVerifications || []),
          ...(instruction?.idVerifications || [])
        ].filter(idv => idv.InstructionRef === group.instructionRef);
        
        // Add these to the group's ID verifications
        group.idVerifications.push(...allIdVerifications);
        
        // Add instruction data to allData for personal info lookup
        if (instruction) {
          group.allData.push(instruction);
        }
        
        // Update stage and service description from instruction if available
        if (instruction && !group.stage) {
          group.stage = instruction.Stage;
        }
        
        // Find the deal for this instruction to get service description
        const deal = instructionItem.deals?.find((d: any) => d.InstructionRef === group.instructionRef);
        if (deal && !group.serviceDescription) {
          group.serviceDescription = deal.ServiceDescription;
        }
        
        // Enhanced client data with proper names and ID verification status
        const enhancedClients: any[] = [];
        
        // Get deals for this instruction (needed for both lead and joint client processing)
        const deals = instructionItem.deals?.filter((d: any) => d.InstructionRef === group.instructionRef) || [];
        
        // Add lead client from instruction data with basic fallback
        if (instruction) {
          const leadIdVerification = allIdVerifications.find(idv => 
            idv.ClientEmail?.toLowerCase() === instruction.Email?.toLowerCase()
          );
          
          // Find POID data for this client to get address information
          const leadPoidData = idVerificationOptions?.find(poid => 
            poid.email?.toLowerCase() === instruction.Email?.toLowerCase()
          );
          
          enhancedClients.push({
            ClientEmail: instruction.Email,
            FirstName: instruction.FirstName || instruction.Name?.split(' ')[0] || 'Client',
            LastName: instruction.LastName || instruction.Name?.split(' ').slice(1).join(' ') || '',
            CompanyName: instruction.CompanyName,
            Lead: true,
            HasSubmitted: true, // If instruction exists, they've submitted
            idVerification: leadIdVerification,
            // Add address information from POID data
            house_building_number: leadPoidData?.house_building_number,
            street: leadPoidData?.street,
            city: leadPoidData?.city,
            county: leadPoidData?.county,
            post_code: leadPoidData?.post_code,
            country: leadPoidData?.country
          });
        }
        
        // Add joint clients from deal data AND prospect data
        
        // Get all joint clients from both prospect level and deal level
        const allJointClients = [
          // Prospect-level joint clients (filter by DealId matching this instruction's deals)
          ...(instructionItem.jointClients || instructionItem.joinedClients || []).filter(jc => 
            deals.some(d => d.DealId === jc.DealId)
          ),
          // Deal-level joint clients
          ...deals.flatMap(d => d.jointClients || [])
        ];
        
        // Process all joint clients
        allJointClients.forEach((jc: any) => {
          const jointIdVerification = allIdVerifications.find(idv => 
            idv.ClientEmail?.toLowerCase() === jc.ClientEmail?.toLowerCase()
          );
          
          // Try to find instruction data for this joint client
          const jointInstruction = instructionData
            .flatMap(p => p.instructions || [])
            .find((inst: any) => inst.Email?.toLowerCase() === jc.ClientEmail?.toLowerCase());
          
          // Find POID data for this joint client to get address information
          const jointPoidData = idVerificationOptions?.find(poid => 
            poid.email?.toLowerCase() === jc.ClientEmail?.toLowerCase()
          );
          
          enhancedClients.push({
            ClientEmail: jc.ClientEmail,
            FirstName: jointInstruction?.FirstName || jc.FirstName || jc.Name?.split(' ')[0],
            LastName: jointInstruction?.LastName || jc.LastName || jc.Name?.split(' ').slice(1).join(' '),
            CompanyName: jointInstruction?.CompanyName || jc.CompanyName,
            Lead: false,
            HasSubmitted: jc.HasSubmitted || Boolean(jointInstruction),
            idVerification: jointIdVerification,
            // Add address information from POID data
            house_building_number: jointPoidData?.house_building_number,
            street: jointPoidData?.street,
            city: jointPoidData?.city,
            county: jointPoidData?.county,
            post_code: jointPoidData?.post_code,
            country: jointPoidData?.country
          });
        });
        
        // Replace the clients array with enhanced data
        if (enhancedClients.length > 0) {
          group.clients = enhancedClients;
        }
      }
    });

    return Array.from(grouped.values());
  }, [filteredRiskComplianceData, effectiveInstructionData, idVerificationOptions]);

  const handleOpenMatter = (inst: any) => {
    if (hasActiveMatterOpening()) {
      setPendingInstruction(inst);
      setIsResumeDialogOpen(true);
    } else {
      setSelectedInstruction(inst);
      setPendingInstructionRef('');
      setForceNewMatter(false);
      setShowNewMatterPage(true);
      // Scroll to top when opening matter for selected instruction
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleRiskAssessment = (item: any) => {
    if (item) {
      setSelectedInstruction(item.instruction ?? item);
      setSelectedRisk(item.risk ?? item.riskAssessments?.[0] ?? null);
    }
    setPendingInstructionRef('');
    setShowRiskPage(true);
  };

  const handleEIDCheck = async (inst: any) => {
    if (!inst?.InstructionRef) {
      console.error('No instruction reference provided for ID verification');
      return;
    }

    const instructionRef = inst.InstructionRef;
    
    // Determine current verification status using enhanced logic for Tiller API responses
    const eid = inst.eidData || inst.EIDData;
    const eids = inst.eidS;
    const eidStatus = inst.EIDStatus;
    const eidResult = inst.EIDOverallResult?.toLowerCase();
    
    // Try alternative field names for ID verification data
    const altEidResult = (inst.eidOverallResult || inst.eid_overall_result || inst.overallResult)?.toLowerCase();
    const altAddressResult = (inst.addressVerificationResult || inst.AddressVerificationResult || inst.address_verification_result)?.toLowerCase();
    const altPepResult = (inst.pepAndSanctionsCheckResult || inst.PEPAndSanctionsCheckResult || inst.pep_and_sanctions_check_result)?.toLowerCase();
    
    const poidPassed = inst.EIDOverallResult?.toLowerCase() === 'passed' || inst.EIDOverallResult?.toLowerCase() === 'complete';
    const stageComplete = inst.stage === 'proof-of-id-complete';
    const proofOfIdComplete = inst.ProofOfIdComplete || inst.proof_of_id_complete;
    
    // Check if we have Tiller API response data
    let tillerOverallResult = null;
    if (eid && typeof eid === 'object' && eid.overallResult) {
      tillerOverallResult = eid.overallResult.result?.toLowerCase();
    }
    
    // Get the latest ID verification data from the idVerifications array
    const idVerification = inst.idVerifications && inst.idVerifications.length > 0 
      ? inst.idVerifications[0] // Most recent (ordered by InternalId DESC)
      : null;
    
    console.log(`🔍 Enhanced EID Check for ${instructionRef}:`, {
      stage: inst.stage,
      hasIdVerifications: !!(inst.idVerifications && inst.idVerifications.length > 0),
      idVerificationCount: inst.idVerifications ? inst.idVerifications.length : 0,
      latestIdVerification: idVerification ? {
        EIDOverallResult: idVerification.EIDOverallResult,
        EIDStatus: idVerification.EIDStatus,
        AddressVerificationResult: idVerification.AddressVerificationResult,
        PEPAndSanctionsCheckResult: idVerification.PEPAndSanctionsCheckResult,
        EIDCheckId: idVerification.EIDCheckId,
        EIDCheckedDate: idVerification.EIDCheckedDate
      } : null,
      
      // Legacy fields for backward compatibility
      legacyFields: {
        eidResult,
        eidStatus,
        tillerOverallResult,
        hasEidData: !!eid,
        poidPassed,
        stageComplete,
        proofOfIdComplete
      }
    });
    
    let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
    
    // Priority 1: Check latest ID verification record from database
    if (idVerification && idVerification.EIDOverallResult) {
      const dbResult = idVerification.EIDOverallResult.toLowerCase();
      if (dbResult === 'review') {
        verifyIdStatus = 'review';
        console.log(`✅ Status determined from DB IDVerifications.EIDOverallResult: review`);
      } else if (dbResult === 'passed' || dbResult === 'complete') {
        verifyIdStatus = 'complete';
        console.log(`✅ Status determined from DB IDVerifications.EIDOverallResult: complete (${dbResult})`);
      } else {
        verifyIdStatus = 'review'; // Default for unknown results
        console.log(`✅ Status determined from DB IDVerifications.EIDOverallResult: review (fallback for ${dbResult})`);
      }
    }
    // Priority 2: Check Tiller API overall result if available
    else if (tillerOverallResult === 'review') {
      verifyIdStatus = 'review';
      console.log(`✅ Status determined from Tiller API: review`);
    } else if (tillerOverallResult === 'passed') {
      verifyIdStatus = 'complete';
      console.log(`✅ Status determined from Tiller API: complete`);
    } 
    // Priority 3: Check legacy database EID result fields
    else if (eidResult === 'review' || altEidResult === 'review') {
      verifyIdStatus = 'review';
      console.log(`✅ Status determined from legacy DB EIDResult: review (${eidResult || altEidResult})`);
    } else if (poidPassed || eidResult === 'passed' || altEidResult === 'passed') {
      verifyIdStatus = 'complete';
      console.log(`✅ Status determined from legacy DB EIDResult: complete (${eidResult || altEidResult})`);
    }
    // Priority 4: Check stage and other indicators
    else if (stageComplete) {
      // If stage shows proof-of-id-complete but no clear result, check for pending status
      if (eidStatus === 'pending' || eidResult === 'pending') {
        verifyIdStatus = 'review'; // Pending results usually need review
        console.log(`✅ Status determined from pending state: review`);
      } else {
        verifyIdStatus = 'review'; // Stage complete but unclear result
        console.log(`✅ Status determined from stage complete fallback: review`);
      }
    } else if (!eid && !eids?.length || eidStatus === 'pending') {
      verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
      console.log(`✅ Status determined from no data: ${verifyIdStatus}`);
    } else if (poidPassed) {
      verifyIdStatus = 'complete';
      console.log(`✅ Status determined from poidPassed: complete`);
    } else {
      verifyIdStatus = 'review';
      console.log(`✅ Status determined from fallback: review`);
    }

    console.log(`ID verification status for ${instructionRef}: ${verifyIdStatus}`);

    // IMPORTANT: Handle review and complete statuses immediately - NO API CALLS
    if (verifyIdStatus === 'review') {
      // Red ID - already requires review, open modal directly
      console.log('🔴 RED ID detected - Opening review modal directly (NO API CALL)');
      try {
        const details = await fetchVerificationDetails(instructionRef);
        setReviewModalDetails(details);
        setShowReviewModal(true);
      } catch (error) {
        console.error('Failed to fetch verification details:', error);
        alert('Failed to load verification details. Please try again.');
      }
      return; // STOP HERE - no API call needed
    } 
    
    if (verifyIdStatus === 'complete') {
      // Green ID - already completed
      console.log('🟢 GREEN ID detected - Already completed');
      alert('ID verification is already complete for this instruction.');
      return; // STOP HERE - no API call needed
    }

    // Only reach here if status is 'pending' or 'received' - these need API calls
    console.log(`🟡 PENDING/RECEIVED ID detected - Making API call for ${instructionRef}`);

    // Set loading state
    setIdVerificationLoading(prev => new Set(prev).add(instructionRef));

    try {
      const response = await fetch('/api/verify-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instructionRef }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.status === 'already_verified') {
          // ID is already verified, show success message
          alert('ID verification already completed for this instruction.');
        } else {
          // Verification submitted successfully
          console.log('ID verification submitted successfully');
          console.log('Admin Log - Response:', result.response);
          console.log('Admin Log - Parse Results:', result.parseResults);
          
          // Show appropriate feedback based on results
          const overallResult = result.overall || 'pending';
          if (overallResult === 'review') {
            // Results require review - open modal for manual approval
            console.log('Opening review modal for verification results');
            try {
              const details = await fetchVerificationDetails(instructionRef);
              setReviewModalDetails(details);
              setShowReviewModal(true);
            } catch (error) {
              console.error('Failed to fetch verification details for review:', error);
              alert('Verification requires manual review. Please check the verification details.');
            }
          } else if (overallResult === 'passed') {
            alert('ID verification completed successfully!');
          } else {
            alert(`ID verification submitted. Status: ${overallResult}`);
          }
          
          // Note: Card will update status on next data refresh
        }
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('ID verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`ID verification failed: ${errorMessage}`);
      
      // Stay on current page - don't redirect to EID page on error
    } finally {
      // Clear loading state
      setIdVerificationLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(instructionRef);
        return newSet;
      });
    }
  };

  /**
   * Handle verification approval from review modal
   */
  const handleVerificationApproval = async (instructionRef: string) => {
    try {
      await approveVerification(instructionRef);
      
      // Update local data to reflect the approval
      setInstructionData(prevData => 
        prevData.map(prospect => ({
          ...prospect,
          instructions: prospect.instructions.map((instruction: any) => 
            instruction.InstructionRef === instructionRef
              ? { ...instruction, EIDOverallResult: 'Verified', stage: 'proof-of-id-complete' }
              : instruction
          )
        }))
      );

      // Close modal
      setShowReviewModal(false);
      setReviewModalDetails(null);

      // Show success message
      alert('ID verification approved and email sent to client.');
      
    } catch (error) {
      console.error('Failed to approve verification:', error);
      alert('Failed to approve verification. Please try again.');
      throw error;
    }
  };


  const handleOpenRiskCompliance = (ref: string) => {
    setRiskFilterRef(ref);
    setActiveTab('risk');
  };

  const handleDraftCclNow = () => {
    setShowNewMatterPage(false);
    setShowCclDraftPage(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };


  // Always open CCL template for global Draft CCL action
  const handleOpenDraftCcl = (ref: string) => {
    setSelectedInstruction({ InstructionRef: ref } as any);
    // Set a global variable or state to force initialTemplate to 'ccl'
    // If DocumentsV3 is rendered here, pass initialTemplate='ccl' directly
    // If not, ensure the prop is always 'ccl' for this action
    setShowCclDraftPage(true);
    // Optionally, if you use a state for initialTemplate, set it here:
    // setInitialTemplate('ccl');
  };

  const gridContainerStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "16px",
    maxWidth: "1440px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  });

  const overviewGridStyle = mergeStyles({
    display: 'grid',
    gridTemplateColumns: twoColumn ? 'repeat(auto-fit, minmax(350px, 1fr))' : '1fr',
    gap: twoColumn ? '16px' : '8px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    transition: 'grid-template-columns .25s ease',
    // Responsive adjustments
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    '@media (max-width: 480px)': {
      gap: '8px',
    },
  }, twoColumn && 'two-col-grid');

  const overviewItemStyle = mergeStyles({
    minWidth: '280px',
    width: '100%',
    '@media (max-width: 768px)': {
      minWidth: 'unset',
    },
    '@media (max-width: 480px)': {
      minWidth: 'unset',
    },
  });

  const repositionMasonry = React.useCallback(() => {
    const grid = overviewGridRef.current;
    if (!grid) return;
    const rowGap = parseInt(
      window.getComputedStyle(grid).getPropertyValue('grid-row-gap'),
    );
    const rowHeight = parseInt(
      window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'),
    );
    Array.from(grid.children).forEach((child) => {
      const el = child as HTMLElement;
      const span = Math.ceil(
        (el.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap),
      );
      el.style.gridRowEnd = `span ${span}`;
    });
  }, []);

  const handleCardToggle = React.useCallback(() => {
    const start = performance.now();
    const animate = () => {
      repositionMasonry();
      if (performance.now() - start < 350) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [repositionMasonry]);

  useLayoutEffect(() => {
    if (
      activeTab === "clients" &&
      !showRiskPage &&
      !showNewMatterPage &&
      !showEIDPage
    ) {
      repositionMasonry();
    }
  }, [
    overviewItems,
    selectedInstruction,
    repositionMasonry,
    activeTab,
    showRiskPage,
    showNewMatterPage,
    showEIDPage,
  ]);

  useEffect(() => {
    window.addEventListener('resize', repositionMasonry);
    return () => window.removeEventListener('resize', repositionMasonry);
  }, [repositionMasonry]);


  // Global action handlers that work with the selected instruction or first available instruction
  const handleGlobalOpenMatter = () => {
    const targetInstruction = selectedInstruction || overviewItems.find(item => item.instruction)?.instruction;
    if (targetInstruction) {
      handleOpenMatter(targetInstruction);
    }
  };

  const handleGlobalRiskAssessment = () => {
    const targetItem = selectedInstruction 
      ? overviewItems.find(item => item.instruction.InstructionRef === selectedInstruction.InstructionRef)
      : overviewItems.find(item => item.instruction);
    if (targetItem) {
      handleRiskAssessment(targetItem);
    }
  };

  const handleGlobalEIDCheck = () => {
    const targetInstruction = selectedInstruction || overviewItems.find(item => item.instruction)?.instruction;
    if (targetInstruction) {
      handleEIDCheck(targetInstruction);
    }
  };


  const handleStartNewMatter = () => {
    if (!pendingInstruction) return;
    clearMatterOpeningDraft();
    setSelectedInstruction(pendingInstruction);
    setPendingInstruction(null);
    setForceNewMatter(true);
    setShowNewMatterPage(true);
    setIsResumeDialogOpen(false);
    // Scroll to top when starting new matter
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    // Force a small delay to ensure localStorage is cleared before component mounts
    setTimeout(() => {
      setForceNewMatter(false);
    }, 100);
  };


  if (showNewMatterPage) {
    // Preselect POIDs by matching InstructionRef
    let preselectedPoidIds: string[] = [];
    if (selectedInstruction && selectedInstruction.InstructionRef) {
      const unique = new Map<string, string>();
      (idVerificationOptions || []).forEach((poid: any) => {
        if (!poid || poid.InstructionRef !== selectedInstruction.InstructionRef) return;
        const key = (poid.email || '').toLowerCase();
        if (!unique.has(key)) {
          unique.set(key, String(poid.poid_id));
        }
      });
      preselectedPoidIds = Array.from(unique.values());
    }
    return (
      <Stack tokens={dashboardTokens} className={newMatterContainerStyle}>
        <FlatMatterOpening
          key={forceNewMatter ? `new-${Date.now()}` : `matter-${selectedInstruction?.InstructionRef || 'default'}`}
          poidData={idVerificationOptions}
          setPoidData={setPoidData}
          teamData={teamData}
          userInitials={userInitials}
          userData={userData}
          instructionRef={selectedInstruction?.InstructionRef}
          stage={selectedInstruction?.Stage}
          clientId={selectedInstruction?.prospectId?.toString()}
          hideClientSections={!selectedInstruction}
          initialClientType={selectedInstruction?.ClientType}
          preselectedPoidIds={preselectedPoidIds}
          instructionPhone={selectedInstruction?.Phone}
          onDraftCclNow={handleDraftCclNow}
        />
      </Stack>
    );
  }

  if (showRiskPage) {
    return (
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <RiskAssessmentPage
          onBack={() => {
            setShowRiskPage(false);
            setSelectedRisk(null);
          }}
          onSave={handleRiskAssessmentSave}
          instructionRef={selectedInstruction?.InstructionRef}
          riskAssessor={userInitials}
          existingRisk={selectedRisk ?? selectedInstruction?.riskAssessments?.[0] ?? null}
        />
      </Stack>
    );
  }

  if (showEIDPage) {
    return (
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <EIDCheckPage
          poidData={idVerificationOptions}
          instruction={selectedInstruction}
          onBack={handleBack}
        />
      </Stack>
    );
  }



  function handleOpenInstruction(ref: string): void {
    // For instructions, set the selected instruction to show details
    setSelectedInstruction(ref);
  }

  return (
    <>
    <section key="instructions-section" className="page-section">
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <div className={sectionContainerStyle(isDarkMode)}>
        {/* Local development immediate Matter Opening CTA */}
        {isLocalhostEnv && activeTab === 'clients' && !showNewMatterPage && openMatterCandidates.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '96px',
            right: '32px',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {openMatterCandidates.slice(0,3).map((c:any) => (
              <button
                key={`matter-cta-${c.instruction.InstructionRef}`}
                onClick={() => {
                  setSelectedInstruction(c.instruction);
                  setTimeout(()=> handleGlobalOpenMatter(), 50);
                }}
                style={{
                  background: 'linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '220px'
                }}
                title="Quick open matter (local only)"
              >
                <FaFolder /> Open Matter: {c.instruction.InstructionRef}
              </button>
            ))}
          </div>
        )}
      {activeTab === "pitches" && (
              <div className={overviewGridStyle} ref={overviewGridRef}>
                {twoColumn && typeof document !== 'undefined' && !document.getElementById('instructionsTwoColStyles') && (
                  (() => {
                    const styleEl = document.createElement('style');
                    styleEl.id = 'instructionsTwoColStyles';
                    styleEl.textContent = `
                      @media (max-width: 860px) { .two-col-grid { grid-template-columns: 1fr !important; } }
                      @media (max-width: 768px) { .two-col-grid { gap: 12px !important; } }
                      @media (max-width: 480px) { .two-col-grid { gap: 8px !important; } }
                    `;
                    document.head.appendChild(styleEl);
                    return null;
                  })()
                )}
        {(() => {
          // Get deals that haven't been converted to instructions yet (pure pitches)
          const pitchedItems = overviewItems.filter(item => 
            // Show only deals that don't have instructions yet (not converted)
            !item.instruction && !!item.deal
          );
          
          // Debug logging for pitches
          console.log('🔍 Pitches Debug:', {
            totalOverviewItems: overviewItems.length,
            pitchedItems: pitchedItems.length,
            sampleOverviewItems: overviewItems.slice(0, 3).map(item => ({
              hasInstruction: !!item.instruction,
              hasDeal: !!item.deal,
              instructionRef: item.instruction?.InstructionRef,
              dealId: item.deal?.DealId
            }))
          });
          
          if (pitchedItems.length === 0) {
            return (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: isDarkMode ? '#fff' : '#666',
                fontSize: '14px',
                fontFamily: 'Raleway, sans-serif'
              }}>
                <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
                  No pitches found
                </div>
                <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
                  No unconverted deals are available. Pitches show deals that haven't been converted to instructions yet.
                </div>
              </div>
            );
          }
          
          return pitchedItems.filter(item => {
            // Apply pitches status filter
            if (pitchesStatusFilter === 'All') return true;
            if (pitchesStatusFilter === 'Open') return String(item.deal?.Status).toLowerCase() !== 'closed';
            if (pitchesStatusFilter === 'Closed') return String(item.deal?.Status).toLowerCase() === 'closed';
            return true;
          }).map((item, idx) => {
                    const row = Math.floor(idx / 4);
                    const col = idx % 4;
                    const animationDelay = row * 0.2 + col * 0.1;
                    const dealKey = `pitch-${item.deal?.DealId}` || idx;
                    return (
                      <div key={`pitch-${dealKey}`} className={overviewItemStyle}>
                        <InstructionCard
                          index={idx}
                          instruction={null} // No instruction - this is a pure pitch/deal
                          deal={item.deal}
                          deals={item.deals}
                          clients={item.clients}
                          risk={(item as any).risk}
                          eid={(item as any).eid}
                          eids={(item as any).eids}
                          compliance={undefined}
                          documents={item.documents}
                          payments={(item as any).payments}
                          prospectId={item.prospectId}
                          documentCount={item.documentCount ?? 0}
                          animationDelay={animationDelay}
                          expanded={false} // Don't expand pitches by default
                          selected={false} // Simple selection for pitches
                          getClientNameByProspectId={getClientNameByProspectId}
                          onSelect={() => {
                            // TODO: Implement pitch selection logic
                            console.log('Pitch selected:', item.deal?.DealId);
                          }}
                          onToggle={() => {
                            // TODO: Implement pitch toggle logic
                            console.log('Pitch toggled:', item.deal?.DealId);
                          }}
                          onProofOfIdClick={() => {
                            // Not applicable for pitches
                          }}
                        />
                      </div>
                    );
                  });
                })()}
            </div>
          )}
      {activeTab === "clients" && (
              <div className={overviewGridStyle} ref={overviewGridRef}>
                {twoColumn && typeof document !== 'undefined' && !document.getElementById('instructionsTwoColStyles') && (
                  (() => {
                    const styleEl = document.createElement('style');
                    styleEl.id = 'instructionsTwoColStyles';
                    styleEl.textContent = '@media (max-width: 860px){.two-col-grid{grid-template-columns:1fr!important;}}';
                    document.head.appendChild(styleEl);
                    return null;
                  })()
                )}
        {filteredOverviewItems.filter(item => 
          // Show only items with instructions (exclude pitched deals)
          item.instruction
        ).map((item, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  const itemKey = item.instruction?.InstructionRef || idx;
                  return (
                    <div key={`instruction-${itemKey}-${selectedInstruction?.InstructionRef === item.instruction?.InstructionRef ? 'selected' : 'unselected'}`} className={overviewItemStyle}>
                      <InstructionCard
                        index={idx}
                        key={`card-${itemKey}-${selectedInstruction?.InstructionRef === item.instruction?.InstructionRef}`}
                        instruction={item.instruction as any}
                        deal={(item as any).deal}
                        deals={item.deals}
                        clients={item.clients}
                        risk={(item as any).risk}
                        eid={(item as any).eid}
                        eids={(item as any).eids}
                        compliance={undefined}
                        documents={item.documents}
                        payments={(item as any).payments}
                        prospectId={item.prospectId}
                        documentCount={item.documentCount ?? 0}
                        animationDelay={animationDelay}
                        expanded={overviewItems.length === 1 || selectedInstruction?.InstructionRef === item.instruction?.InstructionRef}
                        selected={selectedInstruction?.InstructionRef === item.instruction?.InstructionRef}
                        getClientNameByProspectId={getClientNameByProspectId}
                        onSelect={() => {
                          // Toggle selection: if already selected, unselect; otherwise select
                          flushSync(() => {
                            if (selectedInstruction?.InstructionRef === item.instruction?.InstructionRef) {
                              setSelectedInstruction(null);
                            } else {
                              setSelectedInstruction(item.instruction);
                            }
                          });
                        }}
                        onToggle={handleCardToggle}
                        onProofOfIdClick={() =>
                          handleOpenRiskCompliance(item.instruction?.InstructionRef)
                        }
                        onEIDClick={() => handleEIDCheck(item.instruction)}
                        idVerificationLoading={idVerificationLoading.has(item.instruction?.InstructionRef || '')}
                      />
                    </div>

                  );
                })}
            </div>
          )}
          {activeTab === "risk" && (
            <>
              <div className={gridContainerStyle}>
                {groupedRiskComplianceData.length === 0 && (
                  <Text>No risk data available.</Text>
                )}
                {groupedRiskComplianceData.map((groupedItem, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  const isExpanded = groupedRiskComplianceData.length === 1 && !!riskFilterRef;
                  return (
                    <RiskComplianceCard
                      key={`${groupedItem.instructionRef}-${idx}`}
                      data={groupedItem}
                      animationDelay={animationDelay}
                      expanded={isExpanded}
                      onOpenInstruction={() =>
                        handleOpenInstruction(groupedItem.instructionRef)
                      }
                    />
                  );
                })}
              </div>
            </>
          )}
          {showCclDraftPage && (
            <DocumentsV3
              selectedInstructionProp={selectedInstruction}
              initialTemplate={selectedInstruction ? 'ccl' : undefined}
              instructions={instructionData}
            />
          )}
        </div>
        {showApiDebugger && (
          <InstructionApiDebugger currentInstructions={instructionData} onClose={()=> setShowApiDebugger(false)} />
        )}
        {/* Global Action Area - always visible, enhanced when instruction selected */}
        {activeTab === "clients" && !showNewMatterPage && !showRiskPage && !showEIDPage && (
          <div 
            className={`global-action-area${selectedInstruction ? ' expanded' : ''}`}
            style={{
              opacity: 1, // Always visible
              transform: 'translateY(0)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              pointerEvents: 'auto', // Always interactive
            }}
          >
            <button
              className={`global-action-btn${verifyButtonDisabled ? ' completed' : verifyButtonReview ? ' review' : ''}${selectedInstruction ? ' selected' : ''}${nextReadyAction === 'verify' ? ' next-action-pulse' : ''}`}
              onClick={verifyButtonDisabled ? undefined : handleGlobalEIDCheck}
              onMouseDown={e => !verifyButtonDisabled && e.currentTarget.classList.add('pressed')}
              onMouseUp={e => !verifyButtonDisabled && e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: verifyButtonDisabled
                  ? '#d4ddd4'
                  : verifyButtonReview
                  ? '#ffe066'
                  : selectedInstruction
                  ? '#3690CE'
                  : undefined,
                backgroundColor: verifyButtonDisabled
                  ? '#f8faf8'
                  : verifyButtonReview
                  ? '#fffbe6'
                  : undefined,
                opacity: verifyButtonDisabled ? 0.75 : 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s, border-color 0.2s ease',
                pointerEvents: 'auto', // Always allow hover effects
              }}
            >
              <span
                className="global-action-icon icon-hover"
                style={{
                  color: verifyButtonDisabled
                    ? '#6b8e6b'
                    : verifyButtonReview
                    ? '#bfa100'
                    : selectedInstruction
                    ? '#3690CE'
                    : undefined,
                }}
              >
                {verifyButtonDisabled ? <FaCheckCircle /> : (
                  <>
                    <FaIdBadge className="icon-outline" />
                    <FaRegIdBadge className="icon-filled" />
                  </>
                )}
              </span>
              <span
                className="global-action-label"
                style={{
                  color: verifyButtonDisabled
                    ? '#6b8e6b'
                    : verifyButtonReview
                    ? '#bfa100'
                    : selectedInstruction
                    ? '#3690CE'
                    : undefined,
                  textDecoration: verifyButtonDisabled ? 'line-through' : 'none',
                  textDecorationColor: verifyButtonDisabled ? '#6b8e6b' : undefined,
                  textDecorationThickness: verifyButtonDisabled ? '1px' : undefined,
                }}
              >
                {verifyButtonLabel}
              </span>
            </button>
            <button
              className={`global-action-btn${riskButtonDisabled ? ' completed' : ''}${selectedInstruction ? ' selected' : ''}${nextReadyAction === 'risk' ? ' next-action-pulse' : ''}`}
              onClick={riskButtonDisabled ? undefined : handleGlobalRiskAssessment}
              onMouseDown={e => !riskButtonDisabled && e.currentTarget.classList.add('pressed')}
              onMouseUp={e => !riskButtonDisabled && e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: riskButtonDisabled
                  ? '#d4ddd4'
                  : selectedInstruction
                  ? '#3690CE'
                  : undefined,
                backgroundColor: riskButtonDisabled 
                  ? '#f8faf8' 
                  : undefined,
                opacity: riskButtonDisabled ? 0.75 : 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s, border-color 0.2s ease',
                pointerEvents: 'auto', // Always allow hover effects
                cursor: riskButtonDisabled ? 'default' : 'pointer',
              }}
            >
              <span className="global-action-icon icon-hover" style={{
                color: riskButtonDisabled
                  ? '#6b8e6b'
                  : selectedInstruction
                  ? '#3690CE'
                  : undefined,
              }}>
                {riskButtonDisabled ? <FaCheckCircle /> : (
                  <>
                    <MdAssessment className="icon-outline" />
                    <MdOutlineAssessment className="icon-filled" />
                  </>
                )}
              </span>
              <span className="global-action-label" style={{
                color: riskButtonDisabled
                  ? '#6b8e6b'
                  : selectedInstruction
                  ? '#3690CE'
                  : undefined,
                textDecoration: riskButtonDisabled ? 'line-through' : 'none',
                textDecorationColor: riskButtonDisabled ? '#6b8e6b' : undefined,
                textDecorationThickness: riskButtonDisabled ? '1px' : undefined,
              }}>
                Assess Risk
              </span>
            </button>
            <button
              className={`global-action-btn${matterLinked ? ' completed' : ''}${selectedInstruction ? ' selected' : ''}${nextReadyAction === 'matter' ? ' next-action-pulse' : ''}`}
              onClick={canOpenMatter ? handleGlobalOpenMatter : undefined}
              onMouseDown={e => canOpenMatter && e.currentTarget.classList.add('pressed')}
              onMouseUp={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: matterLinked
                  ? '#d4ddd4'
                  : selectedInstruction 
                  ? '#3690CE' 
                  : undefined,
                backgroundColor: matterLinked
                  ? '#f8faf8'
                  : canOpenMatter 
                  ? undefined 
                  : '#f5f5f5',
                opacity: matterLinked ? 0.75 : canOpenMatter ? 1 : 0.5,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.3s, transform 0.3s ease 0.3s, border-color 0.2s ease',
                position: 'relative',
                pointerEvents: canOpenMatter ? 'auto' : 'none',
                cursor: canOpenMatter ? 'pointer' : 'not-allowed',
              }}
              title={
                !canOpenMatter
                  ? `${!poidPassed ? "ID verification" : ""} ${
                      !poidPassed && !paymentCompleted ? " and " : ""
                    } ${!paymentCompleted ? "payment" : ""} required to open matter`
                  : ""
              }
            >
              <span className="global-action-icon icon-hover" style={{
                color: selectedInstruction ? '#3690CE' : undefined,
              }}>
                {matterLinked ? (
                  <FaCheckCircle />
                ) : (
                  <>
                    <FaFolder className="icon-outline" />
                    <FaRegFolder className="icon-filled" />
                  </>
                )}
              </span>
              <span className="global-action-label" style={{
                color: selectedInstruction ? '#3690CE' : undefined,
                textDecoration: matterLinked ? 'line-through' : 'none',
              }}>
                {selectedInstruction ? 'Open Matter' : 'New Matter'}
              </span>
              {/* Pulsing dot indicator - only show when no instruction selected and has active matter */}
              {!selectedInstruction && hasActiveMatter && !showNewMatterPage && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#D65541',
                  animation: 'pulse 2s infinite',
                  zIndex: 10,
                }} />
              )}
            </button>
            <button
              className={`global-action-btn${selectedInstruction || nextReadyAction === 'ccl' ? ' selected' : ''}${nextReadyAction === 'ccl' ? ' next-action-pulse' : ''}`}
              onClick={canOpenMatter ? () => setShowCclDraftPage(true) : undefined}
              onMouseDown={e => canOpenMatter && e.currentTarget.classList.add('pressed')}
              onMouseUp={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: (selectedInstruction || nextReadyAction === 'ccl') ? '#3690CE' : undefined,
                opacity: canOpenMatter ? 1 : 0.5,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.4s, transform 0.3s ease 0.4s, border-color 0.2s ease',
                pointerEvents: canOpenMatter ? 'auto' : 'none',
                cursor: canOpenMatter ? 'pointer' : 'not-allowed',
                backgroundColor: canOpenMatter ? undefined : '#f5f5f5',
              }}
              title={
                !canOpenMatter
                  ? `${!poidPassed ? "ID verification" : ""} ${
                      !poidPassed && !paymentCompleted ? " and " : ""
                    } ${!paymentCompleted ? "payment" : ""} required to draft CCL`
                  : ""
              }
            >
              <span className="global-action-icon icon-hover" style={{
                color: (selectedInstruction || nextReadyAction === 'ccl') ? '#3690CE' : undefined,
              }}>
                <FaFileAlt className="icon-outline" />
                <FaRegFileAlt className="icon-filled" />
              </span>
              <span className="global-action-label" style={{
                color: (selectedInstruction || nextReadyAction === 'ccl') ? '#3690CE' : undefined,
              }}>
                Draft CCL
              </span>
            </button>
          </div>
        )}
      </Stack>
    </section>
      <Dialog
        hidden={!isResumeDialogOpen}
        onDismiss={() => setIsResumeDialogOpen(false)}
        dialogContentProps={{
          type: 'normal' as any, // Temporary fix for DialogType.normal issue
          title: 'Resume Matter Opening?',
          subText:
            'An unfinished matter opening was detected. Would you like to resume it or start a new one?'
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={() => {
              setIsResumeDialogOpen(false);
              setSelectedInstruction(pendingInstruction);
              setForceNewMatter(false);
              setShowNewMatterPage(true);
              // Scroll to top when resuming matter opening
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
            }}
            text="Resume"
          />
          <DefaultButton onClick={handleStartNewMatter} text="Start New" />
        </DialogFooter>
      </Dialog>

      {/* Data Flow Workbench Modal */}
      <DataFlowWorkbench 
        isOpen={showWorkbench}
        onClose={() => setShowWorkbench(false)}
      />

      {/* ID Verification Review Modal */}
      <IDVerificationReviewModal
        isVisible={showReviewModal}
        details={reviewModalDetails}
        onClose={() => {
          setShowReviewModal(false);
          setReviewModalDetails(null);
        }}
        onApprove={handleVerificationApproval}
        onRequestDocuments={async (instructionRef: string) => {
          console.log('Documents requested for:', instructionRef);
          // The email sending is handled within the modal
        }}
      />
    </>
  );
};

// --- DealsPivot extracted to fix React hooks error ---
interface DealsPivotProps {
  deals: any[];
  handleOpenInstruction: (ref: string) => void;
  selectedDealRef?: string | null;
  onClearSelection?: () => void;
  onSelectDeal?: (ref: string) => void;
  showOnlyMyDeals?: boolean;
  onToggleMyDeals?: () => void;
  currentUser?: any;
  teamData: any[];
  userInitials: string;
  isAdmin?: boolean; // Add admin prop
}

const DealsPivot: React.FC<DealsPivotProps> = ({ 
  deals, 
  handleOpenInstruction, 
  selectedDealRef, 
  onClearSelection,
  onSelectDeal,
  showOnlyMyDeals = false,
  onToggleMyDeals,
  currentUser,
  teamData,
  userInitials,
  isAdmin = false // Add isAdmin parameter
}) => {
  const [openFollowUpIdx, setOpenFollowUpIdx] = useState<number | null>(null);
  const [followUpContent, setFollowUpContent] = useState<string>("");
  const [showClosedDeals, setShowClosedDeals] = useState<boolean>(false);
  
  const filteredDeals = useMemo(() => {
    let dealsToShow = deals;
    
    // Apply "my deals" filter if enabled (removed selectedDealRef filtering)
    if (showOnlyMyDeals && currentUser) {
      // Filter deals that belong to the current user (you may need to adjust this logic based on your data structure)
      dealsToShow = deals.filter(deal => 
        deal.Email === currentUser.Email || 
        deal.Lead === currentUser.Email ||
        deal.assignedTo === currentUser.Email
      );
    }
    
    // Apply the closed deals filter
    if (!showClosedDeals) {
      dealsToShow = dealsToShow.filter(deal => String(deal.Status).toLowerCase() !== 'closed');
    }
    
    return dealsToShow;
  }, [deals, showClosedDeals, selectedDealRef, showOnlyMyDeals, currentUser]);
  
  const closedDealsCount = deals.filter(deal => String(deal.Status).toLowerCase() === 'closed').length;
  const openDealsCount = deals.length - closedDealsCount;
  
  const gridContainerStyle = mergeStyles({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "100%",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  });
  
  return (
    <div>
      {/* Toggle Controls */}
      {!selectedDealRef && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e1dfdd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>
              {showClosedDeals ? `All Deals (${deals.length})` : `Open Deals (${openDealsCount})`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Show Everyone's/Mine Toggle - Admin Only */}
            {isAdmin && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.85rem'
              }}>
                <span style={{ color: '#666' }}>
                  {showOnlyMyDeals ? 'Show Mine' : 'Show Everyone\'s'}
                </span>
                <div
                  onClick={onToggleMyDeals}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: showOnlyMyDeals ? '#0078d4' : '#d1d1d1',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: showOnlyMyDeals ? '18px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Show Closed Deals Toggle */}
            {closedDealsCount > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.85rem'
              }}>
                <span style={{ color: '#666' }}>Show closed deals ({closedDealsCount})</span>
                <div
                  onClick={() => setShowClosedDeals(!showClosedDeals)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: showClosedDeals ? '#0078d4' : '#d1d1d1',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: showClosedDeals ? '18px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={gridContainerStyle}>
        {filteredDeals.map((deal, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        const animationDelay = row * 0.2 + col * 0.1;
        const isClosed = String(deal.Status).toLowerCase() === "closed";
        const showFollowUpEditor = openFollowUpIdx === idx;
        return (
          <div key={idx} style={{ position: 'relative' }}>
            <DealCard
              deal={deal}
              animationDelay={animationDelay}
              onFollowUp={() => setOpenFollowUpIdx(idx)}
              teamData={null}
              userInitials={userInitials}
              isSingleView={selectedDealRef === deal.DealId}
              expanded={selectedDealRef === deal.InstructionRef}
              selected={selectedDealRef === deal.InstructionRef}
              onSelect={() => {
                // Toggle selection: if already selected, unselect; otherwise select
                if (selectedDealRef === deal.InstructionRef) {
                  onClearSelection?.();
                } else {
                  // Just select the deal for inline expansion
                  onSelectDeal?.(deal.InstructionRef);
                }
              }}
            />

            {showFollowUpEditor && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                background: '#fff',
                zIndex: 10,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                borderRadius: 8,
                padding: 24,
              }}>
                <InstructionEditor
                  value={followUpContent}
                  onChange={setFollowUpContent}
                  templates={[]}
                  showTemplateCallout={false}
                />
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <PrimaryButton
                    text="Send Follow Up"
                    onClick={() => {
                      // TODO: Implement follow up send logic
                      setOpenFollowUpIdx(null);
                    }}
                  />
                  <PrimaryButton
                    text="Cancel"
                    onClick={() => setOpenFollowUpIdx(null)}
                    styles={{ root: { background: '#eee', color: '#333' } }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
};

export default Instructions;