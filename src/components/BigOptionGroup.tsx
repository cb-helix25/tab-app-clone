import React from 'react';
import { Stack, DefaultButton, IButtonStyles } from '@fluentui/react';
import { colours } from '../app/styles/colours';

interface Option {
    key: string | number;
    text: string;
}

interface BigOptionGroupProps {
    label: string;
    options: Option[];
    selectedKey: string | number | undefined;
    onChange: (key: string | number, text: string) => void;
}

const buttonStyles = (selected: boolean): IButtonStyles => ({
    root: {
        width: 180,
        height: 96,
        marginRight: 12,
        marginBottom: 12,
        borderRadius: 0,
        border: `1px solid ${selected ? colours.highlight : '#ccc'}`,
        background: selected ? colours.highlight : '#fff',
        color: selected ? '#fff' : '#000',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontSize: 14,
    },
    rootHovered: {
        background: selected ? colours.highlight : colours.grey,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    rootPressed: {
        background: selected ? colours.highlight : '#e5e5e5',
        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
        transform: 'translateY(1px)',
    },
    label: { fontWeight: 600 },
});

const BigOptionGroup: React.FC<BigOptionGroupProps> = ({ label, options, selectedKey, onChange }) => (
    <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginBottom: 16 } }}>
        <label style={{ fontWeight: 600 }}>{label}</label>
        <Stack horizontal wrap>
            {options.map((o) => (
                <DefaultButton
                    key={o.key}
                    text={o.text}
                    styles={buttonStyles(o.key === selectedKey)}
                    onClick={() => onChange(o.key, o.text)}
                />
            ))}
        </Stack>
    </Stack>
);

export default BigOptionGroup;
