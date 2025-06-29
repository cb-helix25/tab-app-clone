import React from 'react';
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';

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
        <div className="question-banner">Select Client Type</div>
        <div className="MultiSelect-bar">
            {options.map((opt) => (
                <div
                    key={opt.label}
                    className={`MultiSelect-segment${clientType === opt.label ? ' active' : ''}`}
                    onClick={() => {
                        setClientType(opt.label);
                        onContinue();
                    }}
                >
                    {opt.label}
                </div>
            ))}
        </div>
    </Stack>
);

export default ClientTypeStep;