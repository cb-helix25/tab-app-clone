import React from 'react';
import { Stack } from '@fluentui/react';

import RecentWorkFeed from './RecentWorkFeed';
import TeamIssuesBoard from './TeamIssuesBoard';

const Hub: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <RecentWorkFeed showHeader />
      <TeamIssuesBoard showHeader />
    </Stack>
  );
};

export default Hub;