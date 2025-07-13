//
import React from 'react'; // invisible change // invisible change
// invisible change 2.2
import { Stack } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';

export interface ModernMultiSelectOption {
    key: string;
    text: string;
    disabled?: boolean;
}

interface ModernMultiSelectProps {
    label: string;
    options: ModernMultiSelectOption[];
    selectedValue: string | null;
    onSelectionChange: (value: string) => void;
    variant?: 'default' | 'binary' | 'grid';
    className?: string;
    disabled?: boolean;
}

const ModernMultiSelect: React.FC<ModernMultiSelectProps> = ({
    label,
    options,
    selectedValue,
    onSelectionChange,
    variant = 'default',
    className = '',
    disabled = false
}) => {
    const getGridColumns = () => {
        if (variant === 'binary' && options.length === 2) {
            return 'repeat(2, 1fr)';
        }
        if (variant === 'grid') {
            return 'repeat(auto-fit, minmax(140px, 1fr))';
        }
        // Default horizontal layout
        return `repeat(${options.length}, 1fr)`;
    };

    const containerStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap: variant === 'binary' ? '0' : '8px',
        width: '100%',
        border: variant === 'binary' ? `1px solid ${selectedValue ? colours.highlight : '#e0e0e0'}` : 'none',
        borderRadius: '0px', // Remove rounded corners
        overflow: 'hidden',
        background: variant === 'binary' ? '#fff' : 'transparent',
        boxShadow: variant === 'binary' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    };

    const getOptionStyle = (option: ModernMultiSelectOption, index: number): React.CSSProperties => {
        const isSelected = selectedValue === option.key;
        const isDisabled = disabled || option.disabled;
        
        const baseStyle: React.CSSProperties = {
            padding: variant === 'binary' ? '14px 16px' : '12px 16px',
            textAlign: 'center',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            border: variant === 'binary' ? 'none' : `1px solid #e0e0e0`,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '48px',
            position: 'relative',
        };

        if (variant === 'binary') {
            return {
                ...baseStyle,
                color: isSelected ? colours.highlight : '#4a5568',
                background: isSelected ? `${colours.highlight}22` : 'transparent',
                borderRight: index === 0 && options.length > 1 ? `1px solid #e0e0e0` : 'none',
                opacity: isDisabled ? 0.5 : 1,
            };
        }

        return {
            ...baseStyle,
            color: isSelected ? colours.highlight : '#4a5568',
            background: isSelected ? `${colours.highlight}22` : '#fff',
            borderColor: isSelected ? colours.highlight : '#e0e0e0',
            opacity: isDisabled ? 0.5 : 1,
            boxShadow: isSelected ? `0 2px 8px ${colours.highlight}20` : 'none',
        };
    };

    const questionBannerStyle: React.CSSProperties = {
        background: `linear-gradient(to right, #ffffff, ${colours.light.grey})`,
        borderLeft: `3px solid ${colours.cta}`,
        padding: '4px 8px',
        fontWeight: '600',
        color: '#061733',
        marginBottom: '8px',
        fontSize: '14px',
        borderRadius: '0 4px 4px 0',
    };

    return (
        <Stack tokens={{ childrenGap: 0 }} className={className}>
            <div style={questionBannerStyle}>
                {label}
            </div>
            <div style={containerStyle}>
                {options.map((option, index) => (
                    <div
                        key={option.key}
                        style={getOptionStyle(option, index)}
                        onClick={() => {
                            if (!disabled && !option.disabled) {
                                onSelectionChange(option.key);
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (!disabled && !option.disabled && selectedValue !== option.key) {
                                if (variant === 'binary') {
                                    e.currentTarget.style.background = '#f7fafc';
                                } else {
                                    e.currentTarget.style.background = '#f7fafc';
                                    e.currentTarget.style.borderColor = colours.highlight;
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!disabled && !option.disabled && selectedValue !== option.key) {
                                if (variant === 'binary') {
                                    e.currentTarget.style.background = 'transparent';
                                } else {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }
                            }
                        }}
                        role="button"
                        tabIndex={disabled || option.disabled ? -1 : 0}
                        aria-pressed={selectedValue === option.key}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (!disabled && !option.disabled) {
                                    onSelectionChange(option.key);
                                }
                            }
                        }}
                    >
                        {option.text}
                    </div>
                ))}
            </div>
        </Stack>
    );
};

export default ModernMultiSelect;
