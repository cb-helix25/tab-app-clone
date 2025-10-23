import React from 'react';

import RecentWorkFeed from './RecentWorkFeed';
import TeamIssuesBoard from './TeamIssuesBoard';

const Home: React.FC = () => {
  return (
    <div>
      {/* Recent Work Feed - Only visible to Luke and Cass */}
      <div style={{ margin: '12px 16px' }}>
        <RecentWorkFeed 
          maxItems={8}
          showHeader={true}
          compact={false}
        />
      </div>

      {/* Team Issues Board */}
      <div style={{ margin: '12px 16px' }}>
        <TeamIssuesBoard 
          showHeader={true}
          compact={false}
          maxItemsPerColumn={3}
        />
      </div>
    </div>
  );
};
export default Home;