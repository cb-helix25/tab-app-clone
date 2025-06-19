import React from 'react';
import { Stack, TextField, PrimaryButton } from '@fluentui/react';
import TagButton from './TagButton';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { colours } from '../../../app/styles/colours';

interface SourceStepProps {
    source: string;
    setSource: (v: string) => void;
    referrerName: string;
    setReferrerName: (v: string) => void;
    onContinue: () => void;
}

const sourceOptions = ['referral', 'organic search', 'paid search', 'your following', 'tbc'];

const SourceStep: React.FC<SourceStepProps> = ({ source, setSource, referrerName, setReferrerName, onContinue }) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
            {sourceOptions.map((option) => (
                <TagButton
                    key={option}
                    label={option}
                    active={source === option}
                    onClick={() => {
                        setSource(option);
                        if (option !== 'referral') setReferrerName('');
                    }}
                    color={colours.highlight}
                />
            ))}
        </Stack>
        {source === 'referral' && (
            <TextField
                placeholder="Enter referrer's name"
                value={referrerName}
                onChange={(_, newVal) => setReferrerName(newVal || '')}
                styles={{ root: { width: 400 } }}
            />
        )}
        <PrimaryButton
            text="Continue"
            onClick={onContinue}
            disabled={source === 'referral' && !referrerName.trim()}
            styles={sharedPrimaryButtonStyles}
        />
    </Stack>
);

export default SourceStep;