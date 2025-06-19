import React from 'react';
import { Stack } from '@fluentui/react';
import TagButton from './TagButton';

interface AreaOfWorkStepProps {
    areaOfWork: string;
    setAreaOfWork: (v: string) => void;
    onContinue: () => void;
    getGroupColor: (area: string) => string;
}

const AreaOfWorkStep: React.FC<AreaOfWorkStepProps> = ({ areaOfWork, setAreaOfWork, onContinue, getGroupColor }) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
            {['Commercial', 'Property', 'Construction', 'Employment'].map((area) => (
                <TagButton
                    key={area}
                    label={area}
                    active={areaOfWork === area}
                    onClick={() => {
                        setAreaOfWork(area);
                        onContinue();
                    }}
                    color={getGroupColor(area)}
                />
            ))}
        </Stack>
    </Stack>
);

export default AreaOfWorkStep;