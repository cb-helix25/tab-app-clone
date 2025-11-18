import React from 'react';
import { DefaultButton, Stack, Text } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

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
        tokens={{ childrenGap: 12 }}
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
      </Stack>
    </Stack>
  );
};

export default DocumentDraftingV2;