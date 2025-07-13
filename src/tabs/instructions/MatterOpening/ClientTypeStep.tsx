//
import React from 'react'; // invisible change // invisible change
// invisible change 2.2
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';
import ModernMultiSelect from './ModernMultiSelect';

interface ClientTypeStepProps {
    clientType: string;
    setClientType: (t: string) => void;
    onContinue: () => void;
}

const options = [
    { label: 'Individual' },
    { label: 'Company' },
    { label: 'Multiple Individuals' },
    { label: 'Existing Client' },
];

const ClientTypeStep: React.FC<ClientTypeStepProps> = ({ clientType, setClientType, onContinue }) => (
    <Stack tokens={{ childrenGap: 12 }}>
        <ModernMultiSelect
            label="Select Client Type"
            options={options.map(opt => ({ key: opt.label, text: opt.label }))}
            selectedValue={clientType}
            onSelectionChange={(value) => {
                setClientType(value);
                onContinue();
            }}
            variant="default"
        />
    </Stack>
);

export default ClientTypeStep;