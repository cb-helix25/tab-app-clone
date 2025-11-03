import React from 'react';
import { DefaultButton, Stack } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

import RecentWorkFeed from './RecentWorkFeed';
import TeamIssuesBoard from './TeamIssuesBoard';

const Hub: React.FC = () => {
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
      <RecentWorkFeed showHeader />
      <TeamIssuesBoard showHeader />
    </Stack>
  );
};

export default Hub;