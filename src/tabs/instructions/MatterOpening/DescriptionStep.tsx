import React from 'react';
import { Stack, TextField, PrimaryButton } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';

interface DescriptionStepProps {
    description: string;
    setDescription: (v: string) => void;
    onContinue: () => void;
}

const DescriptionStep: React.FC<DescriptionStepProps> = ({ description, setDescription, onContinue }) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <TextField
            multiline
            rows={4}
            placeholder="Enter matter description..."
            value={description}
            onChange={(_, newVal) => setDescription(newVal || '')}
            styles={{ root: { width: 400 } }}
        />
        <PrimaryButton text="Continue" onClick={onContinue} styles={sharedPrimaryButtonStyles} />
    </Stack>
);

export default DescriptionStep;