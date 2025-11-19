import React from 'react';
import { DefaultButton, Stack, Text } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import SchemaPanel from '../../components/instructions/SchemaPanel';
import InstructionExplorer from '../../components/instructions/InstructionExplorer';

const DocumentDraftingV2: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <DefaultButton
        text="Back to Home"
        onClick={() => navigate('/')}
        styles={{
          root: {
            alignSelf: 'flex-start',
            backgroundColor: isDarkMode ? colours.dark.buttonBackground : colours.light.buttonBackground,
            color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
            borderColor: 'transparent',
          },
          rootHovered: {
            backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.hoverBackground,
            color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
          },
          rootPressed: {
            backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.hoverBackground,
            color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
          },
        }}
      />

      <Stack
        tokens={{ childrenGap: 24 }}
        styles={{
          root: {
            backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
            borderRadius: 12,
            padding: 24,
            boxShadow: isDarkMode
              ? '0 4px 14px rgba(0, 0, 0, 0.35)'
              : '0 4px 14px rgba(6, 23, 51, 0.12)',
          },
        }}
      >
        <Stack tokens={{ childrenGap: 8 }}>
          <Text variant="xxLarge">Instructions Explorer</Text>
          <Text>
            Use the schema reference to understand the data model and load live instruction details via the
            read-only explorer.
          </Text>
        </Stack>
        <Stack horizontal wrap tokens={{ childrenGap: 24 }}>
          <Stack.Item grow styles={{ root: { minWidth: 320, flexBasis: '40%' } }}>
            <SchemaPanel />
          </Stack.Item>
          <Stack.Item grow styles={{ root: { minWidth: 320, flexBasis: '60%' } }}>
            <InstructionExplorer />
          </Stack.Item>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default DocumentDraftingV2;