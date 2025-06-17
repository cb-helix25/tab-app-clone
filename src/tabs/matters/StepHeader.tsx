import React from 'react';
import { Stack, Text, mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';

interface StepHeaderProps {
    title: string;
    active?: boolean;
}

const StepHeader: React.FC<StepHeaderProps> = ({ title, active }) => {
    const headerStyle = mergeStyles({
        backgroundColor: active ? colours.darkBlue : colours.grey,
        color: active ? '#fff' : colours.darkBlue,
        padding: '8px 16px',
        borderRadius: 4,
        marginBottom: 16,
    });
    return (
        <Stack className={headerStyle} horizontalAlign="start">
            <Text variant="mediumPlus">{title}</Text>
        </Stack>
    );
};

export default StepHeader;
