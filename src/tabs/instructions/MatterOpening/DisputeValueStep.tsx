import React from 'react';
import { Stack } from '@fluentui/react';
import TagButton from './TagButton';
import { colours } from '../../../app/styles/colours';

interface DisputeValueStepProps {
    disputeValue: string;
    setDisputeValue: (v: string) => void;
    onContinue: () => void;
}

const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];

const DisputeValueStep: React.FC<DisputeValueStepProps> = ({ disputeValue, setDisputeValue, onContinue }) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
            {disputeValueOptions.map((option) => (
                <TagButton
                    key={option}
                    label={option}
                    active={disputeValue === option}
                    onClick={() => {
                        setDisputeValue(option);
                        onContinue();
                    }}
                    color={colours.highlight}
                />
            ))}
        </Stack>
    </Stack>
);

export default DisputeValueStep;