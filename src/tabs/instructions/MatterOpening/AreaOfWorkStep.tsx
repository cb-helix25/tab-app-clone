import React from 'react';
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';

interface AreaOfWorkStepProps {
    areaOfWork: string;
    setAreaOfWork: (v: string) => void;
    onContinue: () => void;
    getGroupColor: (area: string) => string;
}

const AreaOfWorkStep: React.FC<AreaOfWorkStepProps> = ({ areaOfWork, setAreaOfWork, onContinue, getGroupColor }) => (
    <Stack tokens={{ childrenGap: 12 }}>
        <div className="question-banner">Select Area of Work</div>
        <div className="MultiSelect-bar">
            {['Commercial', 'Property', 'Construction', 'Employment'].map((area) => (
                <div
                    key={area}
                    className={`MultiSelect-segment${areaOfWork === area ? ' active' : ''}`}
                    onClick={() => {
                        setAreaOfWork(area);
                        onContinue();
                    }}
                >
                    {area}
                </div>
            ))}
        </div>
        <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
    </Stack>
);

export default AreaOfWorkStep;