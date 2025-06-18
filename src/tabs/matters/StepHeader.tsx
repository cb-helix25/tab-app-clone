import React from 'react';
import { Stack, Text, mergeStyles } from '@fluentui/react';
import { componentTokens } from '../../app/styles/componentTokens';

interface StepHeaderProps {
    title: string;
    active?: boolean;
    locked?: boolean;
    onClick?: () => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({
    title,
    active = false,
    locked = false,
    onClick,
}) => {
    const base = componentTokens.stepHeader.base;
    const activeTokens = componentTokens.stepHeader.active;
    const headerStyle = mergeStyles({
        backgroundColor: active ? activeTokens.backgroundColor : base.backgroundColor,
        color: active ? activeTokens.textColor : base.textColor,
        borderRadius: base.borderRadius,
        boxShadow: base.boxShadow,
        padding: '12px 16px',
        marginBottom: 16,
        cursor: onClick ? 'pointer' : 'default',
        opacity: locked ? componentTokens.stepHeader.lockedOpacity : 1,
    });

    return (
        <Stack
            className={headerStyle}
            horizontalAlign="start"
            onClick={locked ? undefined : onClick}
        >
            <Text variant="mediumPlus">{title}</Text>
        </Stack>
    );
  
};

export default StepHeader;
