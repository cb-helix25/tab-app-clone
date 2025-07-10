//
import React from 'react'; // invisible change
// invisible change 2.1
import { Stack, TextField, mergeStyles } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import '../../../app/styles/MultiSelect.css';
import ModernMultiSelect from './ModernMultiSelect';

interface ValueAndSourceStepProps {
    disputeValue: string;
    setDisputeValue: (v: string) => void;
    source: string;
    setSource: (v: string) => void;
    referrerName: string;
    setReferrerName: (v: string) => void;
    onContinue?: () => void;
}

const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];

const ValueAndSourceStep: React.FC<ValueAndSourceStepProps> = ({ 
    disputeValue, 
    setDisputeValue, 
    source, 
    setSource, 
    referrerName, 
    setReferrerName, 
    onContinue 
}) => {
    const separatorStyle = mergeStyles({ /* invisible change */
        height: '1px',
        backgroundColor: colours.light.border,
        margin: '0.5rem 0',
    });

    return (
        <Stack tokens={{ childrenGap: 12 }}>
            {/* Dispute Value Section */}
            <ModernMultiSelect
                label="Select Value of the Dispute"
                options={disputeValueOptions.map(option => ({ key: option, text: option }))}
                selectedValue={disputeValue}
                onSelectionChange={setDisputeValue}
                variant="grid"
            />

            {/* Source Selection */}
            <div style={{ marginTop: '16px' }}>
                <ModernMultiSelect
                    label="Select Source"
                    options={[
                        { key: 'search', text: 'Search' },
                        { key: 'referral', text: 'Referral' },
                        { key: 'your following', text: 'Your Following' },
                        { key: 'uncertain', text: 'Uncertain' }
                    ]}
                    selectedValue={source}
                    onSelectionChange={(value) => {
                        setSource(value);
                        if (value !== 'referral') setReferrerName('');
                    }}
                    variant="default"
                />
            </div>

            {/* Referrer Name Field - only show if source is referral */}
            {source === 'referral' && (
                <TextField
                    placeholder="Enter referrer's name"
                    value={referrerName}
                    onChange={(_: any, newVal: string | undefined) => setReferrerName(newVal || '')}
                    styles={{ root: { width: '100%', maxWidth: 400, margin: '8px auto 0' } }}
                />
            )}
        </Stack>
    );
};

export default ValueAndSourceStep;
