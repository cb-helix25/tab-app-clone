import React, { useState, useEffect } from 'react';
import {
    TextField,
    ITextFieldStyles,
    PrimaryButton,
    DefaultButton,
    Checkbox,
    Stack,
    Text,
    Icon,
    Callout,
    DirectionalHint,
} from '@fluentui/react';

type SnippetEditPopoverProps = {
    target: HTMLElement;
    onSave: (data: { label: string; sortOrder: number; isNew: boolean }) => void;
    onDismiss: () => void;
    previewText?: string;
};

const SnippetEditPopover: React.FC<SnippetEditPopoverProps> = ({ target, onSave, onDismiss, previewText }) => {
    const [label, setLabel] = useState('');
    const [sortOrder, setSortOrder] = useState<number>(0);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onDismiss]);

    const textFieldStyles: Partial<ITextFieldStyles> = {
        fieldGroup: {
            border: '1px solid #e1e5e9',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            minHeight: '36px',
            ':hover': {
                borderColor: '#0078d4',
            },
            ':focus-within': {
                borderColor: '#0078d4',
                boxShadow: '0 0 0 1px rgba(0, 120, 212, 0.2)',
            },
        },
        field: {
            fontSize: '14px',
            padding: '8px 12px',
            fontFamily: 'Raleway, sans-serif',
            lineHeight: '1.4',
        },
        root: {
            marginBottom: '16px',
        },
    };

    return (
        <Callout
            target={target}
            onDismiss={onDismiss}
            directionalHint={DirectionalHint.bottomLeftEdge}
            isBeakVisible={false}
            styles={{
                root: {
                    padding: '0',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid #e1e5e9',
                    backgroundColor: '#ffffff',
                    fontFamily: 'Raleway, sans-serif',
                    minWidth: '400px',
                    maxWidth: '600px',
                },
            }}
        >
            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon 
                            iconName="Save" 
                            styles={{ 
                                root: { 
                                    fontSize: '16px', 
                                    color: '#0078d4',
                                } 
                            }} 
                        />
                        <Text styles={{ 
                            root: { 
                                fontSize: '18px', 
                                fontWeight: '600',
                                color: '#323130',
                                margin: '0',
                            } 
                        }}>
                            Save Custom Snippet
                        </Text>
                    </div>
                    <Icon 
                        iconName="Cancel" 
                        onClick={onDismiss}
                        styles={{ 
                            root: { 
                                fontSize: '14px', 
                                color: '#666',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '4px',
                                ':hover': {
                                    backgroundColor: '#f3f2f1',
                                    color: '#d83b01',
                                }
                            } 
                        }} 
                    />
                </div>

                {/* Content Preview */}
                {previewText && (
                    <div style={{ marginBottom: '20px' }}>
                        <Text styles={{ 
                            root: { 
                                fontSize: '14px', 
                                fontWeight: '600',
                                color: '#323130',
                                marginBottom: '8px',
                                display: 'block',
                            } 
                        }}>
                            Content Preview
                        </Text>
                        <div style={{
                            fontSize: '13px',
                            color: '#666',
                            lineHeight: '1.5',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            border: '1px solid #e1e5e9',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '120px',
                            overflowY: 'auto',
                            fontFamily: 'Raleway, sans-serif',
                        }}>
                            {previewText}
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <Stack tokens={{ childrenGap: 0 }}>
                    <div>
                        <Text styles={{ 
                            root: { 
                                fontSize: '14px', 
                                fontWeight: '600',
                                color: '#323130',
                                marginBottom: '6px',
                                display: 'block',
                            } 
                        }}>
                            Snippet Label *
                        </Text>
                        <TextField
                            placeholder="Enter a descriptive label"
                            value={label}
                            onChange={(_, v) => setLabel(v || '')}
                            styles={textFieldStyles}
                        />
                    </div>

                    <div>
                        <Text styles={{ 
                            root: { 
                                fontSize: '14px', 
                                fontWeight: '600',
                                color: '#323130',
                                marginBottom: '6px',
                                display: 'block',
                            } 
                        }}>
                            Sort Order
                        </Text>
                        <TextField
                            type="number"
                            placeholder="0"
                            value={String(sortOrder)}
                            onChange={(_, v) => setSortOrder(Number(v) || 0)}
                            styles={textFieldStyles}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <Checkbox
                            label="Create as new snippet"
                            checked={isNew}
                            onChange={(_, checked) => setIsNew(!!checked)}
                            styles={{
                                root: {
                                    marginBottom: '0',
                                },
                                text: {
                                    fontSize: '14px',
                                    fontFamily: 'Raleway, sans-serif',
                                    color: '#323130',
                                },
                            }}
                        />
                    </div>
                </Stack>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                }}>
                    <DefaultButton
                        text="Cancel"
                        styles={{
                            root: {
                                backgroundColor: '#ffffff',
                                border: '1px solid #e1e5e9',
                                borderRadius: '4px',
                                fontWeight: '500',
                                fontSize: '14px',
                                padding: '8px 20px',
                                fontFamily: 'Raleway, sans-serif',
                                color: '#666',
                                minWidth: '80px',
                            },
                            rootHovered: {
                                backgroundColor: '#f8f9fa',
                                borderColor: '#0078d4',
                                color: '#0078d4',
                            },
                        }}
                        onClick={onDismiss}
                    />
                    <PrimaryButton
                        text="Save Snippet"
                        styles={{
                            root: {
                                backgroundColor: '#0078d4',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '500',
                                fontSize: '14px',
                                padding: '8px 20px',
                                fontFamily: 'Raleway, sans-serif',
                                minWidth: '120px',
                            },
                            rootHovered: {
                                backgroundColor: '#106ebe',
                            },
                            rootPressed: {
                                backgroundColor: '#005a9e',
                            },
                        }}
                        onClick={() => onSave({ label, sortOrder, isNew })}
                        disabled={!label.trim()}
                    />
                </div>
            </div>
        </Callout>
    );
};

export default SnippetEditPopover;
