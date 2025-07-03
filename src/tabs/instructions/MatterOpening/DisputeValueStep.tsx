import React from 'react';
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';

interface DisputeValueStepProps {
    disputeValue: string;
    setDisputeValue: (v: string) => void;
    onContinue: () => void;
}

const disputeValueOptions = ['Less than £10k', '£10k - £500k', '£500k - £1m', '£1m - £5m', '£5 - £20m', '£20m+'];

const DisputeValueStep: React.FC<DisputeValueStepProps> = ({ disputeValue, setDisputeValue, onContinue }) => (
    <Stack tokens={{ childrenGap: 12 }}>
        <div className="question-banner">Select Value of the Dispute</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '4px' }}>
            {disputeValueOptions.map((option) => (
                <div
                    key={option}
                    className={`MultiSelect-segment${disputeValue === option ? ' active' : ''}`}
                    onClick={() => {
                        setDisputeValue(option);
                        onContinue();
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
    </Stack>
);

export default DisputeValueStep;