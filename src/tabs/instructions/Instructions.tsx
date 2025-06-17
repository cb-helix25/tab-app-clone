import React from 'react';
import { Stack, Text, Icon, mergeStyles } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { dashboardTokens, cardTokens, cardStyles, statusColors } from './componentTokens';

interface InstructionTask {
  name: string;
  status: 'pending' | 'completed' | 'awaiting' | 'notStarted';
}


interface Instruction {
  id: number;
  client: string;
  submitted: string;
  tasks: InstructionTask[];
}

const sampleInstructions: Instruction[] = [
  {
    id: 1,
    client: 'John Doe',
    submitted: '2025-06-01',
    tasks: [
      { name: 'Send CCL', status: 'completed' },
      { name: 'Risk Assessment', status: 'pending' },
      { name: 'Risk Assessment Form', status: 'notStarted' },
    ],
  },
  {
    id: 2,
    client: 'Jane Smith',
    submitted: '2025-06-04',
    tasks: [
      { name: 'Send CCL', status: 'pending' },
      { name: 'Risk Assessment', status: 'awaiting' },
      { name: 'Risk Assessment Form', status: 'notStarted' },
    ],
  },
];

const statusIcon = (status: 'pending' | 'completed' | 'awaiting' | 'notStarted') => {
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
          <Stack tokens={{ childrenGap: 10 }}>
            {inst.tasks.map((task) => (
              <Stack
                horizontal
                tokens={{ childrenGap: 6 }}
                verticalAlign="center"
                key={task.name}
              >
                {statusIcon(task.status)}
                <Text>{task.name}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

export default Instructions;