import React, { useEffect, useState } from 'react';
import { Stack, Text, mergeStyles } from '@fluentui/react';
import QuickActionsCard from '../home/QuickActionsCard';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens, cardTokens, cardStyles } from './componentTokens';
import { InstructionData } from '../../app/functionality/types';
import localInstructionData from '../../sampleData/localInstructionData.json';

interface InstructionsProps {
  userInitials: string;
}
const Instructions: React.FC<InstructionsProps> = ({ userInitials }) => {
  const { isDarkMode } = useTheme();
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);

  const quickLinksStyle = (dark: boolean) =>
    mergeStyles({
      backgroundColor: dark
        ? colours.dark.sectionBackground
        : colours.light.sectionBackground,
      padding: '10px',
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      overflowX: 'auto',
      alignItems: 'center',
      marginBottom: '16px',
      transition: 'background-color 0.3s, box-shadow 0.3s',
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
    width: '100%',
    padding: '20px',
    boxSizing: 'border-box',
    color: isDarkMode ? colours.light.text : colours.dark.text,
  });

  return (
    <Stack tokens={dashboardTokens} className={containerStyle}>
      <div className={quickLinksStyle(isDarkMode)}>
        <QuickActionsCard
          title={
            instructionData[0]?.instructions?.[0]?.InstructionRef || 'No Data'
          }
          icon="DocumentSearch"
          isDarkMode={isDarkMode}
          onClick={() => { }}
          style={{ '--card-index': 0 } as React.CSSProperties}
        />
        <QuickActionsCard
          title="New Instruction"
          icon="Add"
          isDarkMode={isDarkMode}
          onClick={() => { }}
          style={{ '--card-index': 1 } as React.CSSProperties}
        />
      </div>
      <Text variant="xLarge">Instruction Dashboard</Text>
      {instructionData.map((inst, idx) => (
        <Stack key={idx} tokens={cardTokens} styles={cardStyles}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(inst, null, 2)}
          </pre>
        </Stack>
      ))}
    </Stack>
  );
};

export default Instructions;
