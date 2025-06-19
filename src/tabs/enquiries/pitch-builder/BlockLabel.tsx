// src/components/BlockLabel.tsx
import React from 'react';
import { mergeStyles, TooltipHost, Icon } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';

export interface BlockLabelProps {
    title: string;
    selectedLabel?: string;
    isLocked?: boolean;
    onLockToggle?: () => void;
    onClick?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
}

const labelClass = mergeStyles({
    display: 'inline-block',
    position: 'relative',
    fontSize: 10,
    color: colours.greyText,
    marginTop: 8,
    textAlign: 'right',
    cursor: 'pointer',
    transition: 'color 0.2s',
    selectors: {
        '&:hover': { textDecoration: 'underline', color: colours.highlight }
    }
});

const BlockLabel: React.FC<BlockLabelProps> = ({
    title,
    selectedLabel,
    isLocked = false,
    onLockToggle,
    onClick,
    onMouseEnter,
    onMouseLeave,
}) => {
    const tooltipContent = selectedLabel || title;
    return (
        <TooltipHost content={tooltipContent}>
            <span
                className={labelClass}
                data-selected={selectedLabel}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {title}
                <Icon
                    iconName={isLocked ? 'Lock' : 'Unlock'}
                    onClick={e => { e.stopPropagation(); onLockToggle?.(); }}
                    style={{ marginLeft: 4, fontSize: 12 }}
                />
            </span>
        </TooltipHost>
    );
};

export default BlockLabel;
