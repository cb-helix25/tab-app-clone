import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
// invisible change 2
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
} from 'react-icons/fa';
import { MdOutlineArticle, MdArticle, MdOutlineWarning, MdWarning, MdAssessment, MdOutlineAssessment } from 'react-icons/md';
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
import { InstructionData, POID, TeamData } from "../../app/functionality/types";
import { hasActiveMatterOpening, clearMatterOpeningDraft } from "../../app/functionality/matterOpeningUtils";
import localInstructionData from "../../localData/localInstructionData.json";
import localInstructionCards from "../../localData/localInstructionCards.json";
import InstructionStateCard, { InstructionStateData } from "./InstructionStateCard";
import FlatMatterOpening from "./MatterOpening/FlatMatterOpening";
import RiskAssessmentPage from "./RiskAssessmentPage";
import EIDCheckPage from "./EIDCheckPage";
import InstructionEditor from "./components/InstructionEditor";
import InstructionBlockEditor from "./components/InstructionBlockEditor";
import PlaceholderIntegrationDemo from "./components/PlaceholderIntegrationDemo";
import "../../app/styles/InstructionsBanner.css";

interface InstructionsProps {
  userInitials: string;
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null;
  hasActiveMatter?: boolean;
  setIsInMatterOpeningWorkflow?: (inWorkflow: boolean) => void;
}
const Instructions: React.FC<InstructionsProps> = ({
  userInitials,
  poidData,
  setPoidData,
  teamData,
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

  // Clear selection when leaving overview tab
  useEffect(() => {
    if (activePivot !== "overview") {
      setSelectedInstruction(null);
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
        setInstructionData(localInstructionData as InstructionData[]);
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
                title="Deals"
                icon="Money"
                isDarkMode={isDarkMode}
                selected={activePivot === "deals"}
                onClick={() => setActivePivot("deals")}
                iconColor={activePivot === "deals" ? colours.cta : colours.greyText}
                orientation="row"
              />
              <QuickActionsCard
                title="Clients"
                icon="People"
                isDarkMode={isDarkMode}
                selected={activePivot === "clients"}
                onClick={() => setActivePivot("clients")}
                iconColor={activePivot === "clients" ? colours.cta : colours.greyText}
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
              />
              <QuickActionsCard
                title="Scenarios"
                icon="Settings"
                isDarkMode={isDarkMode}
                selected={activePivot === "states"}
                onClick={() => !isProduction && setActivePivot("states")}
                iconColor={activePivot === "states" ? colours.cta : colours.greyText}
                orientation="row"
                disabled={isProduction}
              />
              <QuickActionsCard
                title="Editor"
                icon="Edit"
                isDarkMode={isDarkMode}
                selected={activePivot === "demo"}
                onClick={() => !isProduction && setActivePivot("demo")}
                iconColor={activePivot === "demo" ? colours.cta : colours.greyText}
                orientation="row"
                disabled={isProduction}
              />
            </div>
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
          ...(prospect.electronicIDChecks ?? prospect.idVerifications ?? []),
          ...((inst as any).electronicIDChecks ??
            (inst as any).idVerifications ??
            []),
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
  const verifyButtonDisabled = verificationFound && poidPassed;
  const verifyButtonLabel = verificationFound
    ? poidPassed
      ? "ID Verified"
      : "Review ID"
    : "Verify ID";
  const disableOtherActions = !poidPassed;

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
            ...(p.jointClients ?? p.joinedClients ?? []),
            ...(d.jointClients ?? []),
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
      [...(p.jointClients ?? p.joinedClients ?? []), ...deals.flatMap((d) => d.jointClients ?? [])].forEach((jc) => {
        const key = jc.ClientEmail;
        const entry = map[key] || {
          ClientEmail: jc.ClientEmail,
          HasSubmitted: jc.HasSubmitted,
          Lead: false,
          deals: [] as DealSummary[],
        };
        entry.HasSubmitted = jc.HasSubmitted;
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
          return {
            ...r,
            EIDStatus: eid?.EIDStatus,
            instruction,
            deal,
            ServiceDescription: deal?.ServiceDescription,
            Stage: instruction?.Stage,
          };
        });
      }),
    [instructionData],
  );

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
            ...merged,
          },
        ];
      });
    });
  }, [instructionData]);

  const instructionCardStates = useMemo(() => {
    const map = new Map<string, InstructionStateData>();
    (localInstructionCards as InstructionStateData[]).forEach((state) => {
      if (!map.has(state.scenario)) {
        map.set(state.scenario, state);
      }
    });
    return Array.from(map.values());
  }, []);

  const handleOpenMatter = (inst: any) => {
    if (hasActiveMatterOpening()) {
      setPendingInstruction(inst);
      setIsResumeDialogOpen(true);
    } else {
      setSelectedInstruction(inst);
      setPendingInstructionRef('');
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


  const handleOpenInstruction = (ref: string) => {
    setActivePivot("overview");
  };

  const gridContainerStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "16px",
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  });

  const scenariosContainerStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    maxWidth: "600px",
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
    // Wait for the card to finish expanding/collapsing before recalculating
    setTimeout(repositionMasonry, 0);
  }, [repositionMasonry]);

  useLayoutEffect(() => {
    repositionMasonry();
  }, [overviewItems, selectedInstruction, repositionMasonry]);

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


  if (showNewMatterPage) {
    // Preselect POIDs by matching InstructionRef
    let preselectedPoidIds: string[] = [];
    if (selectedInstruction && selectedInstruction.InstructionRef) {
      // Use idVerificationOptions (the POID data) to find all POIDs with matching InstructionRef
      preselectedPoidIds = (idVerificationOptions || [])
        .filter((poid: any) => poid && (poid.InstructionRef === selectedInstruction.InstructionRef))
        .map((poid: any) => String(poid.poid_id))
        .filter(Boolean);
    }
    return (
      <Stack tokens={dashboardTokens} className={newMatterContainerStyle}>
        <FlatMatterOpening
          poidData={idVerificationOptions}
          setPoidData={setPoidData}
          teamData={teamData}
          userInitials={userInitials}
          instructionRef={selectedInstruction?.InstructionRef}
          stage={selectedInstruction?.Stage}
          clientId={selectedInstruction?.prospectId?.toString()}
          hideClientSections={!selectedInstruction}
          initialClientType={selectedInstruction?.ClientType}
          preselectedPoidIds={preselectedPoidIds}
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


  return (
    <>
    <section className="page-section">
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <div className="disclaimer animate-disclaimer">
          <p>Note: This module is visible only to Alex (AC), Jonathan (JW), Luke (LZ), Kanchel (KW), Billy (BL), Richard (RC), and Josh (JWH).</p>
        </div>
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
                        selected={selectedInstruction?.InstructionRef === item.instruction.InstructionRef}
                        onSelect={() => setSelectedInstruction(item.instruction)}
                        onToggle={handleCardToggle}
                      />
                    </div>

                  );
                })}
                {unlinkedDeals.map((deal, idx) => {
                  const base = overviewItems.length + idx;
                  const row = Math.floor(base / 4);
                  const col = base % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  return (
                    <div key={`unlinked-${idx}`} className={overviewItemStyle}>
                      <DealCard
                        deal={deal}
                        animationDelay={animationDelay}
                      />
                    </div>
                );
              })}
            </div>
          )}
          {activePivot === "deals" && (
            <DealsPivot
              deals={deals}
              handleOpenInstruction={handleOpenInstruction}
            />
          )}
          {activePivot === "clients" && (
            <div className={gridContainerStyle}>
              {clients.map((c, idx) => {
                const row = Math.floor(idx / 4);
                const col = idx % 4;
                const animationDelay = row * 0.2 + col * 0.1;
                // Gather all instructions for lookup by email
                const allInstructions = instructionData.flatMap(p => p.instructions ?? []);
                return (
                  <JointClientCard
                    key={idx}
                    client={c}
                    animationDelay={animationDelay}
                    onOpenInstruction={handleOpenInstruction}
                    allInstructions={allInstructions}
                  />
                );
              })}
            </div>
          )}
          {activePivot === "risk" && (
            <>
              <Text
                variant="mediumPlus"
                styles={{ root: { fontWeight: 600, marginBottom: 8 } }}
              >
                Risk &amp; Compliance
              </Text>
              <div className={gridContainerStyle}>
                {riskComplianceData.length === 0 && (
                  <Text>No risk data available.</Text>
                )}
                {riskComplianceData.map((r, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  return (
                    <RiskComplianceCard
                      key={idx}
                      data={r}
                      animationDelay={animationDelay}
                      onOpenInstruction={() =>
                        handleOpenInstruction(r.MatterId)
                      }
                    />
                  );
                })}
              </div>
            </>
          )}
          {activePivot === "states" && (
            <div className={scenariosContainerStyle}>
              {instructionCardStates.map((state, idx) => (
                <InstructionStateCard key={idx} data={state} />
              ))}
            </div>
          )}
          {activePivot === "demo" && (
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ color: colours.darkBlue, marginBottom: '16px' }}>
                Instructions Editor
              </h2>
              <p style={{ color: colours.greyText, marginBottom: '24px' }}>
                Create professional instruction content using templates and placeholders
              </p>
              <InstructionBlockEditor 
                value=""
                onChange={(value) => console.log('Editor content:', value)}
              />
            </div>
          )}
        </div>
        {/* Global Action Area - always visible, enhanced when instruction selected */}
        {activePivot === "overview" && !showNewMatterPage && !showRiskPage && !showEIDPage && (
          <div 
            className="global-action-area"
            style={{
              opacity: 1, // Always visible
              transform: 'translateY(0)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              pointerEvents: 'auto', // Always interactive
            }}
          >
            <button
              className={`global-action-btn${verifyButtonDisabled ? ' completed' : ''}`}
              onClick={handleGlobalEIDCheck}
              onMouseDown={e => e.currentTarget.classList.add('pressed')}
              onMouseUp={e => e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: verifyButtonDisabled
                  ? 'var(--helix-green, #107c10)'
                  : selectedInstruction
                  ? '#3690CE'
                  : undefined,
                backgroundColor: verifyButtonDisabled
                  ? 'rgba(115, 171, 96, 0.2)'
                  : undefined,
                opacity: 1, // Always visible
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s, border-color 0.2s ease',
                pointerEvents: verifyButtonDisabled ? 'none' : 'auto',
              }}
            >
              <span
                className="global-action-icon icon-hover"
                style={{
                  color: verifyButtonDisabled
                    ? 'var(--helix-green, #107c10)'
                    : selectedInstruction
                    ? '#3690CE'
                    : undefined,
                }}
              >
                <FaRegIdBadge className="icon-outline" />
                <FaIdBadge className="icon-filled" />
              </span>
              <span
                className="global-action-label"
                style={{
                  color: verifyButtonDisabled
                    ? 'var(--helix-green, #107c10)'
                    : selectedInstruction
                    ? '#3690CE'
                    : undefined,
                }}
              >
                {verifyButtonLabel}
              </span>
            </button>
            <button
              className="global-action-btn"
              onClick={handleGlobalRiskAssessment}
              onMouseDown={e => e.currentTarget.classList.add('pressed')}
              onMouseUp={e => e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: selectedInstruction && !disableOtherActions ? '#3690CE' : undefined,
                opacity: disableOtherActions ? 0.5 : 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s, border-color 0.2s ease',
                pointerEvents: disableOtherActions ? 'none' : 'auto',
              }}
            >
              <span className="global-action-icon icon-hover" style={{
                color: selectedInstruction && !disableOtherActions ? '#3690CE' : undefined,
              }}>
                <MdOutlineAssessment className="icon-outline" />
                <MdAssessment className="icon-filled" />
              </span>
              <span className="global-action-label" style={{
                color: selectedInstruction && !disableOtherActions ? '#3690CE' : undefined,
              }}>
                Assess Risk
              </span>
            </button>
            <button
              className="global-action-btn"
              onClick={handleGlobalOpenMatter}
              onMouseDown={e => e.currentTarget.classList.add('pressed')}
              onMouseUp={e => e.currentTarget.classList.remove('pressed')}
              onMouseLeave={e => e.currentTarget.classList.remove('pressed')}
              style={{
                borderColor: selectedInstruction && !disableOtherActions ? '#3690CE' : undefined,
                opacity: disableOtherActions ? 0.5 : 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.3s ease 0.3s, transform 0.3s ease 0.3s, border-color 0.2s ease',
                position: 'relative',
                pointerEvents: disableOtherActions ? 'none' : 'auto',
              }}
            >
              <span className="global-action-icon icon-hover" style={{
                color: selectedInstruction && !disableOtherActions ? '#3690CE' : undefined,
              }}>
                <FaRegFolder className="icon-outline" />
                <FaFolder className="icon-filled" />
              </span>
              <span className="global-action-label" style={{
                color: selectedInstruction && !disableOtherActions ? '#3690CE' : undefined,
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
              setShowNewMatterPage(true);
            }}
            text="Resume"
          />
          <DefaultButton
            onClick={() => {
              clearMatterOpeningDraft();
              setIsResumeDialogOpen(false);
              setSelectedInstruction(pendingInstruction);
              setShowNewMatterPage(true);
            }}
            text="Start New"
          />
        </DialogFooter>
      </Dialog>
    </>
  );
};

// --- DealsPivot extracted to fix React hooks error ---
interface DealsPivotProps {
  deals: any[];
  handleOpenInstruction: (ref: string) => void;
}

const DealsPivot: React.FC<DealsPivotProps> = ({ deals, handleOpenInstruction }) => {
  const [openFollowUpIdx, setOpenFollowUpIdx] = useState<number | null>(null);
  const [followUpContent, setFollowUpContent] = useState<string>("");
  const gridContainerStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "16px",
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  });
  return (
    <div className={gridContainerStyle}>
      {deals.map((deal, idx) => {
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
  );
};

export default Instructions;