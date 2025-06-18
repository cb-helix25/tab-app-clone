import React from 'react';
import { Stack } from '@fluentui/react';
import TagButton from './TagButton';
import { colours } from '../../../app/styles/colours';

interface ClientTypeStepProps {
    clientType: string;
    setClientType: (t: string) => void;
    onContinue: () => void;
}

const options = [
    { label: 'Individual', icon: 'Contact' },
    { label: 'Company', icon: 'CityNext' },
    { label: 'Multiple Individuals', icon: 'People' },
    { label: 'Existing Client', icon: 'Folder' },
];

const ClientTypeStep: React.FC<ClientTypeStepProps> = ({ clientType, setClientType, onContinue }) => (
    <Stack tokens={{ childrenGap: 20 }}>
        <Stack horizontal wrap tokens={{ childrenGap: 20 }} horizontalAlign="center">
            {options.map((opt) => (
                <TagButton
                    key={opt.label}
                    label={opt.label}
                    icon={opt.icon}
                    active={clientType === opt.label}
                    onClick={() => {
                        setClientType(opt.label);
                        onContinue();
                    }}
                    styleVariant="clientType"
                    color={colours.highlight}
                />
            ))}
        </Stack>
    </Stack>
);

export default ClientTypeStep;
