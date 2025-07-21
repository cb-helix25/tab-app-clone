import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
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
import QuickActionsCard from "../home/QuickActionsCard";
import { useTheme } from "../../app/functionality/ThemeContext";
import { useNavigator } from "../../app/functionality/NavigatorContext";
import { colours } from "../../app/styles/colours";
import { dashboardTokens } from "./componentTokens";
import InstructionCard from "./InstructionCard";
import DealCard from "./DealCard";
import RiskComplianceCard from "./RiskComplianceCard";
import JointClientCard, { ClientInfo } from "./JointClientCard";
import type { DealSummary } from "./JointClientCard";
import { InstructionData, POID, TeamData, UserData } from "../../app/functionality/types";
import { hasActiveMatterOpening, clearMatterOpeningDraft } from "../../app/functionality/matterOpeningUtils";
import localInstructionData from "../../localData/localInstructionData.json";
import localInstructionCards from "../../localData/localInstructionCards.json";
import localIdVerifications from "../../localData/localIdVerifications.json";
import FlatMatterOpening from "./MatterOpening/FlatMatterOpening";
import RiskAssessmentPage from "./RiskAssessmentPage";
import EIDCheckPage from "./EIDCheckPage";
import InstructionEditor from "./components/InstructionEditor";
import InstructionBlockEditor from "./components/InstructionBlockEditor";
import PlaceholderIntegrationDemo from "./components/PlaceholderIntegrationDemo";
import "../../app/styles/InstructionsBanner.css";
// invisible change 2.2
import DocumentEditorPage from "./DocumentEditorPage";
import DocumentsV3 from "./DocumentsV3";
import localUserData from "../../localData/localUserData.json";

interface InstructionsProps {
  userInitials: string;
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null;
  userData?: UserData[] | null;
  hasActiveMatter?: boolean;
  setIsInMatterOpeningWorkflow?: (inWorkflow: boolean) => void;
}
const Instructions: React.FC<InstructionsProps> = ({
  userInitials,
  poidData,
  setPoidData,
  teamData,
  userData,
  hasActiveMatter = false,
  setIsInMatterOpeningWorkflow,
}) => {
  const { isDarkMode } = useTheme();
  const { setContent } = useNavigator();
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);
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
      }
    }
  }, []); // Only run on mount
  
  const [activePivot, setActivePivot] = useState<string>("overview");
  const [riskFilterRef, setRiskFilterRef] = useState<string | null>(null);
  const [selectedDealRef, setSelectedDealRef] = useState<string | null>(null);
  const [showOnlyMyDeals, setShowOnlyMyDeals] = useState<boolean>(false);
  const currentUser: UserData | undefined = userData?.[0] || (localUserData as UserData[])[0];
  const showDraftPivot = true; // Allow all users to see Document editor

  // Clear selection when leaving overview tab
  useEffect(() => {
    if (activePivot !== "overview") {
      setSelectedInstruction(null);
    }
  }, [activePivot]);

  useEffect(() => {
    if (activePivot !== "risk") {
      setRiskFilterRef(null);
    }
  }, [activePivot]);

  useEffect(() => {
    if (activePivot !== "deals-clients") {
      setSelectedDealRef(null);
      setShowOnlyMyDeals(false);
    }
  }, [activePivot]);

  const ACTION_BAR_HEIGHT = 48;

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      boxShadow: dark
        ? "0 2px 4px rgba(0,0,0,0.4)"
        : "0 2px 4px rgba(0,0,0,0.1)",
      padding: "0 24px",
      transition: "background-color 0.3s",
      display: "flex",
      flexDirection: "row",
      gap: "8px",
      overflowX: "auto",
      msOverflowStyle: "none",
      scrollbarWidth: "none",
      alignItems: "center",
      height: ACTION_BAR_HEIGHT,
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
        ? "0 2px 4px rgba(0,0,0,0.4)"
        : "0 2px 4px rgba(0,0,0,0.1)",
      borderTop: dark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.05)",
      padding: "0 24px",
      display: "flex",
      flexDirection: "row",
      gap: "8px",
      alignItems: "center",
      height: ACTION_BAR_HEIGHT,
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

  useEffect(() => {
    async function fetchData() {
      // During the pilot we always pull Lukasz's instructions so everyone
      // sees populated data regardless of their own initials. Once testing is
      // complete we'll request each user's own data.
      const pilotUsers = ["AC", "JW", "KW", "BL", "LZ"];
      const targetInitials = pilotUsers.includes(userInitials) ? "LZ" : userInitials;

      if (useLocalData) {
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
        return;
      }
      const baseUrl = process.env.REACT_APP_PROXY_BASE_URL;
      const path = process.env.REACT_APP_GET_INSTRUCTION_DATA_PATH;
      const code = process.env.REACT_APP_GET_INSTRUCTION_DATA_CODE;
      if (!baseUrl || !path || !code) {
        console.error("Missing env variables for instruction data");
        return;
      }

      try {
        const url = `${baseUrl}/${path}?code=${code}&initials=${targetInitials}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setInstructionData(Array.isArray(data) ? data : [data]);
        } else {
          console.error(
            "Failed to fetch instructions for user",
            targetInitials,
          );
        }
      } catch (err) {
        console.error(
          "Error fetching instructions for user",
          targetInitials,
          err,
        );
      }
    }
    fetchData();
  }, [useLocalData]);

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
            {/* Quick Actions Bar with Pivot Navigation */}
            <div className={quickLinksStyle(isDarkMode)}>
              {/* Pivot Navigation as Quick Action Cards */}
              <QuickActionsCard
                title="Overview"
                icon="List"
                isDarkMode={isDarkMode}
                selected={activePivot === "overview"}
                onClick={() => setActivePivot("overview")}
                iconColor={activePivot === "overview" ? colours.cta : colours.greyText}
                orientation="row"
              />
              <QuickActionsCard
                title="Deals & Clients"
                icon="People"
                isDarkMode={isDarkMode}
                selected={activePivot === "deals-clients"}
                onClick={() => setActivePivot("deals-clients")}
                iconColor={activePivot === "deals-clients" ? colours.cta : colours.greyText}
                orientation="row"
              />
              <QuickActionsCard
                title="Risk & Compliance"
                icon="Shield"
                isDarkMode={isDarkMode}
                selected={activePivot === "risk"}
                onClick={() => setActivePivot("risk")}
                iconColor={activePivot === "risk" ? colours.cta : colours.greyText}
                orientation="row"
              />            </div>
          </>
        )}
      </>,
    );
    return () => setContent(null);
  }, [
    setContent,
    isDarkMode,
    instructionData,
    activePivot,
    showNewMatterPage,
    showRiskPage,
    showEIDPage,
    selectedInstruction,
    hasActiveMatter,
    selectedDealRef,
    riskFilterRef,
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
      paddingBottom: activePivot === "overview" ? "120px" : "16px", // Add bottom padding for global action area
      borderRadius: 0,
      boxShadow: dark
        ? `0 4px 12px ${colours.dark.border}`
        : `0 4px 12px ${colours.light.border}`,
      width: "100%",
    });

  const overviewItems = useMemo(() => {
    const items = instructionData.flatMap((prospect) => {
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
        const docs = [
          ...(prospect.documents ?? []),
          ...((inst as any).documents ?? []),
          ...dealsForInst.flatMap((d) => [
            ...(d.documents ?? []),
            ...(d.instruction?.documents ?? []),
          ]),
        ];
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
  }, [instructionData]);

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
  const poidPassed = poidResult === "passed" || poidResult === "approved";
  const verificationFound = !!selectedOverviewItem?.eid;
  const verifyButtonReview = verificationFound && !poidPassed;
  const verifyButtonDisabled = verificationFound && poidPassed;
  const verifyButtonLabel = verificationFound
    ? poidPassed
      ? "ID Verified"
      : "Review ID"
    : "Verify ID";

  const riskResult =
    selectedOverviewItem?.risk?.RiskAssessmentResult?.toString().toLowerCase() ?? "";
  const riskButtonDisabled = !!riskResult;
  
  // Payment status logic
  const paymentResult = selectedOverviewItem?.instruction?.PaymentResult?.toLowerCase();
  const paymentCompleted = paymentResult === "successful";
  
  // Open Matter button should only be enabled when both ID is verified AND payment is complete
  const canOpenMatter = poidPassed && paymentCompleted;
  
  const disableOtherActions = false; // Enable all actions regardless of selection

  const unlinkedDeals = useMemo(
    () =>
      instructionData.flatMap((p) =>
        (p.deals ?? []).filter((d) => !d.InstructionRef),
      ),
    [instructionData],
  );

  const instructionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const deals = useMemo(
    () =>
      instructionData.flatMap((p) =>
        (p.deals ?? []).map((d) => ({
          ...d,
          firstName: p.instructions?.[0]?.FirstName,
          jointClients: [
            // Only include prospect-level joint clients that match this deal's DealId
            ...(p.jointClients ?? p.joinedClients ?? []).filter(jc => jc.DealId === d.DealId),
            // Include deal-level joint clients
            ...(d.jointClients ?? []),
          ],
          documents: [
            // Include prospect-level documents that match this deal's DealId
            ...(p.documents ?? []).filter(doc => doc.DealId === d.DealId),
            // Include deal-level documents
            ...(d.documents ?? []),
            // Include instruction-level documents if deal has an instruction
            ...(d.instruction?.documents ?? []),
          ],
        })),
      ),
    [instructionData],
  );
  const clients: ClientInfo[] = useMemo(() => {
    const map: Record<string, ClientInfo> = {};
    instructionData.forEach((p) => {
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
  }, [instructionData]);

  const riskComplianceData = useMemo(
    () =>
      instructionData.flatMap((p) => {
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
    [instructionData],
  );

  const filteredRiskComplianceData = useMemo(
    () =>
      riskComplianceData.filter((r) =>
        riskFilterRef ? r.MatterId === riskFilterRef : true,
      ),
    [riskComplianceData, riskFilterRef],
  );

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
      const instructionItem = instructionData.find(p => 
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
          
          enhancedClients.push({
            ClientEmail: instruction.Email,
            FirstName: instruction.FirstName || instruction.Name?.split(' ')[0] || 'Client',
            LastName: instruction.LastName || instruction.Name?.split(' ').slice(1).join(' ') || '',
            CompanyName: instruction.CompanyName,
            Lead: true,
            HasSubmitted: true, // If instruction exists, they've submitted
            idVerification: leadIdVerification
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
          
          enhancedClients.push({
            ClientEmail: jc.ClientEmail,
            FirstName: jointInstruction?.FirstName || jc.FirstName || jc.Name?.split(' ')[0],
            LastName: jointInstruction?.LastName || jc.LastName || jc.Name?.split(' ').slice(1).join(' '),
            CompanyName: jointInstruction?.CompanyName || jc.CompanyName,
            Lead: false,
            HasSubmitted: jc.HasSubmitted || Boolean(jointInstruction),
            idVerification: jointIdVerification
          });
        });
        
        // Replace the clients array with enhanced data
        if (enhancedClients.length > 0) {
          group.clients = enhancedClients;
        }
      }
    });

    return Array.from(grouped.values());
  }, [filteredRiskComplianceData, instructionData]);

  const idVerificationOptions = useMemo(() => {
    const seen = new Set<string>();
    return instructionData.flatMap((p) => {
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
  }, [instructionData]);

  const handleOpenMatter = (inst: any) => {
    if (hasActiveMatterOpening()) {
      setPendingInstruction(inst);
      setIsResumeDialogOpen(true);
    } else {
      setSelectedInstruction(inst);
      setPendingInstructionRef('');
      setForceNewMatter(false);
      setShowNewMatterPage(true);
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
    setActivePivot('risk');
  };


  // Always open CCL template for global Draft CCL action
  const handleOpenDraftCcl = (ref: string) => {
    setSelectedInstruction({ InstructionRef: ref } as any);
    // Set a global variable or state to force initialTemplate to 'ccl'
    // If DocumentsV3 is rendered here, pass initialTemplate='ccl' directly
    // If not, ensure the prop is always 'ccl' for this action
    setActivePivot('draft-ccl');
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gridAutoRows: "8px",
    gap: "16px",
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
    boxSizing: "border-box",
    alignItems: "start",
  });

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
      activePivot === "overview" &&
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
    activePivot,
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
    // Filter to show only this deal and expand it to full width
    if (activePivot === "deals-clients") {
      setSelectedDealRef(ref);
    } else {
      // Navigate to the risk compliance view for this specific instruction
      setRiskFilterRef(ref);
      setActivePivot('risk');
    }
  }

  return (
    <>
    <section className="page-section">
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <div className={sectionContainerStyle(isDarkMode)}>
          {activePivot === "overview" && (
              <div className={overviewGridStyle} ref={overviewGridRef}>
                {overviewItems.map((item, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  return (
                    <div key={idx} className={overviewItemStyle}>
                      <InstructionCard
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
                          if (selectedInstruction?.InstructionRef === item.instruction.InstructionRef) {
                            setSelectedInstruction(null);
                          } else {
                            setSelectedInstruction(item.instruction);
                          }
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
          {activePivot === "deals-clients" && (
            <div>
              {/* Deals Section - Joint clients appear as pins within each deal card */}
              <DealsPivot
                deals={deals}
                handleOpenInstruction={handleOpenInstruction}
                selectedDealRef={selectedDealRef}
                onClearSelection={() => setSelectedDealRef(null)}
                showOnlyMyDeals={showOnlyMyDeals}
                onToggleMyDeals={() => setShowOnlyMyDeals(!showOnlyMyDeals)}
                currentUser={currentUser}
                teamData={teamData || []}
                userInitials={userInitials || ''}
              />
            </div>
          )}
          {activePivot === "risk" && (
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
          {activePivot === "documents" && (
            <DocumentEditorPage 
              matterId={selectedInstruction?.InstructionRef} 
              instruction={selectedInstruction}
              instructions={instructionData}
            />
          )}
          {activePivot === "documents2" && (
            <DocumentsV3
              selectedInstructionProp={selectedInstruction}
              initialTemplate={selectedInstruction ? 'ccl' : undefined}
              instructions={instructionData}
            />
          )}
        </div>
        {/* Global Action Area - always visible, enhanced when instruction selected */}
        {activePivot === "overview" && !showNewMatterPage && !showRiskPage && !showEIDPage && (
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
              className={`global-action-btn${verifyButtonDisabled ? ' completed' : verifyButtonReview ? ' review' : ''}${selectedInstruction ? ' selected' : ''}`}
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
              className={`global-action-btn${riskButtonDisabled ? ' completed' : ''}${selectedInstruction ? ' selected' : ''}`}
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
              className={`global-action-btn${selectedInstruction ? ' selected' : ''}`}
              onClick={canOpenMatter ? handleGlobalOpenMatter : undefined}
              onMouseDown={e => canOpenMatter && e.currentTarget.classList.add('pressed')}
              onMouseUp={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: selectedInstruction ? '#3690CE' : undefined,
                opacity: canOpenMatter ? 1 : 0.5,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.3s, transform 0.3s ease 0.3s, border-color 0.2s ease',
                position: 'relative',
                pointerEvents: canOpenMatter ? 'auto' : 'none',
                cursor: canOpenMatter ? 'pointer' : 'not-allowed',
                backgroundColor: canOpenMatter ? undefined : '#f5f5f5',
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
                <FaFolder className="icon-outline" />
                <FaRegFolder className="icon-filled" />
              </span>
              <span className="global-action-label" style={{
                color: selectedInstruction ? '#3690CE' : undefined,
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
              className={`global-action-btn${selectedInstruction ? ' selected' : ''}`}
              onClick={canOpenMatter ? () => setActivePivot("documents2") : undefined}
              onMouseDown={e => canOpenMatter && e.currentTarget.classList.add('pressed')}
              onMouseUp={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => canOpenMatter && e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: selectedInstruction ? '#3690CE' : undefined,
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
                color: selectedInstruction ? '#3690CE' : undefined,
              }}>
                <FaFileAlt className="icon-outline" />
                <FaRegFileAlt className="icon-filled" />
              </span>
              <span className="global-action-label" style={{
                color: selectedInstruction ? '#3690CE' : undefined,
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
    
    // If a specific deal is selected, show only that deal
    if (selectedDealRef) {
      dealsToShow = deals.filter(deal => deal.InstructionRef === selectedDealRef);
    } else {
      // Apply "my deals" filter if enabled
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
    }
    
    return dealsToShow;
  }, [deals, showClosedDeals, selectedDealRef, showOnlyMyDeals, currentUser]);
  
  const closedDealsCount = deals.filter(deal => String(deal.Status).toLowerCase() === 'closed').length;
  const openDealsCount = deals.length - closedDealsCount;
  
  const gridContainerStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: selectedDealRef ? "1fr" : "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "16px",
    maxWidth: selectedDealRef ? "100%" : "1440px",
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
              teamData={teamData}
              userInitials={userInitials}
              isSingleView={!!selectedDealRef}
              onFollowUp={
                isClosed
                  ? undefined
                  : () => {
                      setOpenFollowUpIdx(idx);
                      setFollowUpContent("");
                    }
              }
              onOpenInstruction={
                deal.InstructionRef
                  ? () => handleOpenInstruction(deal.InstructionRef)
                  : undefined
              }
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