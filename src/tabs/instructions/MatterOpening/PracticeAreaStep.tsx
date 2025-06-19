import React from 'react';
import { Stack } from '@fluentui/react';
import TagButton from './TagButton';

interface PracticeAreaStepProps {
    options: string[];
    practiceArea: string;
    setPracticeArea: (v: string) => void;
    onContinue: () => void;
    groupColor: string;
}

const PracticeAreaStep: React.FC<PracticeAreaStepProps> = ({ options, practiceArea, setPracticeArea, onContinue, groupColor }) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
            {options.map((pa) => (
                <TagButton
                    key={pa}
                    label={pa}
                    active={practiceArea === pa}
                    onClick={() => {
                        setPracticeArea(pa);
                        onContinue();
                    }}
                    color={groupColor}
                />
            ))}
        </Stack>
    </Stack>
);

export default PracticeAreaStep;