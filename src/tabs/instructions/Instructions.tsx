import React, { useEffect, useState, useMemo } from 'react';
import {
  Stack,
  Text,
  mergeStyles,
  PrimaryButton,
  Pivot,
  PivotItem,
} from '@fluentui/react';
import QuickActionsCard from '../home/QuickActionsCard';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigator } from '../../app/functionality/NavigatorContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens } from './componentTokens';
import InstructionCard from './InstructionCard';
import { InstructionData, POID, TeamData } from '../../app/functionality/types';
import localInstructionData from '../../localData/localInstructionData.json';
import NewMatters from './NewMatters';

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
  const [selectedInstruction, setSelectedInstruction] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [activePivot, setActivePivot] = useState<string>('instructions');

  const ACTION_BAR_HEIGHT = 48;

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
      if (!userInitials) return;

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
        const url = `${baseUrl}/${path}?code=${code}&initials=${userInitials}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setInstructionData(Array.isArray(data) ? data : [data]);
        } else {
          console.error('Failed to fetch instructions for user', userInitials);
        }
      } catch (err) {
        console.error('Error fetching instructions for user', userInitials, err);
      }
    }
    fetchData();
  }, [userInitials, useLocalData]);

  useEffect(() => {
    setContent(
      <>
        <div className={quickLinksStyle(isDarkMode)}>
          <QuickActionsCard
            title={
              instructionData[0]?.instructions?.[0]?.InstructionRef || 'No Data'
            }
            icon="OpenFile"
            isDarkMode={isDarkMode}
            onClick={() => setShowPreview(!showPreview)}
            style={{ '--card-index': 0 } as React.CSSProperties}
          />
          <QuickActionsCard
            title="New Instruction"
            icon="Checklist"
            isDarkMode={isDarkMode}
            onClick={() => { }}
            style={{ '--card-index': 1 } as React.CSSProperties}
          />
          <QuickActionsCard
            title="New Matter"
            icon="Calendar"
            isDarkMode={isDarkMode}
            onClick={() => setShowNewMatterPage(true)}
            style={{ '--card-index': 2 } as React.CSSProperties}
          />
          <QuickActionsCard
            title="EID Check"
            icon="IdCheck"
            isDarkMode={isDarkMode}
            onClick={() => { }}
            style={{ '--card-index': 3 } as React.CSSProperties}
          />
          <QuickActionsCard
            title="Risk Assessment"
            icon="Assessment"
            isDarkMode={isDarkMode}
            onClick={() => { }}
            style={{ '--card-index': 4 } as React.CSSProperties}
          />
          <QuickActionsCard
            title="Draft CCL"
            icon="OpenFile"
            isDarkMode={isDarkMode}
            onClick={() => { }}
            style={{ '--card-index': 5 } as React.CSSProperties}
          />
        </div>
        <div className={pivotBarStyle(isDarkMode)}>
          <Pivot
            selectedKey={activePivot}
            onLinkClick={(item) =>
              setActivePivot(item?.props.itemKey || 'instructions')
            }
          >
            <PivotItem headerText="Instructions" itemKey="instructions" />
            <PivotItem headerText="Deals" itemKey="deals" />
            <PivotItem headerText="Joint Clients" itemKey="clients" />
            <PivotItem headerText="Risk & Compliance" itemKey="risk" />
          </Pivot>
        </div>
      </>

    );
    return () => setContent(null);
  }, [setContent, isDarkMode, instructionData, showPreview, activePivot]);

  const containerStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    padding: '24px',
    minHeight: '100vh',
    boxSizing: 'border-box',
    color: isDarkMode ? colours.light.text : colours.dark.text,
  });

  const flattenedInstructions = useMemo(() => {
    return instructionData.flatMap((prospect) =>
      prospect.instructions.map((inst) => {
        const deal = prospect.deals.find(
          (d) => d.InstructionRef === inst.InstructionRef
        );
        const risk = prospect.riskAssessments?.find(
          (r) => r.MatterId === inst.InstructionRef
        );
        const eid = prospect.electronicIDChecks?.find(
          (e) => e.MatterId === inst.InstructionRef
        );
        return { ...inst, deal, prospectId: prospect.prospectId, risk, eid };
      })
    );
  }, [instructionData]);

  const deals = useMemo(
    () => instructionData.flatMap((p) => p.deals),
    [instructionData]
  );
  const jointClients = useMemo(
    () => instructionData.flatMap((p) => p.jointClients),
    [instructionData]
  );
  const riskData = useMemo(
    () =>
      instructionData.flatMap((p) =>
        p.riskAssessments.map((r) => {
          const eid = p.electronicIDChecks?.find(
            (e) => e.MatterId === r.MatterId
          );
          return { ...r, EIDStatus: eid?.EIDStatus };
        })
      ),
    [instructionData]
  );


  const handleOpenMatter = (inst: any) => {
    setSelectedInstruction(inst);
    setShowNewMatterPage(true);
  };

  const gridContainerStyle = mergeStyles({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  });

  if (showNewMatterPage) {
    return (
      <Stack tokens={dashboardTokens} className={containerStyle}>
        <PrimaryButton
          text="Back"
          onClick={() => setShowNewMatterPage(false)}
          style={{ marginBottom: '16px' }}
        />
        <NewMatters
          poidData={poidData}
          setPoidData={setPoidData}
          teamData={teamData}
          instructionRef={selectedInstruction?.InstructionRef}
          stage={selectedInstruction?.Stage}
          clientId={selectedInstruction?.prospectId?.toString()}
        />
      </Stack>
    );
  }

  return (
    <section className="page-section">
      {activePivot === 'instructions' && (
        <Stack tokens={dashboardTokens} className={containerStyle}>
          {showPreview && (
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(instructionData, null, 2)}
            </pre>
          )}
          <div className={gridContainerStyle}>
            {flattenedInstructions.map((instruction, idx) => {
              const row = Math.floor(idx / 4);
              const col = idx % 4;
              const animationDelay = row * 0.2 + col * 0.1;
              return (
                <InstructionCard
                  key={idx}
                  instruction={instruction}
                  deal={instruction.deal}
                  risk={instruction.risk}
                  eid={instruction.eid}
                  prospectId={instruction.prospectId}
                  animationDelay={animationDelay}
                  onOpenMatter={() => handleOpenMatter(instruction)}
                />
              );
            })}
          </div>
        </Stack>
      )}
      {activePivot === 'deals' && (
        <Stack tokens={dashboardTokens} className={containerStyle}>
          <table className="simple-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Instruction</th>
                <th>Service</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, idx) => (
                <tr key={idx}>
                  <td>{deal.DealId}</td>
                  <td>{deal.InstructionRef}</td>
                  <td>{deal.ServiceDescription}</td>
                  <td>{deal.Amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Stack>
      )}
      {activePivot === 'clients' && (
        <Stack tokens={dashboardTokens} className={containerStyle}>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Deal ID</th>
                <th>Email</th>
                <th>Lead</th>
              </tr>
            </thead>
            <tbody>
              {jointClients.map((c, idx) => (
                <tr key={idx}>
                  <td>{c.DealId}</td>
                  <td>{c.ClientEmail}</td>
                  <td>{c.IsLeadClient ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Stack>
      )}
      {activePivot === 'risk' && (
        <Stack tokens={dashboardTokens} className={containerStyle}>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Matter</th>
                <th>ID Check</th>
                <th>Risk Result</th>
              </tr>
            </thead>
            <tbody>
              {riskData.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.MatterId}</td>
                  <td>{r.EIDStatus || 'Pending'}</td>
                  <td>{r.RiskAssessmentResult || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Stack>
      )}
    </section>
  );
};

export default Instructions;
