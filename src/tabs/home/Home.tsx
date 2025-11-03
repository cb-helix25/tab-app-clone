import React from 'react';

import { PrimaryButton, Stack, Text } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Stack
      tokens={{ childrenGap: 16 }}
      horizontalAlign="center"
      verticalAlign="center"
      styles={{ root: { minHeight: '50vh' } }}
    >
      <Text variant="large" styles={{ root: { textAlign: 'center' } }}>
        Choose a workspace to explore.
      </Text>
      <Stack tokens={{ childrenGap: 12 }}>
        <PrimaryButton text="Hub" onClick={() => navigate('/hub')} />
        <PrimaryButton text="Harvey" onClick={() => navigate('/harvey')} />
      </Stack>
    </Stack>
  );
};

export default Home;