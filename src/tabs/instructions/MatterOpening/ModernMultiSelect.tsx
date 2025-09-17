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
            return 'repeat(auto-fit, minmax(120px, 1fr))';
        }
        // Default horizontal layout
        return `repeat(${options.length}, 1fr)`;
    };

    const containerStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap: variant === 'binary' ? '0' : '6px',
        width: '100%',
        border: variant === 'binary' ? `1px solid ${selectedValue ? colours.highlight : '#E2E8F0'}` : 'none',
        borderRadius: '6px', // Slightly rounded for modern look
        overflow: 'hidden',
        background: variant === 'binary' ? 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)' : 'transparent',
        boxShadow: variant === 'binary' ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
    };

    const getOptionStyle = (option: ModernMultiSelectOption, index: number): React.CSSProperties => {
        const isSelected = selectedValue === option.key;
        const isDisabled = disabled || option.disabled;
        
        const baseStyle: React.CSSProperties = {
            padding: variant === 'binary' ? '10px 12px' : '8px 12px',
            textAlign: 'center',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            border: variant === 'binary' ? 'none' : `1px solid #e0e0e0`,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '36px',
            position: 'relative',
        };

        if (variant === 'binary') {
            return {
                ...baseStyle,
                color: isSelected ? colours.highlight : '#64748B',
                background: isSelected ? `${colours.highlight}15` : 'transparent',
                borderRight: index === 0 && options.length > 1 ? `1px solid #E2E8F0` : 'none',
                opacity: isDisabled ? 0.5 : 1,
                fontWeight: isSelected ? '600' : '500',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            };
        }

        return {
            ...baseStyle,
            color: isSelected ? colours.highlight : '#64748B',
            background: isSelected ? `${colours.highlight}15` : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            borderColor: isSelected ? colours.highlight : '#E2E8F0',
            opacity: isDisabled ? 0.5 : 1,
            boxShadow: isSelected ? `0 1px 3px ${colours.highlight}20` : '0 1px 2px rgba(0,0,0,0.03)',
            borderRadius: '6px',
        };
    };

    const questionBannerStyle: React.CSSProperties = {
        background: `linear-gradient(to right, #ffffff, ${colours.light.grey})`,
        borderLeft: `3px solid ${colours.cta}`,
        padding: '4px 8px',
        fontWeight: '600',
        color: '#061733',
        marginBottom: '6px',
        fontSize: '11px',
        borderRadius: '0 4px 4px 0',
    };

    return (
        <Stack tokens={{ childrenGap: 0 }} className={className}>
            {label && (
                <div style={questionBannerStyle}>
                    {label}
                </div>
            )}
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
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';
                                    e.currentTarget.style.color = '#3690CE';
                                } else {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';
                                    e.currentTarget.style.borderColor = colours.highlight;
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!disabled && !option.disabled && selectedValue !== option.key) {
                                if (variant === 'binary') {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#64748B';
                                } else {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
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
