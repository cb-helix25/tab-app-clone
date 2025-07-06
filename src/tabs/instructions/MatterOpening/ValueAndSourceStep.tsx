import React from 'react';
import { Stack, TextField, mergeStyles } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import '../../../app/styles/MultiSelect.css';

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
    const separatorStyle = mergeStyles({
        height: '1px',
        backgroundColor: colours.light.border,
        margin: '0.5rem 0',
    });

    return (
        <Stack tokens={{ childrenGap: 12 }}>
            {/* Dispute Value Section */}
            <div className="question-banner">Select Value of the Dispute</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '4px' }}>
                {disputeValueOptions.map((option) => (
                    <div
                        key={option}
                        className={`MultiSelect-segment${disputeValue === option ? ' active' : ''}`}
                        onClick={() => {
                            setDisputeValue(option);
                        }}
                        style={{
                            border: '1px solid var(--helix-dark-blue)',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                            color: disputeValue === option ? '#fff' : '#061733',
                            backgroundColor: disputeValue === option ? 'var(--helix-dark-blue)' : 'transparent',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        {option}
                    </div>
                ))}
            </div>

            {/* Source Selection */}
            <div style={{ marginTop: '16px' }}>
                <div className="question-banner">Select Source</div>
                <div className="MultiSelect-bar">
                    {['Search', 'Referral', 'Your Following', 'Uncertain'].map((option) => (
                        <div
                            key={option}
                            className={`MultiSelect-segment${source === option.toLowerCase() ? ' active' : ''}`}
                            onClick={() => {
                                setSource(option.toLowerCase());
                                if (option !== 'Referral') setReferrerName('');
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
                        onChange={(_: any, newVal: string | undefined) => setReferrerName(newVal || '')}
                        styles={{ root: { width: '100%', maxWidth: 400, margin: '8px auto 0' } }}
                    />
                )}
            </div>
        </Stack>
    );
};

export default ValueAndSourceStep;
