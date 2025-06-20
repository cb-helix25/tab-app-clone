import React, { useEffect, useState, useMemo } from 'react';
import { Stack, Text, mergeStyles, PrimaryButton } from '@fluentui/react';
import QuickActionsCard from '../home/QuickActionsCard';
import { useTheme } from '../../app/functionality/ThemeContext';
import { useNavigator } from '../../app/functionality/NavigatorContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens, cardTokens, cardStyles } from './componentTokens';
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
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const ACTION_BAR_HEIGHT = 48;

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: '0',
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
      <div className={quickLinksStyle(isDarkMode)}>
        <QuickActionsCard
          title={
            instructionData[0]?.instructions?.[0]?.InstructionRef || 'No Data'
          }
          icon="DocumentSearch"
          isDarkMode={isDarkMode}
          onClick={() => setShowPreview(!showPreview)}
          style={{ '--card-index': 0 } as React.CSSProperties}
        />
        <QuickActionsCard
          title="New Instruction"
          icon="Add"
          isDarkMode={isDarkMode}
          onClick={() => { }}
          style={{ '--card-index': 1 } as React.CSSProperties}
        />
        <QuickActionsCard
          title="New Matter"
          icon="AddTo"
          isDarkMode={isDarkMode}
          onClick={() => setShowNewMatterPage(true)}
          style={{ '--card-index': 2 } as React.CSSProperties}
        />
      </div>
    );
    return () => setContent(null);
  }, [setContent, isDarkMode, instructionData, showPreview]);

  const containerStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    padding: '16px',
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
        return { ...inst, deal, prospectId: prospect.prospectId };
      })
    );
  }, [instructionData]);

  const gridContainerStyle = mergeStyles({
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    },
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
        />
      </Stack>
    );
  }

  return (
    <Stack tokens={dashboardTokens} className={containerStyle}>
      <Text variant="xLarge">Instruction Dashboard</Text>
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
              prospectId={instruction.prospectId}
              animationDelay={animationDelay}
            />
          );
        })}
      </div>
    </Stack>
  );
};

export default Instructions;
