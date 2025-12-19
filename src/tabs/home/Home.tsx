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
        <PrimaryButton text="Document drafting v1" onClick={() => navigate('/document-drafting-v1')} />
        <PrimaryButton text="Document drafting v2" onClick={() => navigate('/document-drafting-v2')} />
        <PrimaryButton
          text="Document drafting - tel note"
          onClick={() => navigate('/document-drafting-tel-note')}
        />
        <PrimaryButton text="WhatsApp" onClick={() => navigate('/whatsapp')} />
        <PrimaryButton text="Repository updates" onClick={() => navigate('/repository-updates')} />
      </Stack>
    </Stack>
  );
};

export default Home;