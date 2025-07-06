import React from "react";
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
    return (
        <Stack tokens={{ childrenGap: 12 }}>
            <div className="question-banner">Matter Description</div>
            {/* Mini preview below banner, styled like MatterOverview */}
            <div style={{
                marginBottom: 8,
                padding: '12px 16px 10px 16px',
                background: '#fff',
                border: '1px solid #e3e8ef',
                borderRadius: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                width: '100%',
                boxSizing: 'border-box',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                        <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ fontSize: 22, color: '#3690CE' }} aria-hidden="true" />
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3690CE', letterSpacing: 0.2 }}>
                        {matterRefPreview || '[Matter Ref]'}
                    </span>
                </div>
                <div style={{ color: '#061733', fontSize: 15, fontWeight: 400, minHeight: 18, opacity: description ? 1 : 0.7, fontStyle: description ? 'normal' : 'italic' }}>
                    {description || 'Matter description will appear here.'}
                </div>
            </div>
            <input
                type="text"
                className="matter-description-input"
                style={{
                    width: '100%',
                    background: description ? '#3690CE22' : '#F4F4F6',
                    border: description ? '1px solid #3690CE' : '1px solid #e0e0e0',
                    borderRadius: 0,
                    fontSize: 16,
                    color: '#061733',
                    fontWeight: 400,
                    padding: '16px 18px',
                    transition: 'background 0.2s, color 0.2s, border 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    boxShadow: 'none',
                }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter matter description..."
                aria-label="Matter description"
            />
            <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
            {onContinue && (
                <PrimaryButton
                    text="Continue"
                    onClick={onContinue}
                    styles={sharedPrimaryButtonStyles}
                />
            )}
        </Stack>
    );
};

export default DescriptionStep;
