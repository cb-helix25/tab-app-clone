import React, { useEffect, useState } from 'react';
import { Stack, Text, mergeStyles } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens, cardTokens, cardStyles } from './componentTokens';
import { InstructionData } from '../../app/functionality/types';

interface InstructionsProps {
  userInitials: string;
}
const Instructions: React.FC<InstructionsProps> = ({ userInitials }) => {
  const { isDarkMode } = useTheme();
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!userInitials) return;
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
  }, [userInitials]);

  const containerStyle = mergeStyles({
    width: '100%',
    padding: '20px',
    boxSizing: 'border-box',
    color: isDarkMode ? colours.light.text : colours.dark.text,
  });

  return (
    <Stack tokens={dashboardTokens} className={containerStyle}>
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
