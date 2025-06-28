import React from 'react';
import { Stack, TextField, PrimaryButton, Text } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import '../../../app/styles/MultiSelect.css';

interface SourceStepProps {
    source: string;
    setSource: (v: string) => void;
    referrerName: string;
    setReferrerName: (v: string) => void;
    onContinue?: () => void;
}

const sourceOptions = ['referral', 'organic search', 'paid search', 'your following', 'tbc'];

const SourceStep: React.FC<SourceStepProps> = ({ source, setSource, referrerName, setReferrerName, onContinue }) => (
    <Stack tokens={{ childrenGap: 20 }}>
        <Text variant="mediumPlus" style={{ marginBottom: 6, textAlign: 'center' }}>
            Select Source
        </Text>
        <div className="MultiSelect-bar">
            {sourceOptions.map((option) => (
                <div
                    key={option}
                    className={`MultiSelect-segment${source === option ? ' active' : ''}`}
                    onClick={() => {
                        setSource(option);
                        if (option !== 'referral') setReferrerName('');
                    }}
                    style={{ textTransform: 'capitalize' }}
                >
                    {option}
                </div>
            ))}
        </div>
        {source === 'referral' && (
            <TextField
                placeholder="Enter referrer's name"
                value={referrerName}
                onChange={(_, newVal) => setReferrerName(newVal || '')}
                styles={{ root: { width: '100%', maxWidth: 400, margin: '0 auto' } }}
            />
        )}
        {onContinue && (
            <PrimaryButton
                text="Continue"
                onClick={onContinue}
                disabled={source === 'referral' && !referrerName.trim()}
                styles={sharedPrimaryButtonStyles}
            />
        )}
    </Stack>
);

export default SourceStep;