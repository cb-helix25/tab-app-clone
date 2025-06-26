import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Stack,
  mergeStyles,
  IconButton,
  Pivot,
  PivotItem,
  Text,
} from '@fluentui/react';
import QuickActionsCard from '../home/QuickActionsCard';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigator } from '../../app/functionality/NavigatorContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens } from './componentTokens';
import InstructionCard from './InstructionCard';
import DealCard from './DealCard';
import RiskComplianceCard from './RiskComplianceCard';
import JointClientCard, { ClientInfo } from './JointClientCard';
import InstructionDashboard from './InstructionDashboard';
import type { DealSummary } from './JointClientCard';
import { InstructionData, POID, TeamData } from '../../app/functionality/types';
import localInstructionData from '../../localData/localInstructionData.json';
import NewMatters from './NewMatters';
import RiskAssessmentPage from './RiskAssessmentPage';

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
  /** Client type selection for the matter opening workflow */
  const [newMatterClientType, setNewMatterClientType] = useState<string>('Individual');
  const [selectedInstruction, setSelectedInstruction] = useState<any | null>(null);
  const [activePivot, setActivePivot] = useState<string>('overview');
  const [expandedInstructionRef, setExpandedInstructionRef] = useState<string | null>(null);

  const ACTION_BAR_HEIGHT = 48;

  const CLIENT_TYPE_OPTIONS = [
    'Individual',
    'Company',
    'Multiple Clients',
    'Existing Client',
  ];

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: '0 24px',
      transition: 'background-color 0.3s',
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      overflowX: 'auto',
      alignItems: 'center',
      height: ACTION_BAR_HEIGHT,
      paddingBottom: 0,
      position: 'sticky',
      top: ACTION_BAR_HEIGHT,
      zIndex: 999,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    });

  const pivotBarStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.4)'
        : '0 2px 4px rgba(0,0,0,0.1)',
      borderTop: dark
        ? '1px solid rgba(255,255,255,0.1)'
        : '1px solid rgba(0,0,0,0.05)',
      padding: '0 24px',
      transition: 'background-color 0.3s',
      position: 'sticky',
      top: ACTION_BAR_HEIGHT * 2,
      zIndex: 998,
    });

  const useLocalData =
    process.env.REACT_APP_USE_LOCAL_DATA === 'true' ||
    window.location.hostname === 'localhost';

  useEffect(() => {
    async function fetchData() {
      // During the pilot we always pull Lukasz's instructions so everyone
      // sees populated data regardless of their own initials.
      const targetInitials = 'LZ';

      if (useLocalData) {
        setInstructionData(localInstructionData as InstructionData[]);
        return;
      }
      const baseUrl = process.env.REACT_APP_PROXY_BASE_URL;
      const path = process.env.REACT_APP_GET_INSTRUCTION_DATA_PATH;
      const code = process.env.REACT_APP_GET_INSTRUCTION_DATA_CODE;
      if (!baseUrl || !path || !code) {
        console.error('Missing env variables for instruction data');
        return;
      }

      try {
        const url = `${baseUrl}/${path}?code=${code}&initials=${targetInitials}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setInstructionData(Array.isArray(data) ? data : [data]);
        } else {
          console.error('Failed to fetch instructions for user', targetInitials);
        }
      } catch (err) {
        console.error('Error fetching instructions for user', targetInitials, err);
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
    }
  };

  useEffect(() => {
    setContent(
      <>
        <div className={quickLinksStyle(isDarkMode)}>
          <IconButton
            iconProps={{ iconName: 'ChevronLeft' }}
            onClick={handleBack}
            className={backButtonStyle}
            title="Back"
            ariaLabel="Back"
          />
          {showNewMatterPage ? (
            CLIENT_TYPE_OPTIONS.map((opt) => (
              <QuickActionsCard
                key={opt}
                title={opt}
                icon=""
                isDarkMode={isDarkMode}
                onClick={() => setNewMatterClientType(opt)}
                selected={newMatterClientType === opt}
                style={{ '--card-index': 0 } as React.CSSProperties}
              />
            ))
          ) : !showRiskPage ? (
            <>
              <QuickActionsCard
                title="New Matter"
                icon="Calendar"
                isDarkMode={isDarkMode}
                onClick={() => {
                  setSelectedInstruction(null);
                  setNewMatterClientType('Individual');
                  setShowNewMatterPage(true);
                }}
                style={{ '--card-index': 0 } as React.CSSProperties}
              />
              <QuickActionsCard
                title="EID Check"
                icon="IdCheck"
                isDarkMode={isDarkMode}
                onClick={() => { }}
                style={{ '--card-index': 1 } as React.CSSProperties}
              />
              <QuickActionsCard
                title="Risk Assessment"
                icon="Assessment"
                isDarkMode={isDarkMode}
                onClick={() => { }}
                style={{ '--card-index': 2 } as React.CSSProperties}
              />
              <QuickActionsCard
                title="Draft CCL"
                icon="OpenFile"
                isDarkMode={isDarkMode}
                onClick={() => setShowRiskPage(true)}
                style={{ '--card-index': 3 } as React.CSSProperties}
              />
            </>
          ) : null}
        </div>
        {!showNewMatterPage && (
          <div className={pivotBarStyle(isDarkMode)}>
            <Pivot
              selectedKey={activePivot}
              onLinkClick={(item) => {
                setExpandedInstructionRef(null);
                setActivePivot(item?.props.itemKey || 'instructions');
              }}
            >
              <PivotItem headerText="Overview" itemKey="overview" />
              <PivotItem headerText="Instructions" itemKey="instructions" />
              <PivotItem headerText="Deals" itemKey="deals" />
              <PivotItem headerText="Clients" itemKey="clients" />
              <PivotItem headerText="Risk & Compliance" itemKey="risk" />
            </Pivot>
          </div>
        )}
      </>

    );
    return () => setContent(null);
  }, [
    setContent,
    isDarkMode,
    instructionData,
    activePivot,
    showNewMatterPage,
    showRiskPage,
    newMatterClientType,
  ]);

  const containerStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    minHeight: '100vh',
    boxSizing: 'border-box',
    color: isDarkMode ? colours.light.text : colours.dark.text,
  });

  const newMatterContainerStyle = mergeStyles(containerStyle, {
    padding: '12px',
  });

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

  const sectionContainerStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark ? colours.dark.sectionBackground : colours.light.sectionBackground,
      padding: '16px',
      borderRadius: 0,
      boxShadow: dark
        ? `0 4px 12px ${colours.dark.border}`
        : `0 4px 12px ${colours.light.border}`,
      width: '100%',
    });

  const flattenedInstructions = useMemo(() => {
    return instructionData.flatMap((prospect) =>
      (prospect.instructions ?? []).map((inst) => {
        const deal = prospect.deals.find(
          (d) => d.InstructionRef === inst.InstructionRef
        );
        const riskSource = [
          ...(prospect.riskAssessments ?? prospect.compliance ?? []),
          ...((inst as any).riskAssessments ?? (inst as any).compliance ?? []),
        ];
        const eidSource = [
          ...(prospect.electronicIDChecks ?? prospect.idVerifications ?? []),
          ...((inst as any).electronicIDChecks ?? (inst as any).idVerifications ?? []),
        ];
        const risk = riskSource.find((r) => r.MatterId === inst.InstructionRef);
        const eid = eidSource.find((e) => e.MatterId === inst.InstructionRef);
        const docs = prospect.documents?.filter(
          (d) => d.InstructionRef === inst.InstructionRef
        );
        return {
          ...inst,
          deal,
          prospectId: prospect.prospectId,
          risk,
          eid,
          documentCount: docs ? docs.length : 0,
        };
      })
    );
  }, [instructionData]);

  const overviewItems = useMemo(() => {
    return instructionData.flatMap((prospect) => {
      const instructionItems = (prospect.instructions ?? []).map((inst) => {
        const dealsForInst = (prospect.deals ?? []).filter(
          (d) => d.InstructionRef === inst.InstructionRef
        );
        const clientsForInst: ClientInfo[] = [];
        (prospect.jointClients ?? prospect.joinedClients ?? []).forEach((jc) => {
          if (dealsForInst.some((d) => d.DealId === jc.DealId)) {
            clientsForInst.push({
              ClientEmail: jc.ClientEmail,
              HasSubmitted: jc.HasSubmitted,
              Lead: false,
              deals: [
                {
                  DealId: jc.DealId,
                  InstructionRef: inst.InstructionRef,
                  ServiceDescription:
                    dealsForInst.find((d) => d.DealId === jc.DealId)?.ServiceDescription,
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

        const riskSource = [
          ...(prospect.riskAssessments ?? prospect.compliance ?? []),
          ...((inst as any).riskAssessments ?? (inst as any).compliance ?? []),
        ];
        const eidSource = [
          ...(prospect.electronicIDChecks ?? prospect.idVerifications ?? []),
          ...((inst as any).electronicIDChecks ?? (inst as any).idVerifications ?? []),
        ];
        const risk = riskSource.find((r) => r.MatterId === inst.InstructionRef);
        const eid = eidSource.find((e) => e.MatterId === inst.InstructionRef);
        const docs = prospect.documents?.filter(
          (d) => d.InstructionRef === inst.InstructionRef
        );
        return {
          instruction: inst,
          deals: dealsForInst,
          clients: clientsForInst,
          risk,
          eid,
          prospectId: prospect.prospectId,
          documentCount: docs ? docs.length : 0,
        };
      });

      const dealOnlyItems = (prospect.deals ?? [])
        .filter((d) => !d.InstructionRef)
        .map((d) => {
          const clientsForDeal: ClientInfo[] = [];
          (prospect.jointClients ?? prospect.joinedClients ?? []).forEach((jc) => {
            if (jc.DealId === d.DealId) {
              clientsForDeal.push({
                ClientEmail: jc.ClientEmail,
                HasSubmitted: jc.HasSubmitted,
                Lead: false,
                deals: [
                  {
                    DealId: jc.DealId,
                    InstructionRef: null,
                    ServiceDescription: d.ServiceDescription,
                    Status: d.Status,
                  },
                ],
              });
            }
          });
          if (d.LeadClientEmail) {
            clientsForDeal.push({
              ClientEmail: d.LeadClientEmail,
              Lead: true,
              deals: [
                {
                  DealId: d.DealId,
                  InstructionRef: null,
                  ServiceDescription: d.ServiceDescription,
                  Status: d.Status,
                },
              ],
            });
          }
          return {
            instruction: null,
            deal: d,
            deals: [d],
            clients: clientsForDeal,
            risk: undefined,
            eid: undefined,
            prospectId: prospect.prospectId,
            passcode: d.Passcode,
            documentCount: 0,
          };
        });

      return [...instructionItems, ...dealOnlyItems];
    });
  }, [instructionData]);

  const unlinkedDeals = useMemo(
    () =>
      instructionData.flatMap((p) =>
        (p.deals ?? []).filter((d) => !d.InstructionRef)
      ),
    [instructionData]
  );

  const instructionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const deals = useMemo(
    () =>
      instructionData.flatMap((p) =>
        (p.deals ?? []).map((d) => ({
          ...d,
          firstName: p.instructions?.[0]?.FirstName,
          jointClients: p.jointClients ?? p.joinedClients ?? [],
        }))
      ),
    [instructionData]
  );
  const clients: ClientInfo[] = useMemo(() => {
    const map: Record<string, ClientInfo> = {};
    instructionData.forEach((p) => {
      const deals = p.deals ?? [];
      deals.forEach((d) => {
        if (d.LeadClientEmail) {
          const key = d.LeadClientEmail;
          const entry =
            map[key] || { ClientEmail: key, Lead: true, deals: [] as DealSummary[] };
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
        const entry =
          map[key] || {
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
          ...(p.riskAssessments ?? p.compliance ?? []),
        ];
        const eidSource: any[] = [
          ...(p.electronicIDChecks ?? p.idVerifications ?? []),
        ];
        instructions.forEach((inst: any) => {
          riskSource.push(...((inst.riskAssessments ?? inst.compliance) ?? []));
          eidSource.push(
            ...((inst.electronicIDChecks ?? inst.idVerifications) ?? [])
          );
        });
        return riskSource.map((r: any) => {
          const eid = eidSource.find((e: any) => e.MatterId === r.MatterId);
          const instruction = instructions.find(
            (i: any) => i.InstructionRef === r.MatterId
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
    [instructionData]
  );

  const handleOpenMatter = (inst: any) => {
    setSelectedInstruction(inst);
    setNewMatterClientType(inst?.ClientType || 'Individual');
    setShowNewMatterPage(true);
  };

  const handleRiskAssessment = (inst: any) => {
    setSelectedInstruction(inst);
    setShowRiskPage(true);
  };

  const handleEIDCheck = (inst: any) => {
    console.log('EID check for', inst.InstructionRef);
  };

  const handleOpenInstruction = (ref: string) => {
    setActivePivot('instructions');
    setExpandedInstructionRef(ref);
    setTimeout(() => {
      const el = instructionRefs.current[ref];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const gridContainerStyle = mergeStyles({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  });

  const instructionColumnStyle = mergeStyles({
    columnCount: 2,
    columnGap: '24px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  });

  const overviewColumnStyle = mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  });

  if (showNewMatterPage) {
    return (
      <Stack tokens={dashboardTokens} className={newMatterContainerStyle}>
        <NewMatters
          poidData={poidData}
          setPoidData={setPoidData}
          teamData={teamData}
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
        <RiskAssessmentPage onBack={function (): void {
          throw new Error('Function not implemented.');
        } } />
      </Stack>
    );
  }

  return (
    <section className="page-section">
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <div className={sectionContainerStyle(isDarkMode)}>
          {activePivot === 'overview' && (
            <div className={overviewColumnStyle}>
              {overviewItems.map((item, idx) => {
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                const animationDelay = row * 0.2 + col * 0.1;
                return (
                  <InstructionDashboard
                    key={idx}
                    instruction={item.instruction}
                    deal={(item as any).deal}
                    deals={item.deals}
                    clients={item.clients}
                    risk={(item as any).risk}
                    eid={(item as any).eid}
                    compliance={undefined}
                    prospectId={item.prospectId}
                    passcode={(item as any).passcode}
                    documentCount={item.documentCount ?? 0}
                    animationDelay={animationDelay}
                    onOpenInstruction={handleOpenInstruction}
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
          {activePivot === 'instructions' && (
            <div className={instructionColumnStyle}>
              {flattenedInstructions.map((instruction, idx) => {
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                const animationDelay = row * 0.2 + col * 0.1;
                return (
                  <InstructionCard
                    key={idx}
                    instruction={instruction}
                    risk={instruction.risk}
                    eid={instruction.eid}
                    documentCount={instruction.documentCount}
                    prospectId={instruction.prospectId}
                    animationDelay={animationDelay}
                    expanded={expandedInstructionRef === instruction.InstructionRef}
                    onOpenMatter={() => handleOpenMatter(instruction)}
                    onRiskAssessment={() => handleRiskAssessment(instruction)}
                    onEIDCheck={() => handleEIDCheck(instruction)}
                    innerRef={(el: HTMLDivElement | null) => {
                      instructionRefs.current[instruction.InstructionRef] = el;
                    }}
                  />
                );
              })}
            </div>
          )}
          {activePivot === 'deals' && (
            <div className={gridContainerStyle}>
              {deals.map((deal, idx) => {
                const row = Math.floor(idx / 4);
                const col = idx % 4;
                const animationDelay = row * 0.2 + col * 0.1;
                const isClosed = String(deal.Status).toLowerCase() === 'closed';
                return (
                  <DealCard
                    key={idx}
                    deal={deal}
                    animationDelay={animationDelay}
                    onFollowUp={
                      isClosed ? undefined : () => console.log('Follow up', deal.DealId)
                    }
                    onOpenInstruction={
                      deal.InstructionRef ? () => handleOpenInstruction(deal.InstructionRef) : undefined
                    }
                  />
                );
              })}
            </div>
          )}
          {activePivot === 'clients' && (
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
          {activePivot === 'risk' && (
            <>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                Risk &amp; Compliance
              </Text>
              <div className={gridContainerStyle}>
                {riskComplianceData.length === 0 && <Text>No risk data available.</Text>}
                {riskComplianceData.map((r, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const animationDelay = row * 0.2 + col * 0.1;
                  return (
                    <RiskComplianceCard
                      key={idx}
                      data={r}
                      animationDelay={animationDelay}
                      onOpenInstruction={() => handleOpenInstruction(r.MatterId)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Stack>
    </section>
  );
};

export default Instructions;