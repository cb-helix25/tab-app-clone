import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Stack,
  mergeStyles,
  IconButton,
  Pivot,
  PivotItem,
  Text,
} from "@fluentui/react";
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
import localInstructionData from "../../localData/localInstructionData.json";
import localInstructionCards from "../../localData/localInstructionCards.json";
import InstructionStateCard, { InstructionStateData } from "./InstructionStateCard";
import FlatMatterOpening from "./MatterOpening/FlatMatterOpening";
import RiskAssessmentPage from "./RiskAssessmentPage";
import EIDCheckPage from "./EIDCheckPage";
import "../../app/styles/InstructionsBanner.css";

interface InstructionsProps {
  userInitials: string;
  poidData: POID[];
  setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
  teamData?: TeamData[] | null;
}
const Instructions: React.FC<InstructionsProps> = ({
  userInitials,
  poidData,
  setPoidData,
  teamData,
}) => {
  const { isDarkMode } = useTheme();
  const { setContent } = useNavigator();
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);
  const [showNewMatterPage, setShowNewMatterPage] = useState<boolean>(false);
  const [showRiskPage, setShowRiskPage] = useState<boolean>(false);
  const [showEIDPage, setShowEIDPage] = useState<boolean>(false);
  /** Client type selection for the matter opening workflow */
  const [newMatterClientType, setNewMatterClientType] =
    useState<string>("Individual");
  const [selectedInstruction, setSelectedInstruction] = useState<any | null>(
    null,
  );
  const [activePivot, setActivePivot] = useState<string>("overview");

  const ACTION_BAR_HEIGHT = 48;

  const CLIENT_TYPE_OPTIONS = [
    { label: "Individual", icon: "Contact" },
    { label: "Company", icon: "CityNext" },
    { label: "Multiple Clients", icon: "People" },
    { label: "Existing Client", icon: "Folder" },
  ];

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: "0 24px",
      transition: "background-color 0.3s",
      display: "flex",
      flexDirection: "row",
      gap: "8px",
      overflowX: "auto",
      alignItems: "center",
      height: ACTION_BAR_HEIGHT,
      paddingBottom: 0,
      position: "sticky",
      top: ACTION_BAR_HEIGHT,
      zIndex: 999,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    });

  const detailNavStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
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
    } else if (showRiskPage) {
      setShowRiskPage(false);
    } else if (showEIDPage) {
      setShowEIDPage(false);
    }
  };

  useEffect(() => {
    setContent(
      <>
        {showNewMatterPage || showRiskPage || showEIDPage ? (
          <div className={detailNavStyle(isDarkMode)}>
            <IconButton
              iconProps={{ iconName: "ChevronLeft" }}
              onClick={handleBack}
              className={backButtonStyle}
              title="Back"
              ariaLabel="Back"
            />
            {showNewMatterPage &&
              CLIENT_TYPE_OPTIONS.map((opt, idx) => (
                <QuickActionsCard
                  key={opt.label}
                  title={opt.label}
                  icon={opt.icon}
                  isDarkMode={isDarkMode}
                  onClick={() => setNewMatterClientType(opt.label)}
                  selected={newMatterClientType === opt.label}
                  style={{ "--card-index": idx } as React.CSSProperties}
                />
              ))}
          </div>
        ) : (
          <>
            <div className={quickLinksStyle(isDarkMode)}>
              <QuickActionsCard
                title="New Matter"
                icon="Calendar"
                isDarkMode={isDarkMode}
                onClick={() => {
                  setSelectedInstruction(null);
                    setNewMatterClientType("Individual");
                    setShowNewMatterPage(true);
                  }}
                  style={{ "--card-index": 0 } as React.CSSProperties}
                />
                <QuickActionsCard
                  title="EID Check"
                  icon="IdCheck"
                  isDarkMode={isDarkMode}
                  onClick={() => {
                    setSelectedInstruction(null);
                    setShowEIDPage(true);
                  }}
                  style={{ "--card-index": 1 } as React.CSSProperties}
                />
                <QuickActionsCard
                  title="Risk Assessment"
                  icon="Assessment"
                  isDarkMode={isDarkMode}
                  onClick={() => { }}
                  style={{ "--card-index": 2 } as React.CSSProperties}
                />
                <QuickActionsCard
                  title="Draft CCL"
                  icon="OpenFile"
                  isDarkMode={isDarkMode}
                  onClick={() => setShowRiskPage(true)}
                  style={{ "--card-index": 3 } as React.CSSProperties}
                />
              </div>
              <div className={pivotBarStyle(isDarkMode)}>
                <Pivot
                  className="navigatorPivot"
                  selectedKey={activePivot}
                  onLinkClick={(item) => {
                    setActivePivot(item?.props.itemKey || "overview");
                }}
              >
                <PivotItem headerText="Overview" itemKey="overview" />
                <PivotItem headerText="Deals" itemKey="deals" />
                <PivotItem headerText="Clients" itemKey="clients" />
                <PivotItem headerText="Risk & Compliance" itemKey="risk" />
                  {useLocalData && (
                    <PivotItem headerText="Scenarios" itemKey="states" />
                  )}
              </Pivot>
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
    newMatterClientType,
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

  const backButtonStyle = mergeStyles({
    width: 32,
    height: 32,
    borderRadius: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : "#f3f3f3",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    marginRight: 8,
  });

  const sectionContainerStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: "16px",
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
        (prospect.jointClients ?? prospect.joinedClients ?? []).forEach(
          (jc) => {
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
                    Status: dealsForInst.find((d) => d.DealId === jc.DealId)
                      ?.Status,
                  },
                ],
              });
            }
          },
        );
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
        ];
        const risk = riskSource.find((r) => r.MatterId === inst.InstructionRef);
        const eids = eidSource.filter(
          (e) => (e.MatterId ?? e.InstructionRef) === inst.InstructionRef,
        );
        const eid = eids[0];
        let docs = prospect.documents?.filter(
          (d) => d.InstructionRef === inst.InstructionRef,
        );
        if ((!docs || docs.length === 0) && Array.isArray((inst as any).documents)) {
          docs = (inst as any).documents;
        }
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
          jointClients: p.jointClients ?? p.joinedClients ?? [],
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
      (p.jointClients ?? p.joinedClients ?? []).forEach((jc) => {
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
    const seen = new Set<number>();
    return instructionData.flatMap((p) => {
      const instructions = p.instructions ?? [];
      const all: any[] = [
        ...(p.electronicIDChecks ?? []),
        ...(p.idVerifications ?? []),
      ];
      instructions.forEach((inst: any) => {
        all.push(...(inst.electronicIDChecks ?? []));
        all.push(...(inst.idVerifications ?? []));
      });
      return all.flatMap((v) => {
        if (!v || seen.has(v.InternalId)) return [];
        seen.add(v.InternalId);
        const instRef = v.InstructionRef ?? v.MatterId;
        const inst = instructions.find(
          (i: any) => i.InstructionRef === instRef,
        );
        const merged: any = { ...v };
        delete merged.EIDRawResponse;
        return [
          {
            poid_id: String(v.InternalId ?? ""),
            prefix: inst?.Title,
            first: inst?.FirstName,
            last: inst?.LastName,
            company_name: inst?.CompanyName,
            nationality: inst?.Nationality,
            nationality_iso: inst?.NationalityAlpha2,
            date_of_birth: inst?.DOB,
            best_number: inst?.Phone,
            email: inst?.Email,
            passport_number: inst?.PassportNumber,
            drivers_license_number: inst?.DriversLicenseNumber,
            house_building_number: inst?.HouseNumber,
            street: inst?.Street,
            city: inst?.City,
            county: inst?.County,
            post_code: inst?.Postcode,
            country: inst?.Country,
            country_code: inst?.CountryCode,
            company_number: inst?.CompanyNumber,
            company_house_building_number: inst?.CompanyHouseNumber,
            company_street: inst?.CompanyStreet,
            company_city: inst?.CompanyCity,
            company_county: inst?.CompanyCounty,
            company_post_code: inst?.CompanyPostcode,
            company_country: inst?.CompanyCountry,
            company_country_code: inst?.CompanyCountryCode,
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
    setSelectedInstruction(inst);
    setNewMatterClientType(inst?.ClientType || "Individual");
    setShowNewMatterPage(true);
  };

  const handleRiskAssessment = (inst: any) => {
    setSelectedInstruction(inst);
    setShowRiskPage(true);
  };

  const handleEIDCheck = (inst: any) => {
    setSelectedInstruction(inst);
    setShowEIDPage(true);
  };

  const handleOpenInstruction = (ref: string) => {
    setActivePivot("overview");
  };

  const gridContainerStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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

  const overviewColumnStyle = mergeStyles({
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  });

  if (showNewMatterPage) {
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
          initialClientType={newMatterClientType}
        />
      </Stack>
    );
  }

  if (showRiskPage) {
    return (
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <RiskAssessmentPage
          onBack={() => setShowRiskPage(false)}
          instructionRef={selectedInstruction?.InstructionRef}
          riskAssessor={userInitials}
          existingRisk={selectedInstruction?.riskAssessments?.[0] ?? null}
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
    <section className="page-section">
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <div className="disclaimer animate-disclaimer">
          <p>Note: This module is visible only to Luke, Kanchel, Billy, Alex and Jonathan.</p>
        </div>
        <div className={sectionContainerStyle(isDarkMode)}>
          {activePivot === "overview" && (
            <div className={overviewColumnStyle}>
              {overviewItems.map((item, idx) => {
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                const animationDelay = row * 0.2 + col * 0.1;
                return (
                  <InstructionCard
                    key={idx}
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
                    expanded
                    onOpenMatter={() => handleOpenMatter(item.instruction)}
                    onRiskAssessment={() =>
                      handleRiskAssessment(item.instruction)
                    }
                    onEIDCheck={() => handleEIDCheck(item.instruction)}
                  />

                );
              })}
              {unlinkedDeals.map((deal, idx) => {
                const base = overviewItems.length + idx;
                const row = Math.floor(base / 2);
                const col = base % 2;
                const animationDelay = row * 0.2 + col * 0.1;
                return (
                  <DealCard
                    key={`unlinked-${idx}`}
                    deal={deal}
                    animationDelay={animationDelay}
                  />
                );
              })}
            </div>
          )}
          {activePivot === "deals" && (
            <div className={gridContainerStyle}>
              {deals.map((deal, idx) => {
                const row = Math.floor(idx / 4);
                const col = idx % 4;
                const animationDelay = row * 0.2 + col * 0.1;
                const isClosed = String(deal.Status).toLowerCase() === "closed";
                return (
                  <DealCard
                    key={idx}
                    deal={deal}
                    animationDelay={animationDelay}
                    onFollowUp={
                      isClosed
                        ? undefined
                        : () => console.log("Follow up", deal.DealId)
                    }
                    onOpenInstruction={
                      deal.InstructionRef
                        ? () => handleOpenInstruction(deal.InstructionRef)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
          {activePivot === "clients" && (
            <div className={gridContainerStyle}>
              {clients.map((c, idx) => {
                const row = Math.floor(idx / 4);
                const col = idx % 4;
                const animationDelay = row * 0.2 + col * 0.1;
                return (
                  <JointClientCard
                    key={idx}
                    client={c}
                    animationDelay={animationDelay}
                    onOpenInstruction={handleOpenInstruction}
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
        </div>
      </Stack>
    </section>
  );
};

export default Instructions;