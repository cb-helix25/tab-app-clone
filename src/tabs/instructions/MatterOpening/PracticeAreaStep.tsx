import React from 'react';
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';

interface PracticeAreaStepProps {
    options: string[];
    practiceArea: string;
    setPracticeArea: (v: string) => void;
    onContinue: () => void;
    groupColor: string;
}

const PracticeAreaStep: React.FC<PracticeAreaStepProps> = ({ options, practiceArea, setPracticeArea, onContinue, groupColor }) => (
    <Stack tokens={{ childrenGap: 12 }}>
        <div className="question-banner">Select Practice Area</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {options.map((pa) => (
                <div
                    key={pa}
                    className={`MultiSelect-segment${practiceArea === pa ? ' active' : ''}`}
                    onClick={() => {
                        setPracticeArea(pa);
                        onContinue();
                    }}
                    style={{
                        border: '1px solid var(--helix-cta)',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: practiceArea === pa ? '#fff' : '#061733',
                        backgroundColor: practiceArea === pa ? 'var(--helix-cta)' : 'transparent',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    {pa}
                </div>
            ))}
        </div>
    </Stack>
);

export default PracticeAreaStep;