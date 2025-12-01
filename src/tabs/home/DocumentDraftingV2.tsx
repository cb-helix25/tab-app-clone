import React from 'react';
import { PrimaryButton, Stack } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

import InstructionExplorer from '../../components/instructions/InstructionExplorer';

const DocumentDraftingV2: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <PrimaryButton text="Back to Home" onClick={() => navigate('/')} />
      <InstructionExplorer />
    </Stack>
  );
};

export default DocumentDraftingV2;