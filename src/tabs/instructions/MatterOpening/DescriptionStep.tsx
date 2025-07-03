import React from "react";
import { Stack, PrimaryButton } from "@fluentui/react";
import { sharedPrimaryButtonStyles } from "../../../app/styles/ButtonStyles";
import BubbleTextField from "../../../app/styles/BubbleTextField";
import { useTheme } from "../../../app/functionality/ThemeContext";

interface DescriptionStepProps {
    description: string;
    setDescription: (v: string) => void;
    onContinue?: () => void;
}

const DescriptionStep: React.FC<DescriptionStepProps> = ({
    description,
    setDescription,
    onContinue,
}) => {
    const { isDarkMode } = useTheme();
    return (
        <Stack tokens={{ childrenGap: 12 }}>
            <div className="question-banner">Matter Description</div>
            <BubbleTextField
                multiline
                autoAdjustHeight
                minHeight="80px"
                value={description}
                onChange={(_, newVal) => setDescription(newVal || "")}
                placeholder="Enter matter description..."
                ariaLabel="Matter description"
                isDarkMode={isDarkMode}
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
