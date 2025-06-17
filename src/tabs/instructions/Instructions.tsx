import React, { useEffect, useState } from 'react';
import { Stack, Text, mergeStyles } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens, cardTokens, cardStyles } from './componentTokens';
import { InstructionData, Enquiry } from '../../app/functionality/types';

interface InstructionsProps {
  enquiries: Enquiry[] | null;
}

const Instructions: React.FC<InstructionsProps> = ({ enquiries }) => {
  const { isDarkMode } = useTheme();
  const [instructionData, setInstructionData] = useState<InstructionData[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!enquiries || enquiries.length === 0) return;
      const code = process.env.REACT_APP_GET_INSTRUCTION_DATA_CODE;
      const path = process.env.REACT_APP_GET_INSTRUCTION_DATA_PATH;
      const baseUrl = process.env.REACT_APP_PROXY_BASE_URL;
      if (!code || !path || !baseUrl) {
        console.error('Missing env variables for instruction data');
        return;
      }

      const results: InstructionData[] = [];
      for (const enq of enquiries) {
        try {
          const url = `${baseUrl}/${path}?code=${code}&enquiryId=${enq.ID}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            results.push(data);
          } else {
            console.error('Failed to fetch instructions for enquiry', enq.ID);
          }
        } catch (err) {
          console.error('Error fetching instructions for enquiry', enq.ID, err);
        }
      }
      setInstructionData(results);
    }
    fetchData();
  }, [enquiries]);


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