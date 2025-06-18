import React from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import TagButton from './TagButton';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { colours } from '../../../app/styles/colours';

interface FolderStructureStepProps {
    folderStructure: string;
    setFolderStructure: (v: string) => void;
    onContinue: () => void;
    folderOptions: string[];
}

const FolderStructureStep: React.FC<FolderStructureStepProps> = ({ folderStructure, setFolderStructure, onContinue, folderOptions }) => (
    <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center">
        <Stack horizontal wrap tokens={{ childrenGap: 10 }} horizontalAlign="center">
            {folderOptions.map((option) => (
                <TagButton
                    key={option}
                    label={option}
                    active={folderStructure === option}
                    onClick={() => {
                        setFolderStructure(option);
                        onContinue();
                    }}
                    color={colours.highlight}
                />
            ))}
        </Stack>
    </Stack>
);

export default FolderStructureStep;