import React from 'react';
import { IconButton, IButtonProps, Icon } from '@fluentui/react';

interface ActionIconButtonProps extends IButtonProps {
    outlineIcon: string;
    filledIcon?: string;
    title?: string;
}

const ActionIconButton: React.FC<ActionIconButtonProps> = ({ outlineIcon, filledIcon, ...props }) => (
    <IconButton
        {...props}
        onRenderIcon={() => (
            <span className="icon-hover">
                <Icon iconName={outlineIcon} className="icon-outline" />
                <Icon iconName={filledIcon || outlineIcon} className="icon-filled" />
            </span>
        )}
    />
);

export default ActionIconButton;