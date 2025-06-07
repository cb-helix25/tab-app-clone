import React from 'react';
import { Stack, Text, Icon, mergeStyles } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens, cardTokens, cardStyles, statusColors } from './componentTokens';

interface Instruction {
  id: number;
  client: string;
  submitted: string;
  idCheck: 'pending' | 'completed';
  documents: 'pending' | 'completed';
  payment: 'awaiting' | 'completed';
}

const sampleInstructions: Instruction[] = [
  {
    id: 1,
    client: 'John Doe',
    submitted: '2025-06-01',
    idCheck: 'completed',
    documents: 'pending',
    payment: 'awaiting',
  },
  {
    id: 2,
    client: 'Jane Smith',
    submitted: '2025-06-04',
    idCheck: 'pending',
    documents: 'pending',
    payment: 'awaiting',
  },
];

const statusIcon = (status: 'pending' | 'completed' | 'awaiting') => {
  const color = statusColors[status];
  const iconName = status === 'completed' ? 'CheckMark' : 'Clock';
  return <Icon iconName={iconName} styles={{ root: { color } }} />;
};

const Instructions: React.FC = () => {
  const { isDarkMode } = useTheme();

  const containerStyle = mergeStyles({
    width: '100%',
    padding: '20px',
    boxSizing: 'border-box',
    color: isDarkMode ? colours.light.text : colours.dark.text,
  });

  return (
    <Stack tokens={dashboardTokens} className={containerStyle}>
      <Text variant="xLarge">Instruction Dashboard</Text>
      {sampleInstructions.map((inst) => (
        <Stack key={inst.id} tokens={cardTokens} styles={cardStyles}>
          <Text variant="large">{inst.client}</Text>
          <Text>Submitted: {inst.submitted}</Text>
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
              {statusIcon(inst.idCheck)}
              <Text>ID Check</Text>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
              {statusIcon(inst.documents)}
              <Text>Documents</Text>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 6 }} verticalAlign="center">
              {statusIcon(inst.payment)}
              <Text>Payment</Text>
            </Stack>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

export default Instructions;