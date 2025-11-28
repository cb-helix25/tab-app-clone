import React from 'react';
import { Stack } from '@fluentui/react';

import InstructionExplorer from '../../components/instructions/InstructionExplorer';

const DocumentDraftingV2: React.FC = () => (
  <Stack tokens={{ childrenGap: 24 }}>
    <InstructionExplorer />
  </Stack>
);

export default DocumentDraftingV2;