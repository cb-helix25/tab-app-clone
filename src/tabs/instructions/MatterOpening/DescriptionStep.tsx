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
        <Stack tokens={{ childrenGap: 20 }}>
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
