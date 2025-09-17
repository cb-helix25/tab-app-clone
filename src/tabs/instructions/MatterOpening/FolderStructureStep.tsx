//
import React from 'react'; // invisible change // invisible change
// invisible change 2.2
import { Stack, Text } from '@fluentui/react';
import '../../../app/styles/MultiSelect.css';
import ModernMultiSelect from './ModernMultiSelect';

interface FolderStructureStepProps {
    folderStructure: string;
    setFolderStructure: (v: string) => void;
    onContinue: () => void;
    folderOptions: string[];
}

const FolderStructureStep: React.FC<FolderStructureStepProps> = ({ folderStructure, setFolderStructure, onContinue, folderOptions }) => {
    // Professional theme colors
    const colours = {
        bg: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '#E2E8F0',
        text: '#0F172A',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
    };

    return (
        <div style={{
            background: colours.bg,
            border: `1px solid ${colours.border}`,
            borderRadius: 12,
            padding: 20,
            boxShadow: colours.shadow,
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
                    <i className="ms-Icon ms-Icon--FolderHorizontal" style={{ 
                        fontSize: 16, 
                        color: '#3690CE' 
                    }} />
                    <span style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: colours.text 
                    }}>
                        Select NetDocuments Folder Structure
                    </span>
                </div>
                
                <ModernMultiSelect
                    label=""
                    options={folderOptions.map(option => ({ key: option, text: option }))}
                    selectedValue={folderStructure}
                    onSelectionChange={(value) => {
                        setFolderStructure(value);
                        onContinue();
                    }}
                    variant="default"
                />
            </Stack>
        </div>
    );
};

export default FolderStructureStep;