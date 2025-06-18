import React from 'react';
import { PrimaryButton } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';

export interface TagButtonProps {
    label: string;
    icon?: string;
    active: boolean;
    onClick: () => void;
    styleVariant?: 'clientType' | 'option';
    color?: string;
}

const clientTypeButtonStyle = (active: boolean, customColor?: string) => ({
    borderRadius: '25px',
    padding: '12px 24px',
    fontSize: '18px',
    fontWeight: 700,
    backgroundColor: '#f3f2f1',
    color: active ? customColor || colours.highlight : '#333',
    border: '1px solid #ccc',
    margin: '5px',
});

const tagButtonStyle = (active: boolean, customColor?: string) => ({
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: active ? customColor || colours.highlight : '#f3f2f1',
    color: active ? '#fff' : '#333',
    border: `1px solid ${customColor || colours.highlight}`,
    margin: '5px',
});

const TagButton: React.FC<TagButtonProps> = ({
    label,
    icon,
    active,
    onClick,
    styleVariant = 'option',
    color,
}) => {
    const style =
        styleVariant === 'clientType'
            ? clientTypeButtonStyle(active, color)
            : tagButtonStyle(active, color);
    return (
        <PrimaryButton
            text={label}
            iconProps={icon ? { iconName: icon } : undefined}
            onClick={onClick}
            styles={{ root: style as any }}
        />
    );
};

export default TagButton;
