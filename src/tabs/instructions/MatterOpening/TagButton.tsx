import React from 'react';
import '../../../app/styles/TagButton.css';

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
    color: active ? customColor : undefined,
});

const tagButtonStyle = (active: boolean) => ({
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
});

const TagButton: React.FC<TagButtonProps> = ({
    label,
    icon,
    active,
    onClick,
    styleVariant = 'option',
    color,
}) => {
    const style = styleVariant === 'clientType' ? clientTypeButtonStyle(active, color) : tagButtonStyle(active);
    const className = `tag-button${active ? ' active' : ''}`;
    return (
        <button className={className} onClick={onClick} style={style as React.CSSProperties}>
            {icon && <span className={`ms-Icon ms-Icon--${icon}`} aria-hidden="true" style={{ marginRight: 4 }} />}
            {label}
        </button>
    );
};

export default TagButton;