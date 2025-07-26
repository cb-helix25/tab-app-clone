import React from 'react';
import { Stack } from '@fluentui/react';
import './TemplateEditorStep.css';
import UnifiedInstructionCCLEditor from './UnifiedInstructionCCLEditor';

const sampleContent = `Dear {{client_name}},\n\nThank you for instructing us regarding {{matter_type}}.\nOur fees are {{fee_estimate}}.\n\nKind regards,\n{{solicitor_name}}`;

const UnifiedEditorDemo: React.FC = () => {
    return (
        <Stack tokens={{ childrenGap: 24 }} styles={{ root: { padding: 24 } }}>
            <UnifiedInstructionCCLEditor initialContent={sampleContent} />
        </Stack>
    );
};

export default UnifiedEditorDemo;