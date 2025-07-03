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
    <Stack tokens={{ childrenGap: 12 }}>
        <div className="question-banner">Select NetDocuments Folder Structure</div>
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
        <div style={{ height: 1, background: '#e3e8ef', margin: '12px 0' }} />
    </Stack>
);

export default FolderStructureStep;