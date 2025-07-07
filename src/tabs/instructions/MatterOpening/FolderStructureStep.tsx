//
import React from 'react'; // invisible change // invisible change
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';
import ModernMultiSelect from './ModernMultiSelect';

interface FolderStructureStepProps {
    folderStructure: string;
    setFolderStructure: (v: string) => void;
    onContinue: () => void;
    folderOptions: string[];
}

const FolderStructureStep: React.FC<FolderStructureStepProps> = ({ folderStructure, setFolderStructure, onContinue, folderOptions }) => ( // invisible change
    <Stack tokens={{ childrenGap: 12 }}>
        <ModernMultiSelect
            label="Select NetDocuments Folder Structure"
            options={folderOptions.map(option => ({ key: option, text: option }))}
            selectedValue={folderStructure}
            onSelectionChange={(value) => {
                setFolderStructure(value);
                onContinue();
            }}
            variant="default"
        />
    </Stack>
);

export default FolderStructureStep;