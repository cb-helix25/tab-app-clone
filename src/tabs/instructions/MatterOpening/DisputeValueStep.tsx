//
import React from 'react'; // invisible change // invisible change
// invisible change
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';
import ModernMultiSelect from './ModernMultiSelect';

interface DisputeValueStepProps {
    disputeValue: string;
    setDisputeValue: (v: string) => void;
    onContinue: () => void;
}

const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];

const DisputeValueStep: React.FC<DisputeValueStepProps> = ({ disputeValue, setDisputeValue, onContinue }) => (
    <Stack tokens={{ childrenGap: 12 }}>
        <ModernMultiSelect
            label="Select Value of the Dispute"
            options={disputeValueOptions.map(option => ({ key: option, text: option }))}
            selectedValue={disputeValue}
            onSelectionChange={(value) => {
                setDisputeValue(value);
                onContinue();
            }}
            variant="grid"
        />
    </Stack>
);

export default DisputeValueStep;