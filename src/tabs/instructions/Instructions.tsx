import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
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
  const overviewGridRef = useRef<HTMLDivElement | null>(null);
  const [pendingInstruction, setPendingInstruction] = useState<any | null>(null);
  const [forceNewMatter, setForceNewMatter] = useState(false);
  const [showCclDraftPage, setShowCclDraftPage] = useState(false);

  // Flat tab navigation: default to Clients (order displayed will be pitches, clients, risk)
  const [activeTab, setActiveTab] = useState<'clients' | 'pitches' | 'risk'>('clients');

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
  const [pitchStageFilter, setPitchStageFilter] = useState<'Active' | 'Closed' | 'All'>('Active');
  const [clientsActionFilter, setClientsActionFilter] = useState<'All' | 'Verify ID' | 'Assess Risk' | 'Open Matter' | 'Draft CCL' | 'Complete'>('All');
  const [riskStatusFilter, setRiskStatusFilter] = useState<'All' | 'Outstanding' | 'Completed'>('All');
  
  // Unified secondary filter state - tracks the secondary filter value for each tab
  const [secondaryFilter, setSecondaryFilter] = useState<string>(() => {
    switch (activeTab) {
      case 'clients': return clientsActionFilter;
      case 'pitches': return pitchStageFilter;
      case 'risk': return riskStatusFilter;
      default: return 'All';
    }
  });
  
  const [showApiDebugger, setShowApiDebugger] = useState(false);
  const [riskFilterRef, setRiskFilterRef] = useState<string | null>(null);
  const [selectedDealRef, setSelectedDealRef] = useState<string | null>(null);
  const [showOnlyMyDeals, setShowOnlyMyDeals] = useState<boolean>(false);
  const [showAllInstructions, setShowAllInstructions] = useState<boolean>(false); // Admin toggle
  
  // Debug toggles for admin/localhost
  const [useNewData, setUseNewData] = useState<boolean>(false);
  const [twoColumn, setTwoColumn] = useState<boolean>(false);
  
  const currentUser: UserData | undefined = userData?.[0] || (localUserData as UserData[])[0];
  // Admin detection using proper utility
  const isAdmin = isAdminUser(userData?.[0] || null);
  const isLocalhost = (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Debug logging for admin status
  React.useEffect(() => {
    console.log('Admin Detection Debug:', {
      userData: userData?.[0],
      userInitials: userData?.[0]?.Initials,
      isAdmin,
      showAllInstructions,
      allInstructionDataLength: allInstructionData.length,
      effectiveDataLength: instructionData.length
    });
  }, [isAdmin, userData, showAllInstructions, allInstructionData.length, instructionData.length]);
  
  // Get effective instruction data based on admin mode
  const effectiveInstructionData = useMemo(() => {
    if (isAdmin && showAllInstructions && allInstructionData.length > 0) {
      return allInstructionData;
    }
    return instructionData;
  }, [isAdmin, showAllInstructions, allInstructionData, instructionData]);
  
  const showDraftPivot = true; // Allow all users to see Document editor

  // Unified filter configuration
  const filterOptions: TwoLayerFilterOption[] = [
    {
      key: 'pitches',
      label: 'Pitches',
      subOptions: [
        { key: 'Active', label: 'Active' },
        { key: 'Closed', label: 'Closed' },
        { key: 'All', label: 'All' },
        ...(isAdmin ? [
          { key: 'Mine', label: 'Mine' },
          { key: 'Everyone', label: 'Everyone' }
        ] : [])
      ]
    },
    {
      key: 'clients',
      label: 'Clients',
      subOptions: [
        { key: 'All', label: 'All' },
        { key: 'Verify ID', label: 'Verify ID' },
        { key: 'Assess Risk', label: 'Assess Risk' },
        { key: 'Open Matter', label: 'Open Matter' },
        { key: 'Draft CCL', label: 'Draft CCL' },
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
    setActiveTab(key as 'clients' | 'pitches' | 'risk');
    // Reset secondary filter to the default for the new tab
    switch (key) {
      case 'clients':
        setSecondaryFilter(clientsActionFilter);
        break;
      case 'pitches':
        setSecondaryFilter(pitchStageFilter);
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
        // Handle special case for pitches - admin scope vs stage filter
        if (key === 'Mine' || key === 'Everyone') {
          setShowOnlyMyDeals(key === 'Mine');
        } else {
          setPitchStageFilter(key as any);
        }
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
        // For pitches, check if we have a valid stage filter value, otherwise use scope
        if (isAdmin && ['Mine', 'Everyone'].includes(secondaryFilter)) {
          // Keep the scope filter if it's already set
          setSecondaryFilter(showOnlyMyDeals ? 'Mine' : 'Everyone');
        } else {
          setSecondaryFilter(pitchStageFilter);
        }
        break;
      case 'risk':
        setSecondaryFilter(riskStatusFilter);
        break;
    }
  }, [activeTab, clientsActionFilter, pitchStageFilter, riskStatusFilter, showOnlyMyDeals, isAdmin, secondaryFilter]);

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

  useEffect(() => {
    if (activeTab !== "pitches") {
      setSelectedDealRef(null);
      setShowOnlyMyDeals(false);
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
        ) : selectedDealRef ? (
          <div className={detailNavStyle(isDarkMode)}>
            <div 
              className="nav-back-button"
              onClick={() => setSelectedDealRef(null)}
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
              title="Back to Deals"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedDealRef(null);
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
                Back to Deals
              </span>
            </div>
            
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: isDarkMode ? colours.dark.text : colours.light.text,
              marginLeft: '8px'
            }}>
              Deal: {selectedDealRef}
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
              <div style={{ display:'flex', alignItems:'center', gap:24, width:'100%' }}>
                <TwoLayerFilter
                  id="instructions-unified-filter"
                  ariaLabel="Instructions navigation and filtering"
                  primaryValue={activeTab}
                  secondaryValue={secondaryFilter}
                  onPrimaryChange={handlePrimaryFilterChange}
                  onSecondaryChange={handleSecondaryFilterChange}
                  options={filterOptions}
                />
                {/* Spacer */}
                <div style={{ flex: 1 }} />
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
                      color: isDarkMode ? '#ffe9a3' : '#5d4700'
                    }}
                    title="Admin / debug controls"
                  >
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
                        key={`admin-toggle-${showAllInstructions}`}
                        id="instructions-all-users-toggle"
                        checked={showAllInstructions}
                        onChange={(checked) => {
                          console.log('Admin toggle changed:', checked ? 'All Instructions' : 'My Instructions');
                          // Force synchronous state update
                          flushSync(() => {
                            setShowAllInstructions(checked);
                          });
                        }}
                        size="sm"
                        onText="All"
                        offText="Mine"
                        ariaLabel="Toggle between my instructions and all instructions"
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
    selectedDealRef,
    riskFilterRef,
    pitchStageFilter,
    clientsActionFilter,
    riskStatusFilter,
    secondaryFilter,
    showOnlyMyDeals,
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
          prospectId: prospect.prospectId,
          documentCount: docs ? docs.length : 0,
        };
      });

      return instructionItems;
    });

    const unique: Record<string, typeof items[number]> = {};
    items.forEach((item) => {
      const ref = item.instruction?.InstructionRef as string | undefined;
      if (ref && !unique[ref]) {
        unique[ref] = item;
      }
    });
    return Object.values(unique);
  }, [effectiveInstructionData]);

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

          if (d.LeadClientEmail) {
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
    [effectiveInstructionData],
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

  // Filter deals by claim & stage
  const filteredDeals = useMemo(()=> deals.filter(d => {
    if (pitchStageFilter === 'Active' && String(d.Status).toLowerCase()==='closed') return false;
    if (pitchStageFilter === 'Closed' && String(d.Status).toLowerCase()!=='closed') return false;
    if (!isAdmin && showOnlyMyDeals && currentUser?.Email) {
      const em = currentUser.Email.toLowerCase();
      if (!((d.LeadClientEmail||'').toLowerCase()===em || (d.Email||'').toLowerCase()===em || (d.assignedTo||'').toLowerCase()===em)) return false;
    }
    return true;
  }), [deals, pitchStageFilter, showOnlyMyDeals, isAdmin, currentUser]);

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

  const handleEIDCheck = (inst: any) => {
    setSelectedInstruction(inst);
    setPendingInstructionRef('');
    setShowEIDPage(true);
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
    gridTemplateColumns: twoColumn ? 'repeat(2, minmax(0,1fr))' : '1fr',
    gap: twoColumn ? '16px' : '8px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    transition: 'grid-template-columns .25s ease',
  }, twoColumn && 'two-col-grid');

  const overviewItemStyle = mergeStyles({
    minWidth: 350,
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
    // For deals, don't change filtering - cards should expand inline instead
    if (activeTab === "pitches") {
      // No longer filtering to single deal view - cards handle their own expansion
      return;
    } else {
      // Navigate to the risk compliance view for this specific instruction
      setRiskFilterRef(ref);
      setActiveTab('risk');
    }
  }

  return (
    <>
    <section className="page-section">
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <div className={sectionContainerStyle(isDarkMode)}>
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
        {filteredOverviewItems.map((item, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  return (
                    <div key={`instruction-${item.instruction.InstructionRef}-${selectedInstruction?.InstructionRef === item.instruction.InstructionRef ? 'selected' : 'unselected'}`} className={overviewItemStyle}>
                      <InstructionCard
                        index={idx}
                        key={`card-${item.instruction.InstructionRef}-${selectedInstruction?.InstructionRef === item.instruction.InstructionRef}`}
                        instruction={item.instruction as any}
                        deal={(item as any).deal}
                        deals={item.deals}
                        clients={item.clients}
                        risk={(item as any).risk}
                        eid={(item as any).eid}
                        eids={(item as any).eids}
                        compliance={undefined}
                        documents={item.documents}
                        prospectId={item.prospectId}
                        documentCount={item.documentCount ?? 0}
                        animationDelay={animationDelay}
                        expanded={overviewItems.length === 1 || selectedInstruction?.InstructionRef === item.instruction.InstructionRef}
                        selected={selectedInstruction?.InstructionRef === item.instruction.InstructionRef}
                        onSelect={() => {
                          // Toggle selection: if already selected, unselect; otherwise select
                          flushSync(() => {
                            if (selectedInstruction?.InstructionRef === item.instruction.InstructionRef) {
                              setSelectedInstruction(null);
                            } else {
                              setSelectedInstruction(item.instruction);
                            }
                          });
                        }}
                        onToggle={handleCardToggle}
                        onProofOfIdClick={() =>
                          handleOpenRiskCompliance(item.instruction.InstructionRef)
                        }
                      />
                    </div>

                  );
                })}
            </div>
          )}
      {activeTab === "pitches" && (
            <div>
              {/* Deals Section - Joint clients appear as pins within each deal card */}
              <DealsPivot
        deals={filteredDeals}
                handleOpenInstruction={handleOpenInstruction}
                selectedDealRef={selectedDealRef}
                onClearSelection={() => setSelectedDealRef(null)}
                onSelectDeal={(ref: string) => setSelectedDealRef(ref)}
                showOnlyMyDeals={showOnlyMyDeals}
                onToggleMyDeals={() => setShowOnlyMyDeals(!showOnlyMyDeals)}
                currentUser={currentUser}
                teamData={teamData || []}
                userInitials={userInitials || ''}
              />
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
          type: DialogType.normal,
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
  userInitials
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
            {/* Show Everyone's/Mine Toggle */}
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