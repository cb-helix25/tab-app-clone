import React, { useEffect, useState } from 'react';
import { Stack, Text, mergeStyles, PrimaryButton } from '@fluentui/react';
import QuickActionsCard from '../home/QuickActionsCard';
import { useTheme } from '../../app/functionality/ThemeContext';
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
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);
  const [showNewMatterPage, setShowNewMatterPage] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const ACTION_BAR_HEIGHT = 48;

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: '0 10px',
      transition: 'background-color 0.3s, box-shadow 0.3s',
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      overflowX: 'auto',
      alignItems: 'center',
      marginBottom: '16px',
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

  const containerStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    padding: '16px',
    minHeight: '100vh',
    boxSizing: 'border-box',
    color: isDarkMode ? colours.light.text : colours.dark.text,
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
      <Text variant="xLarge">Instruction Dashboard</Text>
      {showPreview && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(instructionData, null, 2)}
        </pre>
      )}
      {instructionData.map((inst, idx) => (
        <Stack key={idx} tokens={cardTokens} styles={cardStyles}>
          <Text variant="large">Prospect {inst.prospectId}</Text>
          {inst.instructions.map((instruction, jdx) => (
            <InstructionCard
              key={jdx}
              instruction={instruction}
              animationDelay={jdx * 0.1}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

export default Instructions;
