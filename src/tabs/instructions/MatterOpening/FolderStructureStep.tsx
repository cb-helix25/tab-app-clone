import React from 'react';
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';

interface FolderStructureStepProps {
    folderStructure: string;
    setFolderStructure: (v: string) => void;
    onContinue: () => void;
    folderOptions: string[];
}

const FolderStructureStep: React.FC<FolderStructureStepProps> = ({ folderStructure, setFolderStructure, onContinue, folderOptions }) => (
    <Stack tokens={{ childrenGap: 20 }}>
        <Text variant="mediumPlus" style={{ marginBottom: 6, textAlign: 'center' }}>
            Select NetDocuments Folder Structure
        </Text>
        <div className="MultiSelect-bar">
            {folderOptions.map((option) => (
                <div
                    key={option}
                    className={`MultiSelect-segment${folderStructure === option ? ' active' : ''}`}
                    onClick={() => {
                        setFolderStructure(option);
                        onContinue();
                    }}
                >
                    {option}
                </div>
            ))}
        </div>
    </Stack>
);

export default FolderStructureStep;