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
    <Stack tokens={{ childrenGap: 20 }}>
        <Text variant="mediumPlus" style={{ marginBottom: 6, textAlign: 'center' }}>
            Select Area of Work
        </Text>
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
    </Stack>
);

export default AreaOfWorkStep;