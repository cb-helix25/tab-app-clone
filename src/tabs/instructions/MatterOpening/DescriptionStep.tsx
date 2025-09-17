//
import React from "react"; // invisible change
// invisible change 2.2
import { Stack, PrimaryButton } from "@fluentui/react";
import { sharedPrimaryButtonStyles } from "../../../app/styles/ButtonStyles";
import BubbleTextField from "../../../app/styles/BubbleTextField";
import { useTheme } from "../../../app/functionality/ThemeContext";

interface DescriptionStepProps {
    description: string;
    setDescription: (v: string) => void;
    onContinue?: () => void;
    matterRefPreview?: string;
}

const DescriptionStep: React.FC<DescriptionStepProps> = ({
    description,
    setDescription,
    onContinue,
    matterRefPreview,
}) => {
    const { isDarkMode } = useTheme();
    const colours = {
        dark: {
            bg: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            panel: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            border: '#334155',
            text: '#F1F5F9',
            subtle: '#94A3B8',
            focus: '#3690CE',
            shadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
        },
        light: {
            bg: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            panel: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '#E2E8F0',
            text: '#0F172A',
            subtle: '#64748B',
            focus: '#3690CE',
            shadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
        }
    };
    
    const c = isDarkMode ? colours.dark : colours.light;
    
    return (
        <div style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: 20,
            boxShadow: c.shadow,
            boxSizing: 'border-box'
        }}>
            <Stack tokens={{ childrenGap: 16 }}>
                {/* Professional header with icon */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 4 
                }}>
                    <i className="ms-Icon ms-Icon--EditNote" style={{ 
                        fontSize: 16, 
                        color: '#3690CE' 
                    }} />
                    <span style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: c.text 
                    }}>
                        Matter Description
                    </span>
                </div>
                
                {/* Matter preview card */}
                <div style={{
                    background: c.panel,
                    border: `1px solid ${c.border}`,
                    borderRadius: 10,
                    padding: '14px 16px 12px 16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    marginBottom: 4
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        marginBottom: 8 
                    }}>
                        <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ 
                            fontSize: 18, 
                            color: '#3690CE' 
                        }} />
                        <span style={{ 
                            fontSize: 15, 
                            fontWeight: 700, 
                            color: '#3690CE',
                            letterSpacing: 0.3
                        }}>
                            {matterRefPreview || '[Matter Ref]'}
                        </span>
                    </div>
                    <div style={{ 
                        color: c.text, 
                        fontSize: 14, 
                        fontWeight: 400,
                        minHeight: 20,
                        opacity: description ? 1 : 0.6,
                        fontStyle: description ? 'normal' : 'italic',
                        lineHeight: 1.4
                    }}>
                        {description || 'Matter description will appear here...'}
                    </div>
                </div>
                
                {/* Modern input field */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        style={{
                            width: '100%',
                            background: description ? '#3690CE08' : c.panel,
                            border: description ? '2px solid #3690CE' : `1px solid ${c.border}`,
                            borderRadius: 10,
                            fontSize: 15,
                            color: c.text,
                            fontWeight: 400,
                            padding: '14px 16px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            boxShadow: description ? '0 0 0 3px rgba(54, 144, 206, 0.1)' : 'none',
                        }}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Enter matter description..."
                        onFocus={(e) => {
                            e.target.style.borderColor = '#3690CE';
                            e.target.style.boxShadow = '0 0 0 3px rgba(54, 144, 206, 0.1)';
                        }}
                        onBlur={(e) => {
                            if (!description) {
                                e.target.style.borderColor = c.border;
                                e.target.style.boxShadow = 'none';
                            }
                        }}
                    />
                </div>
                
                {onContinue && (
                    <PrimaryButton
                        text="Continue"
                        onClick={onContinue}
                        styles={{
                            root: {
                                background: 'linear-gradient(135deg, #3690CE 0%, #2563EB 100%)',
                                border: 'none',
                                borderRadius: 10,
                                height: 44,
                                fontWeight: 600,
                                fontSize: 14,
                                boxShadow: c.shadow,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                ':hover': {
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
                                },
                                ':active': {
                                    transform: 'translateY(0)'
                                }
                            }
                        }}
                    />
                )}
            </Stack>
        </div>
    );
};

export default DescriptionStep;
